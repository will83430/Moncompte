import { describe, it, expect } from 'vitest';
import {
  addTransaction, updateTransaction, deleteTransaction,
  confirmTransaction, revertToPlanned,
  addTransfer, removeTransfer,
  addRecurring, generatePlannedFromRecs,
  setAnchor, getAnchor,
  deleteAccountData,
  getMonthSummary, getBankBalance, getProjectedBalance,
} from '../../src/core/service';
import { AppData, AccountId, MonthKey, TxId, IsoDate } from '../../src/core/types';

// ── Helpers ───────────────────────────────────────────────────

const CC     = 'cc'     as AccountId;
const LIVRET = 'livret' as AccountId;

function emptyData(): AppData {
  return { version: 2, txs: [], recs: [], accounts: [], anchors: [], customCats: [], budget: 0, goals: [] };
}

function incomeTx(amountCents: number, date: string, planned = false) {
  return {
    accountId: CC, date: date as IsoDate,
    amountCents, kind: 'income' as const,
    cat: 'salaire', desc: 'test', planned, recurring: false,
  };
}

function expenseTx(amountCents: number, date: string, planned = false) {
  return {
    accountId: CC, date: date as IsoDate,
    amountCents, kind: 'expense' as const,
    cat: 'courses', desc: 'test', planned, recurring: false,
  };
}

// ── addTransaction ────────────────────────────────────────────

describe('addTransaction', () => {
  it('ajoute une transaction avec id généré', () => {
    const data = addTransaction(emptyData(), incomeTx(100000, '2025-03-01'));
    expect(data.txs).toHaveLength(1);
    expect(data.txs[0]?.id).toBeDefined();
  });

  it('ne mute pas l\'original', () => {
    const original = emptyData();
    addTransaction(original, incomeTx(100000, '2025-03-01'));
    expect(original.txs).toHaveLength(0);
  });
});

// ── updateTransaction ─────────────────────────────────────────

describe('updateTransaction', () => {
  it('met à jour uniquement la transaction ciblée', () => {
    let data = addTransaction(emptyData(), incomeTx(100000, '2025-03-01'));
    data = addTransaction(data, incomeTx(200000, '2025-03-02'));
    const id = data.txs[0]!.id;
    data = updateTransaction(data, id, { amountCents: 150000 });
    expect(data.txs[0]?.amountCents).toBe(150000);
    expect(data.txs[1]?.amountCents).toBe(200000);
  });
});

// ── confirmTransaction / revertToPlanned ──────────────────────

describe('confirmTransaction', () => {
  it('passe planned false', () => {
    let data = addTransaction(emptyData(), incomeTx(100000, '2025-03-01', true));
    const id = data.txs[0]!.id;
    data = confirmTransaction(data, id);
    expect(data.txs[0]?.planned).toBe(false);
  });
});

describe('revertToPlanned', () => {
  it('remet planned true', () => {
    let data = addTransaction(emptyData(), incomeTx(100000, '2025-03-01', false));
    const id = data.txs[0]!.id;
    data = revertToPlanned(data, id);
    expect(data.txs[0]?.planned).toBe(true);
  });
});

// ── addTransfer / removeTransfer ──────────────────────────────

describe('addTransfer', () => {
  it('ajoute deux transactions liées', () => {
    const data = addTransfer(emptyData(), {
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'Virement'
    });
    expect(data.txs).toHaveLength(2);
    expect(data.txs[0]?.kind).toBe('transfer_out');
    expect(data.txs[1]?.kind).toBe('transfer_in');
    expect(data.txs[0]?.transferId).toBe(data.txs[1]?.transferId);
  });
});

describe('removeTransfer', () => {
  it('supprime les deux jambes', () => {
    let data = addTransfer(emptyData(), {
      fromAccountId: CC, toAccountId: LIVRET,
      amountCents: 50000, date: '2025-03-01' as IsoDate, desc: 'test'
    });
    const transferId = data.txs[0]!.transferId!;
    data = removeTransfer(data, transferId);
    expect(data.txs).toHaveLength(0);
  });
});

// ── generatePlannedFromRecs ───────────────────────────────────

