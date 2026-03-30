/* ═══════════════════════════════════════════════════════════════
   Types fondamentaux MonCompte v2
   ═══════════════════════════════════════════════════════════════ */

// ── Identifiants opaques ──────────────────────────────────────
export type TxId       = string & { readonly __brand: 'TxId' };
export type AccountId  = string & { readonly __brand: 'AccountId' };
export type RecId      = string & { readonly __brand: 'RecId' };
export type TransferId = string & { readonly __brand: 'TransferId' };
export type IsoDate    = string & { readonly __brand: 'IsoDate' };  // YYYY-MM-DD
export type MonthKey   = string & { readonly __brand: 'MonthKey' }; // YYYY-MM

export function mkTxId():       TxId       { return crypto.randomUUID() as TxId; }
export function mkTransferId(): TransferId { return crypto.randomUUID() as TransferId; }
export function mkRecId():      RecId      { return crypto.randomUUID() as RecId; }

// ── Comptes ───────────────────────────────────────────────────
export type AccountType = 'checking' | 'savings' | 'credit';

export interface Account {
  id:         AccountId;
  name:       string;
  type:       AccountType;
  icon:       string;
  mensualite?: number; // crédit uniquement, en centimes
}

// ── Transactions ──────────────────────────────────────────────
// income/expense = opérations réelles comptabilisées dans les stats
// transfer_out/transfer_in = deux jambes d'un même virement, JAMAIS dans les stats
export type TxKind = 'income' | 'expense' | 'transfer_out' | 'transfer_in';

export interface Transaction {
  id:          TxId;
  accountId:   AccountId;
  date:        IsoDate;
  /** Toujours positif, exprimé en centimes (ex: 1050 = 10,50 €) */
  amountCents: number;
  kind:        TxKind;
  cat:         string;
  desc:        string;
  planned:     boolean;
  recurring:   boolean;
  recId?:      RecId;       // lien vers la récurrente source
  transferId?: TransferId;  // lien entre les deux jambes d'un virement
}

// ── Récurrentes ───────────────────────────────────────────────
export interface RecurringTemplate {
  id:          RecId;
  accountId:   AccountId;
  kind:        'income' | 'expense';
  amountCents: number;
  desc:        string;
  cat:         string;
  dayOfMonth:  number; // 1–31
  active:      boolean;
}

// ── Référence de solde bancaire ───────────────────────────────
// Stocké dans le blob chiffré (plus en clair dans localStorage)
export interface BalanceAnchor {
  accountId: AccountId;
  /** Solde exact en centimes à la fin du mois 'month' */
  amountCents: number;
  month:     MonthKey;
  setAt:     string; // ISO timestamp
}

// ── Catégorie custom ──────────────────────────────────────────
export interface CustomCategory {
  id:    string;
  label: string;
  icon:  string;
  type:  'income' | 'expense';
}

// ── Objectif d'épargne ────────────────────────────────────────
export interface Goal {
  id:          string;
  label:       string;
  targetCents: number;
  savedCents:  number;
}

// ── Blob de persistance unifié ────────────────────────────────
export interface AppData {
  version:    2;
  txs:        Transaction[];
  recs:       RecurringTemplate[];
  accounts:   Account[];
  anchors:    BalanceAnchor[];
  customCats: CustomCategory[];
  budget:     number; // centimes
  goals:      Goal[];
}

// ── Helpers de type ───────────────────────────────────────────
export function isRealIncome(t: Transaction):   boolean { return t.kind === 'income' && !t.planned; }
export function isRealExpense(t: Transaction):  boolean { return t.kind === 'expense' && !t.planned; }
export function isTransfer(t: Transaction):     boolean { return t.kind === 'transfer_out' || t.kind === 'transfer_in'; }
export function isPlanned(t: Transaction):      boolean { return t.planned; }

export function toMonthKey(date: IsoDate): MonthKey {
  return date.slice(0, 7) as MonthKey;
}
