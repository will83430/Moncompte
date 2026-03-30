/* ═══════════════════════════════════════════════════════════════
   balance.ts — Calcul du solde bancaire
   Fonction PURE : aucun accès à l'état global, 100% testable
   ═══════════════════════════════════════════════════════════════ */

import { BalanceAnchor, MonthKey, Transaction, isRealIncome, isRealExpense } from './types';

// ── Helpers MonthKey ──────────────────────────────────────────

export function monthToInt(mk: MonthKey): number {
  const [y, m] = mk.split('-').map(Number) as [number, number];
  return y * 12 + m;
}

export function intToMonth(n: number): MonthKey {
  const y = Math.floor((n - 1) / 12);
  const m = ((n - 1) % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}` as MonthKey;
}

export function prevMonth(mk: MonthKey): MonthKey {
  return intToMonth(monthToInt(mk) - 1);
}

export function nextMonth(mk: MonthKey): MonthKey {
  return intToMonth(monthToInt(mk) + 1);
}

export function currentMonthKey(): MonthKey {
  return new Date().toISOString().slice(0, 7) as MonthKey;
}

// ── Calcul du bilan mensuel ───────────────────────────────────

function monthBilan(mk: MonthKey, accountId: string, txs: Transaction[]): number {
  const monthly = txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(mk)
  );
  const inc = monthly.filter(isRealIncome).reduce((s, t) => s + t.amountCents, 0);
  const exp = monthly.filter(isRealExpense).reduce((s, t) => s + t.amountCents, 0);
  return inc - exp;
}

// ── Fonction principale ───────────────────────────────────────

/**
 * Calcule le solde bancaire estimé pour un mois donné.
 *
 * @param targetMonth  Le mois cible (YYYY-MM)
 * @param anchor       La référence connue : solde exact à la fin d'un mois passé
 * @param txs          Toutes les transactions (filtrées par compte en interne)
 * @returns            Solde en centimes, ou null si pas d'ancre
 */
export function computeBalance(
  targetMonth: MonthKey,
  anchor:      BalanceAnchor | null | undefined,
  txs:         Transaction[]
): number | null {
  if (!anchor) return null;

  const { amountCents, month: anchorMonth, accountId } = anchor;

  if (targetMonth === anchorMonth) return amountCents;

  const anchorN = monthToInt(anchorMonth);
  const targetN = monthToInt(targetMonth);
  const step    = targetN > anchorN ? 1 : -1;

  let balance = amountCents;

  if (step > 0) {
    // Avance : on ajoute le bilan de chaque mois entre ancre+1 et target
    for (let n = anchorN + 1; n <= targetN; n++) {
      balance += monthBilan(intToMonth(n), accountId, txs);
    }
  } else {
    // Recule : on soustrait le bilan de chaque mois entre ancre et target+1
    for (let n = anchorN; n > targetN; n--) {
      balance -= monthBilan(intToMonth(n), accountId, txs);
    }
  }

  return balance;
}

/**
 * Calcule le solde prévu en incluant les transactions planifiées.
 * Utilisé en mode "Prévision".
 */
export function computeProjectedBalance(
  targetMonth: MonthKey,
  anchor:      BalanceAnchor | null | undefined,
  txs:         Transaction[]
): number | null {
  if (!anchor) return null;

  // Solde réel
  const realBalance = computeBalance(targetMonth, anchor, txs);
  if (realBalance === null) return null;

  // Ajouter les transactions prévues du mois cible
  const planned = txs.filter(t =>
    t.accountId === anchor.accountId &&
    t.date.startsWith(targetMonth) &&
    t.planned &&
    (t.kind === 'income' || t.kind === 'expense')
  );

  const plannedInc = planned.filter(t => t.kind === 'income').reduce((s, t) => s + t.amountCents, 0);
  const plannedExp = planned.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amountCents, 0);

  return realBalance + plannedInc - plannedExp;
}
