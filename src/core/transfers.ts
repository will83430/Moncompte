/* ═══════════════════════════════════════════════════════════════
   transfers.ts — Virements entre comptes (atomiques)
   ═══════════════════════════════════════════════════════════════ */

import {
  Transaction, TransferId, AccountId, IsoDate, TxId,
  mkTxId, mkTransferId
} from './types';

export interface TransferParams {
  fromAccountId: AccountId;
  toAccountId:   AccountId;
  amountCents:   number;
  date:          IsoDate;
  desc:          string;
}

/**
 * Crée un virement : retourne TOUJOURS deux transactions atomiques.
 * Les deux sont liées par le même transferId.
 */
export function createTransfer(params: TransferParams): [Transaction, Transaction] {
  const transferId = mkTransferId();

  const out: Transaction = {
    id:          mkTxId(),
    accountId:   params.fromAccountId,
    date:        params.date,
    amountCents: params.amountCents,
    kind:        'transfer_out',
    cat:         'transfer',
    desc:        params.desc,
    planned:     false,
    recurring:   false,
    transferId,
  };

  const inn: Transaction = {
    id:          mkTxId(),
    accountId:   params.toAccountId,
    date:        params.date,
    amountCents: params.amountCents,
    kind:        'transfer_in',
    cat:         'transfer',
    desc:        params.desc,
    planned:     false,
    recurring:   false,
    transferId,
  };

  return [out, inn];
}

/**
 * Suppression atomique : retire les deux jambes d'un virement.
 */
export function deleteTransfer(transferId: TransferId, txs: Transaction[]): Transaction[] {
  return txs.filter(t => t.transferId !== transferId);
}

/**
 * Retrouve les deux jambes d'un virement.
 * Retourne null si le virement est orphelin (une seule jambe).
 */
export function getTransferPair(
  transferId: TransferId,
  txs: Transaction[]
): [Transaction, Transaction] | null {
  const pair = txs.filter(t => t.transferId === transferId);
  if (pair.length !== 2) return null;

  const out = pair.find(t => t.kind === 'transfer_out');
  const inn = pair.find(t => t.kind === 'transfer_in');
  if (!out || !inn) return null;

  return [out, inn];
}

/**
 * Vérifie la cohérence des virements dans la liste.
 * Retourne les transferId orphelins (une seule jambe).
 */
export function findOrphanTransfers(txs: Transaction[]): TransferId[] {
  const counts = new Map<TransferId, number>();
  for (const t of txs) {
    if (t.transferId) {
      counts.set(t.transferId, (counts.get(t.transferId) ?? 0) + 1);
    }
  }
  const orphans: TransferId[] = [];
  for (const [id, count] of counts) {
    if (count !== 2) orphans.push(id);
  }
  return orphans;
}
