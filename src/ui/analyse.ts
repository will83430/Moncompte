/* ═══════════════════════════════════════════════════════════════
   analyse.ts — Analyse par catégorie
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { fmt } from './format';

export function renderAnalyse(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  const el = document.getElementById('sec-analyse');
  if (!el) return;

  const txs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(month) &&
    (mode === 'previsionnel' ? true : !t.planned) &&
    t.kind === 'expense'
  );

  if (txs.length === 0) {
    el.innerHTML = '<p class="tx-empty">Aucune dépense ce mois-ci</p>';
    return;
  }

  // Grouper par catégorie
  const byCat = new Map<string, number>();
  for (const t of txs) {
    byCat.set(t.cat, (byCat.get(t.cat) ?? 0) + t.amountCents);
  }

  const total = [...byCat.values()].reduce((s, v) => s + v, 0);
  const sorted = [...byCat.entries()].sort(([, a], [, b]) => b - a);

  el.innerHTML = `
    <div class="analyse-total">Total dépenses : ${fmt(total)}</div>
    <div class="analyse-list">
      ${sorted.map(([cat, cents]) => {
        const pct = total > 0 ? Math.round((cents / total) * 100) : 0;
        return `
          <div class="analyse-item">
            <div class="analyse-cat">${cat}</div>
            <div class="analyse-bar-wrap">
              <div class="analyse-bar" style="width:${pct}%"></div>
            </div>
            <div class="analyse-amount">${fmt(cents)} <span class="analyse-pct">${pct}%</span></div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
