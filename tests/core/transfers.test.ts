import { describe, it, expect } from 'vitest';
import { createTransfer, deleteTransfer, getTransferPair, findOrphanTransfers } from '../../src/core/transfers';
import { AccountId, IsoDate, TransferId } from '../../src/core/types';

const CC     = 'cc'     as AccountId;
const LIVRET = 'livret' as AccountId;

describe('createTransfer', () => {
  it('crée exactement deux transactions', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'Virement Livret'
    });
    expect(out.kind).toBe('transfer_out');
    expect(inn.kind).toBe('transfer_in');
  });

  it('les deux jambes ont le même transferId et montant', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    expect(out.transferId).toBe(inn.transferId);
    expect(out.amountCents).toBe(inn.amountCents);
  });

  it('les comptes sont corrects', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    expect(out.accountId).toBe(CC);
    expect(inn.accountId).toBe(LIVRET);
  });

  it('planned = false toujours', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    expect(out.planned).toBe(false);
    expect(inn.planned).toBe(false);
  });
});

describe('deleteTransfer', () => {
  it('supprime les deux jambes atomiquement', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const txs = [out, inn];
    const result = deleteTransfer(out.transferId!, txs);
    expect(result).toHaveLength(0);
  });

  it('ne supprime pas les autres transactions', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const [out2, inn2] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 10000, date: '2025-03-05' as IsoDate, desc: 'autre'
    });
    const result = deleteTransfer(out.transferId!, [out, inn, out2, inn2]);
    expect(result).toHaveLength(2);
    expect(result[0]?.transferId).toBe(out2.transferId);
  });
});

describe('getTransferPair', () => {
  it('retourne la paire correcte', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const pair = getTransferPair(out.transferId!, [out, inn]);
    expect(pair).not.toBeNull();
    expect(pair![0].kind).toBe('transfer_out');
    expect(pair![1].kind).toBe('transfer_in');
  });

  it('retourne null si une jambe manque', () => {
    const [out] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const pair = getTransferPair(out.transferId!, [out]);
    expect(pair).toBeNull();
  });
});

describe('findOrphanTransfers', () => {
  it('détecte les transferId orphelins', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const orphans = findOrphanTransfers([out]); // manque inn
    expect(orphans).toContain(out.transferId);
  });

  it('ne signale pas de faux positifs sur paires complètes', () => {
    const [out, inn] = createTransfer({
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const orphans = findOrphanTransfers([out, inn]);
    expect(orphans).toHaveLength(0);
  });
});
