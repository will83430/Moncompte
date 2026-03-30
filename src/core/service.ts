/* ═══════════════════════════════════════════════════════════════
   service.ts — Couche service : opérations métier sur AppData
   Toutes les fonctions sont PURES (AppData → AppData)
   Le Store gère la persistance, pas ce fichier.
   ═══════════════════════════════════════════════════════════════ */

import {
  AppData, Transaction, RecurringTemplate, Account, BalanceAnchor, Goal,
  TxId, AccountId, RecId, MonthKey, IsoDate,
  mkTxId, mkRecId,
  isRealIncome, isRealExpense, toMonthKey,
} from './types';
import { computeBalance, computeProjectedBalance, currentMonthKey } from './balance';
import { createTransfer, deleteTransfer, TransferParams } from './transfers';

// ── Transactions ──────────────────────────────────────────────

export function addTransaction(
  data: AppData,
  tx: Omit<Transaction, 'id'>
): AppData {
  const newTx: Transaction = { ...tx, id: mkTxId() };
  return { ...data, txs: [...data.txs, newTx] };
}

export function updateTransaction(
  data: AppData,
  id: TxId,
  patch: Partial<Omit<Transaction, 'id'>>
): AppData {
  return {
    ...data,
    txs: data.txs.map(t => t.id === id ? { ...t, ...patch } : t),
  };
}

export function deleteTransaction(data: AppData, id: TxId): AppData {
  return { ...data, txs: data.txs.filter(t => t.id !== id) };
}

/** Valide une transaction planifiée (planned → false) */
export function confirmTransaction(data: AppData, id: TxId): AppData {
  return updateTransaction(data, id, { planned: false });
}

/** Remet une transaction en mode planifié */
export function revertToPlanned(data: AppData, id: TxId): AppData {
  return updateTransaction(data, id, { planned: true });
}

// ── Virements ─────────────────────────────────────────────────

export function addTransfer(data: AppData, params: TransferParams): AppData {
  const [out, inn] = createTransfer(params);
  return { ...data, txs: [...data.txs, out, inn] };
}

export function removeTransfer(data: AppData, transferId: import('./types').TransferId): AppData {
  return { ...data, txs: deleteTransfer(transferId, data.txs) };
}

// ── Récurrentes ───────────────────────────────────────────────

export function addRecurring(
  data: AppData,
  rec: Omit<RecurringTemplate, 'id'>
): AppData {
  const newRec: RecurringTemplate = { ...rec, id: mkRecId() };
  return { ...data, recs: [...data.recs, newRec] };
}

export function updateRecurring(
  data: AppData,
  id: RecId,
  patch: Partial<Omit<RecurringTemplate, 'id'>>
): AppData {
  return {
    ...data,
    recs: data.recs.map(r => r.id === id ? { ...r, ...patch } : r),
  };
}

export function deleteRecurring(data: AppData, id: RecId): AppData {
  return { ...data, recs: data.recs.filter(r => r.id !== id) };
}

/**
 * Génère les transactions planifiées pour un mois depuis les récurrentes actives.
 * N'écrase pas les transactions déjà existantes pour ce mois+recId.
 */
