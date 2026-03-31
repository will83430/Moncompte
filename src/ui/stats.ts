/* ═══════════════════════════════════════════════════════════════
   stats.ts — Stub graphiques (implémentation dans Phase 4b)
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';

export function renderStats(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  // TODO Phase 4b : donut + barres 3/6/12 mois
  const el = document.getElementById('sec-stats');
  if (el) el.innerHTML = '<p style="padding:2rem;text-align:center;color:#888">Graphiques — bientôt</p>';
}
