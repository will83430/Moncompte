import { describe, it, expect } from 'vitest';
import { computeBalance, computeProjectedBalance, monthToInt, intToMonth } from '../../src/core/balance';
import { BalanceAnchor, Transaction, AccountId, MonthKey, TxId, IsoDate } from '../../src/core/types';

// ── Helpers de test ───────────────────────────────────────────

const CC = 'cc' as AccountId;

function anchor(amountCents: number, month: string): BalanceAnchor {
  return { accountId: CC, amountCents, month: month as MonthKey, setAt: '' };
}

function tx(kind: Transaction['kind'], amountCents: number, date: string): Transaction {
  return {
    id: Math.random().toString() as TxId,
    accountId: CC,
    date: date as IsoDate,
    amountCents,
    kind,
    cat: 'test',
    desc: 'test',
    planned: false,
    recurring: false,
  };
}

function planned(kind: 'income' | 'expense', amountCents: number, date: string): Transaction {
  return { ...tx(kind, amountCents, date), planned: true };
}

// ── Tests monthToInt / intToMonth ─────────────────────────────

describe('monthToInt / intToMonth', () => {
  it('convertit correctement', () => {
    expect(monthToInt('2025-01' as MonthKey)).toBe(2025 * 12 + 1);
    expect(monthToInt('2025-12' as MonthKey)).toBe(2025 * 12 + 12);
  });

  it('inverse correctement', () => {
    expect(intToMonth(2025 * 12 + 1)).toBe('2025-01');
    expect(intToMonth(2025 * 12 + 12)).toBe('2025-12');
    expect(intToMonth(2026 * 12 + 1)).toBe('2026-01');
  });
});

// ── Tests computeBalance ──────────────────────────────────────

describe('computeBalance', () => {
  it('retourne null si pas d\'ancre', () => {
    expect(computeBalance('2025-03' as MonthKey, null, [])).toBeNull();
    expect(computeBalance('2025-03' as MonthKey, undefined, [])).toBeNull();
  });

  it('retourne le montant ancre si même mois', () => {
    expect(computeBalance('2025-01' as MonthKey, anchor(100000, '2025-01'), [])).toBe(100000);
  });

  it('avance d\'un mois avec income', () => {
    const txs = [tx('income', 200000, '2025-02-10')];
    // ancre = 100000 en jan, +200000 en fev → 300000
    expect(computeBalance('2025-02' as MonthKey, anchor(100000, '2025-01'), txs)).toBe(300000);
  });

  it('avance d\'un mois avec expense', () => {
    const txs = [tx('expense', 50000, '2025-02-10')];
    expect(computeBalance('2025-02' as MonthKey, anchor(200000, '2025-01'), txs)).toBe(150000);
  });

  it('avance sur plusieurs mois', () => {
    const txs = [
      tx('income',  200000, '2025-02-01'),
      tx('expense', 150000, '2025-02-15'),
      tx('income',  200000, '2025-03-01'),
      tx('expense', 180000, '2025-03-20'),
    ];
    // jan: 100000 → fev: +50000 → 150000 → mar: +20000 → 170000
    expect(computeBalance('2025-03' as MonthKey, anchor(100000, '2025-01'), txs)).toBe(170000);
  });

  it('recule correctement (targetMonth < anchorMonth)', () => {
    const txs = [tx('income', 200000, '2025-02-01')];
    // ancre = 300000 en fev, rembobine → jan = 300000 - 200000 = 100000
    expect(computeBalance('2025-01' as MonthKey, anchor(300000, '2025-02'), txs)).toBe(100000);
  });

  it('ignore les transactions transfer_out et transfer_in', () => {
    const txs = [
      tx('transfer_out', 100000, '2025-02-01'),
      tx('transfer_in',  100000, '2025-02-01'),
      tx('income',        50000, '2025-02-10'),
    ];
    expect(computeBalance('2025-02' as MonthKey, anchor(100000, '2025-01'), txs)).toBe(150000);
  });

  it('ignore les transactions planned', () => {
    const txs = [
      planned('expense', 100000, '2025-02-15'),
      tx('income', 50000, '2025-02-10'),
    ];
    // planned ignoré, seul +50000 compte
    expect(computeBalance('2025-02' as MonthKey, anchor(100000, '2025-01'), txs)).toBe(150000);
  });

  it('ignore les transactions d\'un autre compte', () => {
    const txs = [
      { ...tx('income', 999999, '2025-02-01'), accountId: 'livret' as AccountId },
      tx('income', 50000, '2025-02-10'),
    ];
    expect(computeBalance('2025-02' as MonthKey, anchor(100000, '2025-01'), txs)).toBe(150000);
  });

  it('gère le changement d\'année (déc → jan)', () => {
    const txs = [tx('income', 100000, '2026-01-01')];
    expect(computeBalance('2026-01' as MonthKey, anchor(500000, '2025-12'), txs)).toBe(600000);
  });
});

// ── Tests computeProjectedBalance ────────────────────────────

describe('computeProjectedBalance', () => {
  it('ajoute les transactions prévues au solde réel', () => {
    const txs = [
      tx('income',      200000, '2025-03-01'),   // réel
      planned('expense', 50000, '2025-03-15'),   // prévu
    ];
    // solde réel = 100000 + 200000 = 300000
    // + prévu -50000 → 250000
    const result = computeProjectedBalance('2025-03' as MonthKey, anchor(100000, '2025-02'), txs);
    expect(result).toBe(250000);
  });

  it('n\'ajoute pas les prévus des autres mois', () => {
    const txs = [
      planned('expense', 50000, '2025-04-01'),  // prévu avril, pas mars
    ];
    const result = computeProjectedBalance('2025-03' as MonthKey, anchor(100000, '2025-02'), txs);
    expect(result).toBe(100000);
  });
});