export function generatePlannedFromRecs(
  data: AppData,
  month: MonthKey,
  accountId: AccountId
): AppData {
  const recs = data.recs.filter(r => r.accountId === accountId && r.active);
  const [year, monthNum] = month.split('-').map(Number) as [number, number];

  const newTxs: Transaction[] = [];

  for (const rec of recs) {
    // Vérifie si une transaction liée à cette récurrente existe déjà ce mois
    const alreadyExists = data.txs.some(t =>
      t.recId === rec.id && t.date.startsWith(month)
    );
    if (alreadyExists) continue;

    const day = Math.min(rec.dayOfMonth, daysInMonth(year, monthNum));
    const date = `${month}-${String(day).padStart(2, '0')}` as IsoDate;

    newTxs.push({
      id:          mkTxId(),
      accountId,
      date,
      amountCents: rec.amountCents,
      kind:        rec.kind,
      cat:         rec.cat,
      desc:        rec.desc,
      planned:     true,
      recurring:   true,
      recId:       rec.id,
    });
  }

  if (newTxs.length === 0) return data;
  return { ...data, txs: [...data.txs, ...newTxs] };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ── Ancres (solde bancaire) ───────────────────────────────────

/**
 * Définit (ou remplace) l'ancre de solde pour un compte donné.
 * @param amountCents  Solde saisi par l'utilisateur (en centimes)
 * @param atEndOfMonth Mois auquel ce solde correspond (fin de mois)
 */
export function setAnchor(
  data: AppData,
  accountId: AccountId,
  amountCents: number,
  atEndOfMonth: MonthKey
): AppData {
  const newAnchor: BalanceAnchor = {
    accountId,
    amountCents,
    month: atEndOfMonth,
    setAt: new Date().toISOString(),
  };
  const anchors = data.anchors.filter(a => a.accountId !== accountId);
  return { ...data, anchors: [...anchors, newAnchor] };
}

export function getAnchor(data: AppData, accountId: AccountId): BalanceAnchor | undefined {
  return data.anchors.find(a => a.accountId === accountId);
}

// ── Comptes ───────────────────────────────────────────────────

export function addAccount(data: AppData, account: Account): AppData {
  return { ...data, accounts: [...data.accounts, account] };
}

export function deleteAccountData(data: AppData, accountId: AccountId): AppData {
  return {
    ...data,
    txs:     data.txs.filter(t => t.accountId !== accountId),
    recs:    data.recs.filter(r => r.accountId !== accountId),
    anchors: data.anchors.filter(a => a.accountId !== accountId),
    accounts: data.accounts.filter(a => a.id !== accountId),
  };
}

// ── Objectifs ─────────────────────────────────────────────────

export function addGoal(data: AppData, goal: Omit<Goal, 'id'>): AppData {
  const newGoal: Goal = { ...goal, id: crypto.randomUUID() };
  return { ...data, goals: [...data.goals, newGoal] };
}

export function updateGoal(data: AppData, id: string, patch: Partial<Goal>): AppData {
  return {
    ...data,
    goals: data.goals.map(g => g.id === id ? { ...g, ...patch } : g),
  };
}

export function deleteGoal(data: AppData, id: string): AppData {
  return { ...data, goals: data.goals.filter(g => g.id !== id) };
}

// ── Requêtes / lecture ────────────────────────────────────────

export interface MonthSummary {
  incomeCents:  number;
  expenseCents: number;
  bilanCents:   number;
}

export function getMonthSummary(
  data: AppData,
  month: MonthKey,
  accountId: AccountId,
  mode: 'reel' | 'previsionnel' = 'reel'
): MonthSummary {
  const txs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(month) &&
    (t.kind === 'income' || t.kind === 'expense')
  );

  const realTxs = mode === 'reel'
    ? txs.filter(t => !t.planned)
    : txs;

  const incomeCents  = realTxs.filter(t => t.kind === 'income')
    .reduce((s, t) => s + t.amountCents, 0);
  const expenseCents = realTxs.filter(t => t.kind === 'expense')
    .reduce((s, t) => s + t.amountCents, 0);

  return { incomeCents, expenseCents, bilanCents: incomeCents - expenseCents };
}

export function getBankBalance(
  data: AppData,
  targetMonth: MonthKey,
  accountId: AccountId
): number | null {
  const anchor = getAnchor(data, accountId);
  return computeBalance(targetMonth, anchor, data.txs);
}

export function getProjectedBalance(
  data: AppData,
  targetMonth: MonthKey,
  accountId: AccountId
): number | null {
  const anchor = getAnchor(data, accountId);
  return computeProjectedBalance(targetMonth, anchor, data.txs);
}
