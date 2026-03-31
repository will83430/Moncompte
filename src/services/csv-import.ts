/* ═══════════════════════════════════════════════════════════════
   csv-import.ts — Import relevé CIC (Filbanque) CSV
   Compatible format ISO-8859-1, séparateur ; ou ,
   ═══════════════════════════════════════════════════════════════ */

import { AppData, Transaction, AccountId, IsoDate } from '../core/types';
import { mkTxId } from '../core/types';

// ── Types ─────────────────────────────────────────────────────

export type CicRowStatus = 'new' | 'ok' | 'diff';

export interface CicRow {
  date:       IsoDate;
  amountCents: number;   // positif = crédit, négatif = débit
  label:      string;
  status:     CicRowStatus;
}

// ── Parser CSV ────────────────────────────────────────────────

export function parseCicCSV(text: string): CicRow[] | null {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  // Trouver la ligne d'en-tête (contient "montant")
  let headerIdx = lines.findIndex(l => l.toLowerCase().includes('montant'));
  if (headerIdx === -1) headerIdx = 0;

  const sep  = lines[headerIdx]!.includes(';') ? ';' : ',';
  const hdrs = lines[headerIdx]!.split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const dateIdx   = hdrs.findIndex(h => h.includes('opérat') || h.includes('operat') || h === 'date');
  const amountIdx = hdrs.findIndex(h => h.includes('montant'));
  const labelIdx  = hdrs.findIndex(h => h.includes('libellé') || h.includes('libelle'));

  if (dateIdx === -1 || amountIdx === -1) return null;

  const result: CicRow[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i]!.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) continue;

    const [d, m, y] = (cols[dateIdx] ?? '').split('/');
    if (!d || !m || !y) continue;

    const rawAmount = (cols[amountIdx] ?? '').replace(',', '.').replace(/\s/g, '');
    const amount    = parseFloat(rawAmount);
    if (isNaN(amount)) continue;

    const label = cols[labelIdx] ?? cols[2] ?? '';

    result.push({
      date:        `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` as IsoDate,
      amountCents: Math.round(amount * 100),
      label:       label.trim(),
      status:      'new', // sera mis à jour par matchAgainstExisting()
    });
  }

  return result.length > 0 ? result : null;
}

// ── Correspondance avec les transactions existantes ───────────

export function matchAgainstExisting(rows: CicRow[], data: AppData, accountId: AccountId): CicRow[] {
  return rows.map(row => {
    const match = data.txs.find(t =>
      t.accountId === accountId &&
      t.date === row.date &&
      Math.abs(t.amountCents - Math.abs(row.amountCents)) < 2 // tolérance 0.01€
    );

    if (!match) return { ...row, status: 'new' as CicRowStatus };

    // Montant légèrement différent → diff
    if (Math.abs(match.amountCents - Math.abs(row.amountCents)) > 0) {
      return { ...row, status: 'diff' as CicRowStatus };
    }

    return { ...row, status: 'ok' as CicRowStatus };
  });
}

// ── Conversion ligne CIC → Transaction v2 ────────────────────

export function cicRowToTransaction(
  row:       CicRow,
  accountId: AccountId,
  isCredit:  boolean
): Transaction {
  const positive = row.amountCents >= 0;
  // Compte courant : crédit (+) = revenu, débit (-) = dépense
  // Compte crédit  : paiement (+) = dépense, nouveau crédit (-) = revenu
  const kind = (isCredit ? !positive : positive) ? 'income' : 'expense';

  return {
    id:          mkTxId(),
    accountId,
    date:        row.date,
    amountCents: Math.abs(row.amountCents),
    kind,
    cat:         kind === 'income' ? 'autre_rev' : 'autre_dep',
    desc:        row.label,
    planned:     false,
    recurring:   false,
  };
}

// ── Import en masse ───────────────────────────────────────────

export function importNewRows(
  data:      AppData,
  rows:      CicRow[],
  accountId: AccountId,
  isCredit:  boolean
): { data: AppData; count: number } {
  const newRows = rows.filter(r => r.status === 'new');
  const newTxs  = newRows.map(r => cicRowToTransaction(r, accountId, isCredit));
  return {
    data:  { ...data, txs: [...data.txs, ...newTxs] },
    count: newTxs.length,
  };
}
