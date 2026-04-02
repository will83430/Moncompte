/* ═══════════════════════════════════════════════════════════════
   service.ts — Couche service : opérations métier sur AppData
   Toutes les fonctions sont PURES (AppData → AppData)
   Le Store gère la persistance, pas ce fichier.
   ═══════════════════════════════════════════════════════════════ */

import {
  AppData, Transaction, RecurringTemplate, Account, BalanceAnchor, Goal,
  TxId, AccountId, RecId, MonthKey, IsoDate,
  mkTxId, mkRecId,
} from './types';
import { computeBalance, computeProjectedBalance } from './balance';
import { createTransfer, deleteTransfer, TransferParams } from './transfers';

// ── Transactions ──────────────────────────────────────────────

/** Construit la tx miroir planifiée dans le compte lié.
 *  Livret (savings) → income (versement)
 *  Crédit (credit)  → expense (remboursement) */
function buildMirrorTx(source: Transaction, linkedAccount: Account, mirrorId: TxId): Transaction {
  const kind: 'income' | 'expense' = linkedAccount.type === 'savings' ? 'income' : 'expense';
  const cat  = linkedAccount.type === 'savings' ? 'livret' : 'credit_conso';
  return {
    id:          mirrorId,
    accountId:   linkedAccount.id,
    date:        source.date,
    amountCents: source.amountCents,
    kind,
    cat,
    desc:        source.desc,
    planned:     true,
    recurring:   source.recurring,
    ...(source.recId ? { recId: source.recId } : {}),
  };
}

export function addTransaction(
  data: AppData,
  tx: Omit<Transaction, 'id'>
): AppData {
  const newId  = mkTxId();
  let newTx: Transaction = { ...tx, id: newId };

  if (tx.creditAccountId) {
    const linkedAccount = data.accounts.find(a => a.id === tx.creditAccountId);
    if (linkedAccount) {
      const mirrorId = mkTxId();
      const mirrorTx = buildMirrorTx(newTx, linkedAccount, mirrorId);
      newTx = { ...newTx, creditTxId: mirrorId };
      return { ...data, txs: [...data.txs, newTx, mirrorTx] };
    }
  }

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

/** Met à jour une tx et synchronise la tx miroir (date, montant, desc). */
export function updateTransactionWithMirror(
  data: AppData,
  id: TxId,
  patch: Partial<Omit<Transaction, 'id'>>
): AppData {
  let updated = updateTransaction(data, id, patch);
  const tx = updated.txs.find(t => t.id === id);
  if (tx?.creditTxId) {
    const mirrorPatch: Partial<Omit<Transaction, 'id'>> = {};
    if (patch.date        !== undefined) mirrorPatch.date        = patch.date;
    if (patch.amountCents !== undefined) mirrorPatch.amountCents = patch.amountCents;
    if (patch.desc        !== undefined) mirrorPatch.desc        = patch.desc;
    if (Object.keys(mirrorPatch).length > 0) {
      updated = updateTransaction(updated, tx.creditTxId, mirrorPatch);
    }
  }
  return updated;
}

export function deleteTransaction(data: AppData, id: TxId): AppData {
  const tx = data.txs.find(t => t.id === id);
  let filtered = data.txs.filter(t => t.id !== id);
  // Supprime aussi la tx miroir si elle existe
  if (tx?.creditTxId) {
    filtered = filtered.filter(t => t.id !== tx.creditTxId);
  }
  return { ...data, txs: filtered };
}

/** Valide une transaction planifiée (planned → false).
 *  - Si virement (transferId) : valide les deux jambes.
 *  - Si tx miroir (creditTxId) : valide aussi la tx du compte lié. */
export function confirmTransaction(data: AppData, id: TxId): AppData {
  const tx = data.txs.find(t => t.id === id);
  if (!tx) return data;

  let updated = updateTransaction(data, id, { planned: false });

  // Virement : confirmer l'autre jambe aussi
  if (tx.transferId) {
    const other = data.txs.find(t => t.transferId === tx.transferId && t.id !== id);
    if (other) updated = updateTransaction(updated, other.id, { planned: false });
  }

  // Compte lié : confirmer la tx miroir
  if (tx.creditTxId) {
    updated = updateTransaction(updated, tx.creditTxId, { planned: false });
  }

  return updated;
}

/** Remet une transaction en mode planifié.
 *  - Si virement (transferId) : remet les deux jambes en prévu.
 *  - Si tx miroir (creditTxId) : remet aussi la tx du compte lié. */
export function revertToPlanned(data: AppData, id: TxId): AppData {
  const tx = data.txs.find(t => t.id === id);
  if (!tx) return data;

  let updated = updateTransaction(data, id, { planned: true });

  // Virement : annuler l'autre jambe aussi
  if (tx.transferId) {
    const other = data.txs.find(t => t.transferId === tx.transferId && t.id !== id);
    if (other) updated = updateTransaction(updated, other.id, { planned: true });
  }

  // Compte lié : remettre la tx miroir en prévu
  if (tx.creditTxId) {
    updated = updateTransaction(updated, tx.creditTxId, { planned: true });
  }

  return updated;
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

    const sourceTxId = mkTxId();
    const sourceTx: Transaction = {
      id:          sourceTxId,
      accountId,
      date,
      amountCents: rec.amountCents,
      kind:        rec.kind,
      cat:         rec.cat,
      desc:        rec.desc,
      planned:     true,
      recurring:   true,
      recId:       rec.id,
      ...(rec.creditAccountId ? { creditAccountId: rec.creditAccountId } : {}),
    };

    if (rec.creditAccountId) {
      const linkedAccount = data.accounts.find(a => a.id === rec.creditAccountId);
      if (linkedAccount) {
        const mirrorId = mkTxId();
        const mirrorTx = buildMirrorTx({ ...sourceTx, recId: rec.id }, linkedAccount, mirrorId);
        newTxs.push({ ...sourceTx, creditTxId: mirrorId }, mirrorTx);
        continue;
      }
    }

    newTxs.push(sourceTx);
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