describe('generatePlannedFromRecs', () => {
  it('génère une transaction planifiée par récurrente', () => {
    let data = addRecurring(emptyData(), {
      accountId: CC, kind: 'expense', amountCents: 999,
      desc: 'Netflix', cat: 'loisirs', dayOfMonth: 15, active: true,
    });
    data = generatePlannedFromRecs(data, '2025-03' as MonthKey, CC);
    expect(data.txs).toHaveLength(1);
    expect(data.txs[0]?.planned).toBe(true);
    expect(data.txs[0]?.date).toBe('2025-03-15');
    expect(data.txs[0]?.amountCents).toBe(999);
  });

  it('ne génère pas deux fois pour le même mois', () => {
    let data = addRecurring(emptyData(), {
      accountId: CC, kind: 'expense', amountCents: 999,
      desc: 'Netflix', cat: 'loisirs', dayOfMonth: 15, active: true,
    });
    data = generatePlannedFromRecs(data, '2025-03' as MonthKey, CC);
    data = generatePlannedFromRecs(data, '2025-03' as MonthKey, CC);
    expect(data.txs).toHaveLength(1);
  });

  it('ignore les récurrentes inactives', () => {
    let data = addRecurring(emptyData(), {
      accountId: CC, kind: 'expense', amountCents: 999,
      desc: 'Netflix', cat: 'loisirs', dayOfMonth: 15, active: false,
    });
    data = generatePlannedFromRecs(data, '2025-03' as MonthKey, CC);
    expect(data.txs).toHaveLength(0);
  });
});

// ── setAnchor / getAnchor ────────────────────────────────────

describe('setAnchor', () => {
  it('crée une ancre', () => {
    const data = setAnchor(emptyData(), CC, 173343, '2026-02' as MonthKey);
    const anchor = getAnchor(data, CC);
    expect(anchor?.amountCents).toBe(173343);
    expect(anchor?.month).toBe('2026-02');
  });

  it('remplace l\'ancre existante', () => {
    let data = setAnchor(emptyData(), CC, 100000, '2026-01' as MonthKey);
    data = setAnchor(data, CC, 200000, '2026-02' as MonthKey);
    expect(data.anchors).toHaveLength(1);
    expect(data.anchors[0]?.amountCents).toBe(200000);
  });
});

// ── deleteAccountData ─────────────────────────────────────────

describe('deleteAccountData', () => {
  it('supprime txs, recs et anchors du compte', () => {
    let data = addTransaction(emptyData(), incomeTx(100000, '2025-03-01'));
    data = addTransaction(data, { ...incomeTx(50000, '2025-03-01'), accountId: LIVRET });
    data = setAnchor(data, CC, 100000, '2025-02' as MonthKey);
    data = deleteAccountData(data, CC);

    expect(data.txs.every(t => t.accountId !== CC)).toBe(true);
    expect(data.anchors.every(a => a.accountId !== CC)).toBe(true);
    expect(data.txs).toHaveLength(1); // livret reste
  });
});

// ── getMonthSummary ───────────────────────────────────────────

describe('getMonthSummary', () => {
  it('calcule revenus/dépenses réels', () => {
    let data = addTransaction(emptyData(), incomeTx(200000, '2025-03-01'));
    data = addTransaction(data, expenseTx(80000, '2025-03-15'));
    data = addTransaction(data, expenseTx(30000, '2025-03-15', true)); // planned ignoré en reel

    const summary = getMonthSummary(data, '2025-03' as MonthKey, CC, 'reel');
    expect(summary.incomeCents).toBe(200000);
    expect(summary.expenseCents).toBe(80000);
    expect(summary.bilanCents).toBe(120000);
  });

  it('inclut les prévus en mode previsionnel', () => {
    let data = addTransaction(emptyData(), incomeTx(200000, '2025-03-01'));
    data = addTransaction(data, expenseTx(30000, '2025-03-15', true));

    const summary = getMonthSummary(data, '2025-03' as MonthKey, CC, 'previsionnel');
    expect(summary.expenseCents).toBe(30000);
  });
});

// ── getBankBalance / getProjectedBalance ──────────────────────

describe('getBankBalance', () => {
  it('retourne null sans ancre', () => {
    expect(getBankBalance(emptyData(), '2025-03' as MonthKey, CC)).toBeNull();
  });

  it('calcule le solde depuis l\'ancre', () => {
    let data = setAnchor(emptyData(), CC, 100000, '2025-01' as MonthKey);
    data = addTransaction(data, incomeTx(200000, '2025-02-01'));
    expect(getBankBalance(data, '2025-02' as MonthKey, CC)).toBe(300000);
  });
});
