/* ═══════════════════════════════════════════════════════════════
   migrations.ts — Migration données v1 → v2

   Format v1 :
   - mc4_data (chiffré) : { txs, recs, budget, goals }
   - mc4_balref (clair) : { [accountId]: { amount, month } }
   - mc4_accounts (clair) : Account[]
   - mc4_cats (clair) : CustomCategory[]

   Format v2 :
   - mc5_data (chiffré) : AppData (version: 2)
   ═══════════════════════════════════════════════════════════════ */

import {
  AppData, Transaction, RecurringTemplate, Account, BalanceAnchor,
  CustomCategory, Goal,
  TxId, AccountId, RecId, IsoDate, MonthKey,
  mkTxId, mkRecId,
} from './types';

// ── Types v1 (non brandés) ────────────────────────────────────

interface V1Transaction {
  id:         number | string;
  type:       string;          // 'income' | 'expense' | 'transfer_out' | 'transfer_in'
  amount:     number;          // euros (float)
  desc:       string;
  cat:        string;
  date:       string;          // YYYY-MM-DD
  accountId?: string;
  planned?:   boolean;
  recurring?: boolean;
  recId?:     string | number;
  transferId?: string;
  transfer?:  boolean;         // ancien flag "virement neutre"
}

interface V1Rec {
  id:        number | string;
  type:      string;
  amount:    number;
  desc:      string;
  cat:       string;
  day:       number;
  accountId: string;
}

interface V1BalRef {
  [accountId: string]: { amount: number; month: string };
}

interface V1Data {
  txs:    V1Transaction[];
  recs:   V1Rec[];
  budget: number;
  goals?: Array<{ id?: string; label: string; targetCents?: number; target?: number; savedCents?: number; saved?: number }>;
}

// ── Normalisation du type ─────────────────────────────────────

function normKind(type: string, transfer?: boolean): Transaction['kind'] {
  if (type === 'transfer_out') return 'transfer_out';
  if (type === 'transfer_in')  return 'transfer_in';
  if (transfer === true) {
    // "virement neutre" v1 : on conserve income/expense mais avec le flag transfer
    // En v2 on utilise transfer_out/transfer_in ; ici on garde le kind d'origine
    // et on laisse la couche UI gérer l'affichage
  }
  if (type === 'income')  return 'income';
  if (type === 'expense') return 'expense';
  return 'expense'; // fallback sûr
}

// ── Migration Transaction v1 → v2 ────────────────────────────

function migrateTransaction(t: V1Transaction, defaultAccountId: string): Transaction {
  const tx: Transaction = {
    id:          (String(t.id)) as TxId,
    accountId:   (t.accountId || defaultAccountId) as AccountId,
    date:        t.date as IsoDate,
    amountCents: Math.round(Math.abs(t.amount) * 100),
    kind:        normKind(t.type, t.transfer),
    cat:         t.cat || 'autre',
    desc:        t.desc || '',
    planned:     t.planned === true,
    recurring:   t.recurring === true,
  };
  if (t.recId)     tx.recId     = String(t.recId) as RecId;
  if (t.transferId) tx.transferId = t.transferId as import('./types').TransferId;
  return tx;
}

// ── Migration Rec v1 → v2 ─────────────────────────────────────

function migrateRec(r: V1Rec): RecurringTemplate {
  return {
    id:          String(r.id) as RecId,
    accountId:   r.accountId as AccountId,
    kind:        r.type === 'income' ? 'income' : 'expense',
    amountCents: Math.round(Math.abs(r.amount) * 100),
    desc:        r.desc || '',
    cat:         r.cat || 'autre',
    dayOfMonth:  r.day || 1,
    active:      true,
  };
}

// ── Migration BalRef v1 → v2 (anchors) ───────────────────────

function migrateBalRef(balRef: V1BalRef | null | undefined): BalanceAnchor[] {
  if (!balRef) return [];
  return Object.entries(balRef).map(([accountId, ref]) => ({
    accountId:   accountId as AccountId,
    amountCents: Math.round(ref.amount * 100),
    month:       ref.month as MonthKey,
    setAt:       new Date().toISOString(),
  }));
}

// ── Fonction principale ───────────────────────────────────────

export interface V1RawData {
  data:     V1Data;
  balRef?:  V1BalRef | null;
  accounts?: Account[];
  customCats?: CustomCategory[];
}

export function migrateV1toV2(raw: V1RawData): AppData {
  const defaultAccountId = 'cc';

  const txs = raw.data.txs.map(t => migrateTransaction(t, defaultAccountId));
  const recs = raw.data.recs.map(r => migrateRec(r));
  const anchors = migrateBalRef(raw.balRef ?? null);

  const goals: Goal[] = (raw.data.goals || []).map(g => ({
    id:          g.id || String(Date.now() + Math.random()),
    label:       g.label,
    targetCents: g.targetCents ?? Math.round((g.target ?? 0) * 100),
    savedCents:  g.savedCents  ?? Math.round((g.saved  ?? 0) * 100),
  }));

  // Convertir mensualite euros→cents pour les comptes crédit (v1 stockait en euros)
  const accounts = (raw.accounts || []).map(acc => {
    if (acc.mensualite && acc.mensualite < 10000) {
      // Si < 10000 c'est en euros (mensualité max réaliste ~9999€/mois)
      return { ...acc, mensualite: Math.round(acc.mensualite * 100) };
    }
    return acc;
  });

  return {
    version:    2,
    txs,
    recs,
    accounts,
    anchors,
    customCats: raw.customCats || [],
    budget:     Math.round((raw.data.budget || 0) * 100),
    goals,
  };
}
