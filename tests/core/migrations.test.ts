import { describe, it, expect } from 'vitest';
import { migrateV1toV2, V1RawData } from '../../src/core/migrations';
import { AccountId, MonthKey } from '../../src/core/types';

// ── Helpers ───────────────────────────────────────────────────

const CC = 'cc' as AccountId;

function v1tx(overrides: Record<string, unknown> = {}) {
  return {
    id: 1001,
    type: 'expense',
    amount: 10.50,
    desc: 'test',
    cat: 'alimentation',
    date: '2025-03-15',
    accountId: 'cc',
    planned: false,
    recurring: false,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('migrateV1toV2', () => {

  it('retourne version: 2', () => {
    const result = migrateV1toV2({ data: { txs: [], recs: [], budget: 0 } });
    expect(result.version).toBe(2);
  });

  it('convertit amount euros → amountCents', () => {
    const raw: V1RawData = {
      data: {
        txs: [v1tx({ amount: 10.50 })],
        recs: [], budget: 0,
      }
    };
    const result = migrateV1toV2(raw);
    expect(result.txs[0]?.amountCents).toBe(1050);
  });

  it('arrondit correctement (0.1 + 0.2 flottant)', () => {
    const raw: V1RawData = {
      data: { txs: [v1tx({ amount: 19.99 })], recs: [], budget: 0 }
    };
    expect(migrateV1toV2(raw).txs[0]?.amountCents).toBe(1999);
  });

  it('convertit type income/expense → kind', () => {
    const raw: V1RawData = {
      data: {
        txs: [
          v1tx({ type: 'income', amount: 200 }),
          v1tx({ type: 'expense', amount: 100 }),
        ],
        recs: [], budget: 0,
      }
    };
    const result = migrateV1toV2(raw);
    expect(result.txs[0]?.kind).toBe('income');
    expect(result.txs[1]?.kind).toBe('expense');
  });

  it('convertit type transfer_out / transfer_in', () => {
    const raw: V1RawData = {
      data: {
        txs: [
          v1tx({ type: 'transfer_out' }),
          v1tx({ type: 'transfer_in' }),
        ],
        recs: [], budget: 0,
      }
    };
    const result = migrateV1toV2(raw);
    expect(result.txs[0]?.kind).toBe('transfer_out');
    expect(result.txs[1]?.kind).toBe('transfer_in');
  });

  it('conserve planned: true', () => {
    const raw: V1RawData = {
      data: { txs: [v1tx({ planned: true })], recs: [], budget: 0 }
    };
    expect(migrateV1toV2(raw).txs[0]?.planned).toBe(true);
  });

  it('convertit budget euros → centimes', () => {
    const raw: V1RawData = {
      data: { txs: [], recs: [], budget: 1500 }
    };
    expect(migrateV1toV2(raw).budget).toBe(150000);
  });

  it('migre balRef vers anchors', () => {
    const raw: V1RawData = {
      data: { txs: [], recs: [], budget: 0 },
      balRef: {
        cc: { amount: 1733.43, month: '2026-02' }
      }
    };
    const result = migrateV1toV2(raw);
    expect(result.anchors).toHaveLength(1);
    expect(result.anchors[0]?.accountId).toBe(CC);
    expect(result.anchors[0]?.amountCents).toBe(173343);
    expect(result.anchors[0]?.month).toBe('2026-02' as MonthKey);
  });

  it('gère balRef null/absent', () => {
    const result = migrateV1toV2({ data: { txs: [], recs: [], budget: 0 } });
    expect(result.anchors).toHaveLength(0);
  });

  it('migre les récurrentes', () => {
    const raw: V1RawData = {
      data: {
        txs: [],
        recs: [{
          id: 42, type: 'expense', amount: 9.99,
          desc: 'Netflix', cat: 'loisirs', day: 15, accountId: 'cc'
        }],
        budget: 0,
      }
    };
    const result = migrateV1toV2(raw);
    expect(result.recs).toHaveLength(1);
    expect(result.recs[0]?.amountCents).toBe(999);
    expect(result.recs[0]?.dayOfMonth).toBe(15);
    expect(result.recs[0]?.kind).toBe('expense');
    expect(result.recs[0]?.active).toBe(true);
  });

  it('migre les goals (champ target legacy)', () => {
    const raw: V1RawData = {
      data: {
        txs: [], recs: [], budget: 0,
        goals: [{ label: 'Vacances', target: 2000, saved: 500 }]
      }
    };
    const result = migrateV1toV2(raw);
    expect(result.goals[0]?.targetCents).toBe(200000);
    expect(result.goals[0]?.savedCents).toBe(50000);
  });

  it('utilise accountId par défaut si absent', () => {
    const raw: V1RawData = {
      data: { txs: [{ id: 1, type: 'income', amount: 100, desc: 'x', cat: 'x', date: '2025-01-01' }], recs: [], budget: 0 }
    };
    const result = migrateV1toV2(raw);
    expect(result.txs[0]?.accountId).toBe('cc');
  });

  it('valeur absolue du montant même si négatif en v1', () => {
    const raw: V1RawData = {
      data: { txs: [v1tx({ amount: -42.50 })], recs: [], budget: 0 }
    };
    expect(migrateV1toV2(raw).txs[0]?.amountCents).toBe(4250);
  });
});
