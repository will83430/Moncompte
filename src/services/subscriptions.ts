/* ═══════════════════════════════════════════════════════════════
   subscriptions.ts — Détection automatique des abonnements/prélèvements récurrents
   ═══════════════════════════════════════════════════════════════ */

import type { AppData, AccountId } from '../core/types';

export interface DetectedSubscription {
  name:         string;
  cat:          string;
  amountCents:  number;
  lastDate:     string;
  nextDate:     string;
  monthCount:   number;
  annualCost:   number;
}

// Normalise une description pour regrouper les doublons
function normalizeDesc(desc: string): string {
  return desc
    .toLowerCase()
    // Supprimer dates sous toutes formes
    .replace(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/g, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    // Supprimer références numériques longues (CB, numéros de carte, etc.)
    .replace(/\b\d{4,}\b/g, '')
    // Supprimer préfixes bancaires courants
    .replace(/^(cb |vir |prélèvement |prel |prelevement |virement |facture |abonnement )/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calcule le mois suivant
function addOneMonth(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  const next = new Date(y, m - 1 + 1, 1);
  const nm = next.getMonth() + 1;
  const ny = next.getFullYear();
  const maxDay = new Date(ny, nm, 0).getDate();
  const day = Math.min(d, maxDay);
  return `${ny}-${String(nm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function detectSubscriptions(data: AppData, accountId: AccountId): DetectedSubscription[] {
  const expenses = data.txs.filter(t =>
    t.accountId === accountId &&
    t.kind === 'expense' &&
    !t.planned &&
    t.desc.trim().length > 1
  );

  // Grouper par description normalisée
  const groups = new Map<string, typeof expenses>();
  for (const tx of expenses) {
    const key = normalizeDesc(tx.desc);
    if (!key || key.length < 2) continue;
    const g = groups.get(key) ?? [];
    g.push(tx);
    groups.set(key, g);
  }

  const result: DetectedSubscription[] = [];

  for (const [, txs] of groups) {
    if (txs.length < 2) continue;

    // Trier par date
    txs.sort((a, b) => a.date.localeCompare(b.date));

    // Vérifier cohérence des montants (±15%)
    const amounts = txs.map(t => t.amountCents);
    const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    if (avgAmount < 50) continue; // Ignorer moins de 0,50 €
    const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.15);
    if (!allSimilar) continue;

    // Vérifier la régularité mensuelle
    const months = new Set(txs.map(t => t.date.slice(0, 7)));
    if (months.size < 2) continue;

    const sortedMonths = [...months].sort();
    const firstMk = sortedMonths[0]!;
    const lastMk  = sortedMonths[sortedMonths.length - 1]!;
    const [fy, fm] = firstMk.split('-').map(Number) as [number, number];
    const [ly, lm] = lastMk.split('-').map(Number)  as [number, number];
    const monthSpan = (ly - fy) * 12 + (lm - fm) + 1;

    // Au moins 50% des mois couverts
    if (months.size < Math.max(2, monthSpan * 0.5)) continue;

    const lastTx   = txs[txs.length - 1]!;
    const nextDate = addOneMonth(lastTx.date);

    result.push({
      name:        lastTx.desc,
      cat:         lastTx.cat,
      amountCents: Math.round(avgAmount),
      lastDate:    lastTx.date,
      nextDate,
      monthCount:  months.size,
      annualCost:  Math.round(avgAmount * 12),
    });
  }

  return result.sort((a, b) => b.amountCents - a.amountCents);
}
