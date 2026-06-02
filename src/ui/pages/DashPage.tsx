import { h, Fragment } from 'preact';
import { useState, useMemo, useCallback } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, currentViewMonth, currentViewMode, setAppData, navigate } from '../../store';
import { confirmTransaction, deleteTransaction, removeTransfer } from '../../core/service';
import { currentMonthKey } from '../../core/balance';
import { getCatDef } from '../../core/categories';
import { fmt, fmtDateShort } from '../format';
import { toast } from '../toast';
import type { AccountId, MonthKey, Transaction, TxId } from '../../core/types';


// ── DashPage ──────────────────────────────────────────────────

export function DashPage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;
  const month     = useSignal(currentViewMonth) as MonthKey;
  const mode      = useSignal(currentViewMode);

  const [search, setSearch] = useState('');

  const account = data.accounts.find(a => a.id === accountId);

  // ── Actions ─────────────────────────────────────────────────

  const confirmTx = useCallback(async (id: TxId) => {
    await setAppData(confirmTransaction(data, id));
    toast('✓ Transaction validée');
  }, [data]);

  const deleteTx = useCallback(async (id: TxId) => {
    const tx = data.txs.find(t => t.id === id);
    if (!tx) return;
    const next = tx.transferId ? removeTransfer(data, tx.transferId) : deleteTransaction(data, id);
    await setAppData(next);
    toast('✓ Transaction supprimée');
  }, [data]);

  // ── Transactions filtrées ────────────────────────────────────

  const txs = useMemo(() => {
    let list = data.txs
      .filter(t => t.accountId === accountId && t.date.startsWith(month))
      .filter(t => mode === 'previsionnel' ? true : !t.planned)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(t => {
        const cat = getCatDef(t.cat, data.customCats);
        return t.desc.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q);
      });
    }
    return list;
  }, [data, accountId, month, mode, search]);

  // Regrouper par date
  const byDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of txs) {
      const g = map.get(t.date) ?? [];
      g.push(t);
      map.set(t.date, g);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [txs]);

  // Bannière récurrentes en attente
  const pendingRecs = useMemo(() => {
    if (mode !== 'previsionnel' || month <= currentMonthKey()) return [];
    return data.recs.filter(r =>
      r.accountId === accountId && r.active &&
      !data.txs.some(t => t.recId === r.id && t.date.startsWith(month))
    );
  }, [data, accountId, month, mode]);

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-').map(Number) as [number, number];
    const lbl = new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return lbl.charAt(0).toUpperCase() + lbl.slice(1);
  };
  const prevMonth = (m: string) => { const [y, mo] = m.split('-').map(Number) as [number, number]; const d = new Date(y, mo - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const nextMonthFn = (m: string) => { const [y, mo] = m.split('-').map(Number) as [number, number]; const d = new Date(y, mo, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

  return (
    <div class="section active" id="sec-dash">
      {/* ── Mois ── */}
      <div class="month-nav">
        <button onClick={() => { currentViewMonth.value = prevMonth(month); }}>‹</button>
        <span>{monthLabel(month)}</span>
        <button onClick={() => { currentViewMonth.value = nextMonthFn(month); }}>›</button>
      </div>

      {/* ── Recherche ── */}
      <div class="tx-search-wrap">
        <input
          type="search"
          placeholder="🔍 Rechercher…"
          value={search}
          onInput={e => setSearch((e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Bannière récurrentes */}
      {pendingRecs.length > 0 && (
        <div style="background:var(--orange-bg);border:1px solid rgba(217,119,6,.2);border-radius:var(--radius);padding:10px 14px;margin:8px 14px;font-size:13px;color:var(--orange);font-weight:500;">
          ⏳ {pendingRecs.length} récurrente{pendingRecs.length > 1 ? 's' : ''} à importer
        </div>
      )}

      {/* ── Transactions ── */}
      <div id="tx-list">
        {byDate.length === 0 ? (
          <div class="tx-empty">
            {search ? `Aucun résultat pour « ${search} »` : 'Aucune transaction ce mois-ci'}
          </div>
        ) : (
          byDate.map(([date, group]) => (
            <Fragment key={date}>
              <div class="s-title">{fmtDateShort(date)}</div>
              {group.map(t => (
                <TxItem
                  key={t.id}
                  tx={t}
                  customCats={data.customCats}
                  accountType={account?.type}
                  onConfirm={confirmTx}
                  onDelete={deleteTx}
                />
              ))}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}

// ── TxItem ────────────────────────────────────────────────────

function TxItem({ tx, customCats, accountType, onConfirm, onDelete }: {
  tx: Transaction,
  customCats: ReturnType<typeof getCatDef>[],
  accountType?: string,
  onConfirm: (id: TxId) => void,
  onDelete:  (id: TxId) => void,
}) {
  // Pour un compte crédit, transfer_in = remboursement = négatif (comme expense)
  const isIncome   = accountType === 'credit'
    ? (tx.kind === 'income' || tx.kind === 'transfer_out')
    : (tx.kind === 'income' || tx.kind === 'transfer_in');
  const isTransfer = tx.kind === 'transfer_out' || tx.kind === 'transfer_in';
  const cat        = getCatDef(tx.cat, customCats as any);
  const icoColor   = cat.color + '22';
  const sign       = isIncome ? '+' : '-';
  const amtCls     = isIncome ? 'inc' : 'exp';

  return (
    <div
      class={`tx-item${tx.planned ? ' tx-planned' : ''}`}
      onClick={() => import('../txModal').then(m => m.openTxModal(tx.id))}
    >
      {tx.planned && (
        <button
          class="tx-confirm"
          title="Valider"
          onClick={e => { e.stopPropagation(); onConfirm(tx.id); }}
        >✓</button>
      )}
      <div class="tx-ico" style={`background:${icoColor}${tx.planned ? ';opacity:.5' : ''}`}>{cat.icon}</div>
      <div class="tx-body">
        <div class="tx-desc">
          {tx.desc || cat.label}
          {tx.planned && <span class="badge-planned">Prévu</span>}
        </div>
        <div class="tx-meta">
          {cat.label}
          {tx.recurring && <span class="badge-rec">↺</span>}
          {isTransfer  && <span class="badge-rec">↔</span>}
        </div>
      </div>
      <div class="tx-right">
        <div class={`tx-amt ${amtCls}${tx.planned ? ' opacity-50' : ''}`} style={tx.planned ? 'opacity:.5' : ''}>
          {sign}{fmt(tx.amountCents)}
        </div>
      </div>
      <button class="tx-del" onClick={e => { e.stopPropagation(); onDelete(tx.id); }}>✕</button>
    </div>
  );
}
