/* ═══════════════════════════════════════════════════════════════
   app.ts — Bootstrap : PIN → migration → lancement UI
   ═══════════════════════════════════════════════════════════════ */

import { Store } from '../storage/store';
import { migrateV1toV2 } from '../core/migrations';
import { AppData, Account, CustomCategory } from '../core/types';
import { Router } from './router';
import { PinUI } from './pin';
import { scheduleAutoBackup, restoreFromFilesystem } from '../services/backup';
import { computeBalance } from '../core/balance';

// ── État global réactif ───────────────────────────────────────
// Un seul objet mutable, toutes les mutations passent par setState()

let _state: AppData | null = null;

export function getState(): AppData {
  if (!_state) throw new Error('App non initialisée');
  return _state;
}

export async function setState(next: AppData): Promise<void> {
  _state = next;
  await Store.save(next);
  scheduleAutoBackup(next);
  updateWidget(next);
  Router.refresh(next);
}

function updateWidget(data: AppData): void {
  try {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const plugin = cap.Plugins?.WidgetPlugin;
    if (!plugin) return;

    // Compte courant principal (cc)
    const accountId = 'cc';
    const month = new Date().toISOString().slice(0, 7);
    const txs = data.txs.filter(t =>
      t.accountId === accountId && t.date.startsWith(month) && !t.planned
    );
    const inc = txs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const exp = txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);

    const anchor = data.anchors.find(a => a.accountId === accountId);
    let displayBal = inc - exp;
    if (anchor) {
      const bal = computeBalance(month as any, anchor, data.txs);
      if (bal !== null) displayBal = bal;
    }

    const sign = displayBal >= 0 ? '+' : '';
    const fmtW = (c: number) => {
      const v = c / 100;
      return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + '\u00a0€';
    };
    const [y, m] = month.split('-').map(Number) as [number, number];
    const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    plugin.updateWidget({
      month:    label.charAt(0).toUpperCase() + label.slice(1),
      balance:  sign + fmtW(displayBal),
      income:   fmtW(inc),
      expenses: fmtW(exp),
    });
  } catch { /* widget non dispo */ }
}

// ── Bootstrap ─────────────────────────────────────────────────

export async function boot(): Promise<void> {
  const pin = await PinUI.prompt();
  if (!pin) return; // ne devrait pas arriver

  // Premier lancement v2 : restauration Filesystem ou migration v1
  if (Store.isFirstLaunch()) {
    let initialData: AppData | undefined;

    // Priorité 1 : données v1 chiffrées dans localStorage (plus récentes)
    if (Store.hasV1Data()) {
      initialData = await migrateFromV1(pin);
    }
    // Priorité 2 : backup Filesystem si pas de données v1
    if (!initialData) {
      const fromFilesystem = await restoreFromFilesystem();
      if (fromFilesystem) initialData = fromFilesystem;
    }

    const ok = await Store.init(pin, initialData);
    if (!ok) {
      PinUI.showError('Erreur initialisation');
      return;
    }
  } else {
    const ok = await Store.init(pin);
    if (!ok) {
      PinUI.showError('PIN incorrect');
      return;
    }
  }

  _state = await Store.load();
  PinUI.hide();
  updateWidget(_state);
  Router.init(_state);
}

// ── Migration v1 → v2 ─────────────────────────────────────────

async function migrateFromV1(pin: string): Promise<AppData | undefined> {
  try {
    const v1data = await Store.loadV1Raw(pin);
    if (!v1data) return undefined;

    const balRefRaw = localStorage.getItem('mc4_balref');
    const accountsRaw = localStorage.getItem('mc4_accounts');
    const catsRaw = localStorage.getItem('mc4_cats');

    const balRef = balRefRaw ? JSON.parse(balRefRaw) : null;
    const accounts: Account[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    const customCats: CustomCategory[] = catsRaw ? JSON.parse(catsRaw) : [];

    const migrated = migrateV1toV2({
      data: v1data as any,
      balRef,
      accounts,
      customCats,
    });

    // Nettoyage des clés v1 après migration réussie
    Store.cleanupV1();

    return migrated;
  } catch (e) {
    console.error('Migration v1→v2 échouée:', e);
    return undefined;
  }
}
