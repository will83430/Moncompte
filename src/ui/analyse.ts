/* ═══════════════════════════════════════════════════════════════
   analyse.ts — Analyse par catégorie
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { setAnchor, getAnchor } from '../core/service';
import { getState, setState } from './app';
import { Nav } from './router';
import { toast } from './toast';
import { fmt, inputToCents } from './format';
import { getCatDef } from '../core/categories';

// ── Solde bancaire réel ───────────────────────────────────────

export async function saveBalRef(): Promise<void> {
  const input = document.getElementById('inp-balref') as HTMLInputElement | null;
  if (!input) return;

  const cents = inputToCents(input.value);
  if (cents <= 0) { toast('Montant invalide'); return; }

  const state     = getState();
  const accountId = Nav.accountId;
  const month     = Nav.month;

  // On stocke le solde saisi sur le mois courant affiché
  const next = setAnchor(state, accountId, cents, month);
  await setState(next);

  // Afficher la confirmation
  const display = document.getElementById('balref-display');
  if (display) {
    display.style.display = 'block';
    const anchor = getAnchor(next, accountId);
    display.textContent = `Référence : ${fmt(anchor!.amountCents)} au ${anchor!.month}`;
  }

  toast(`✓ Solde de référence enregistré : ${fmt(cents)}`);
}

// ── Actions données ───────────────────────────────────────────

export async function clearCurrentAccountTxs(): Promise<void> {
  const state   = getState();
  const id      = Nav.accountId;
  const account = state.accounts.find(a => a.id === id);
  const name    = account?.name ?? id;

  if (!confirm(`Supprimer TOUTES les transactions de "${name}" ?\nLes autres comptes ne sont pas touchés.`)) return;
  if (!confirm(`⚠ DERNIÈRE CONFIRMATION\n\nToutes les transactions de "${name}" seront effacées définitivement.`)) return;

  await setState({ ...state, txs: state.txs.filter(t => t.accountId !== id) });
  toast(`✓ Transactions "${name}" supprimées`);
}

export async function resetAll(): Promise<void> {
  if (!confirm('⚠ ATTENTION\n\nSuppression DÉFINITIVE de toutes les données.')) return;
  if (!confirm('⚠ DERNIÈRE CONFIRMATION\n\nTOUTES les données de TOUS les comptes seront effacées.')) return;

  const state = getState();
  await setState({ ...state, txs: [], recs: [], goals: [], anchors: [] });
  toast('✓ Données supprimées');
}

// Exposer globalement
(window as any).saveBalRef             = saveBalRef;
(window as any).clearCurrentAccountTxs = clearCurrentAccountTxs;
(window as any).resetAll               = resetAll;

// ── Rendu analyse ─────────────────────────────────────────────

export function renderAnalyse(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  // Mettre à jour l'affichage de l'ancre dans le HTML statique
  const anchor  = getAnchor(data, accountId);
  const display = document.getElementById('balref-display');
  if (display) {
    if (anchor) {
      display.style.display = 'block';
      display.textContent   = `Référence : ${fmt(anchor.amountCents)} au ${anchor.month}`;
    } else {
      display.style.display = 'none';
    }
  }

  const catEl = document.getElementById('analyse-by-cat');
  if (!catEl) return;

  const txs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(month) &&
    (mode === 'previsionnel' ? true : !t.planned) &&
    t.kind === 'expense'
  );

  if (txs.length === 0) {
    catEl.innerHTML = '<p class="tx-empty">Aucune dépense ce mois-ci</p>';
    return;
  }

  // Grouper par catégorie
  const byCat = new Map<string, number>();
  for (const t of txs) {
    byCat.set(t.cat, (byCat.get(t.cat) ?? 0) + t.amountCents);
  }

  const total  = [...byCat.values()].reduce((s, v) => s + v, 0);
  const sorted = [...byCat.entries()].sort(([, a], [, b]) => b - a);

  catEl.innerHTML = `
    <div class="card">
      <div class="card-title">Dépenses par catégorie — ${fmt(total)}</div>
      <div class="analyse-list">
        ${sorted.map(([catId, cents]) => {
          const pct    = total > 0 ? Math.round((cents / total) * 100) : 0;
          const catDef = getCatDef(catId, data.customCats);
          return `
            <div class="analyse-item">
              <div class="analyse-cat">${catDef.icon} ${catDef.label}</div>
              <div class="analyse-bar-wrap">
                <div class="analyse-bar" style="width:${pct}%;background:${catDef.color}"></div>
              </div>
              <div class="analyse-amount">${fmt(cents)} <span class="analyse-pct">${pct}%</span></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
