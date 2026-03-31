/* ═══════════════════════════════════════════════════════════════
   app.ts — Bootstrap : PIN → migration → lancement UI
   ═══════════════════════════════════════════════════════════════ */

import { Store } from '../storage/store';
import { migrateV1toV2 } from '../core/migrations';
import { AppData, Account, CustomCategory } from '../core/types';
import { Router } from './router';
import { PinUI } from './pin';

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
  Router.refresh();
}

// ── Bootstrap ─────────────────────────────────────────────────

export async function boot(): Promise<void> {
  const pin = await PinUI.prompt();
  if (!pin) return; // ne devrait pas arriver

  // Premier lancement v2 : migration éventuelle depuis v1
  if (Store.isFirstLaunch()) {
    let initialData: AppData | undefined;

    if (Store.hasV1Data()) {
      initialData = await migrateFromV1(pin);
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
