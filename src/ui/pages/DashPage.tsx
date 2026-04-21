import { h, Fragment } from 'preact';
import { useState, useMemo, useCallback } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, setAppData, navigate } from '../../store';
import { getBankBalance, getProjectedBalance, confirmTransaction, revertToPlanned, deleteTransaction, removeTransfer } from '../../core/service';
import { currentMonthKey } from '../../core/balance';
import { getCatDef } from '../../core/categories';
import { fmt, fmtAbs, fmtCompact, fmtDateShort } from '../format';
import { toast } from '../toast';
import type { AccountId, MonthKey, Transaction, TxId } from '../../core/types';

type ViewMode = 'reel' | 'previsionnel';

// ── Helpers ───────────────────────────────────────────────────

function changeMonth(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` as MonthKey;
}

function monthLabel(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ── DashPage ──────────────────────────────────────────────────

export function DashPage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;

  const [month,  setMonth]  = useState<MonthKey>(currentMonthKey);
  const [mode,   setMode]   = useState<ViewMode>('reel');
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

  return (
    <div class="section active" id="sec-dash">
      {/* ── Header ── */}
      <div class="header">
        {/* Switcher comptes */}
        <div id="account-switcher" class="account-switcher">
          {data.accounts.map(acc => (
            <button
              key={acc.id}
              class={`acc-pill${acc.id === accountId ? ' acc-pill-active' : ''}`}
              onClick={() => {
                currentAccountId.value = acc.id;
                localStorage.setItem('mc5_curaccount', acc.id);
              }}
            >
              <span>{acc.icon}</span>
              <span>{acc.name}</span>
            </button>
          ))}
        </div>

        {/* Balance */}
        <BalanceSection data={data} month={month} accountId={accountId} mode={mode} account={account} />

        {/* Navigation mois */}
        <div class="month-nav">
          <button class="mn-arrow" onClick={() => setMonth(m => changeMonth(m, -1))}>‹</button>
          <span class="mn-lbl">{monthLabel(month)}</span>
          <button class="mn-arrow" onClick={() => setMonth(m => changeMonth(m, 1))}>›</button>
        </div>

        {/* Mode toggle */}
        {account?.type !== 'savings' && (
          <div class="mode-toggle">
            <button class={`mode-btn${mode === 'reel' ? ' mode-on' : ''}`} onClick={() => setMode('reel')}>Réel</button>
            <button class={`mode-btn${mode === 'previsionnel' ? ' mode-on' : ''}`} onClick={() => setMode('previsionnel')}>Prévisionnel</button>
          </div>
        )}
      </div>

      {/* ── Corps ── */}
      <div class="dash-body">
        {/* Recherche */}
        <div class="search-bar">
          <input
            type="search"
            placeholder="🔍 Rechercher…"
            value={search}
            onInput={e => setSearch((e.target as HTMLInputElement).value)}
            class="search-input"
          />
        </div>

        {/* Bannière récurrentes */}
        {pendingRecs.length > 0 && (
          <div class="rec-alert">
            <span id="rec-alert-txt">
              {pendingRecs.length} récurrente{pendingRecs.length > 1 ? 's' : ''} à importer
              pour {monthLabel(month).toLowerCase()}
            </span>
          </div>
        )}

        {/* Liste transactions */}
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
                    onConfirm={confirmTx}
                    onDelete={deleteTx}
                  />
                ))}
              </Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── BalanceSection ────────────────────────────────────────────

function BalanceSection({ data, month, accountId, mode, account }: {
  data: ReturnType<typeof useSignal<typeof appData>>['value'] extends null ? never : NonNullable<ReturnType<typeof useSignal<typeof appData>>>,
  month: MonthKey,
  accountId: AccountId,
  mode: ViewMode,
  account: ReturnType<typeof data.accounts.find>,
}) {
  const monthFlow = (includePlanned: boolean) => {
    const txs = data.txs.filter(t =>
      t.accountId === accountId && t.date.startsWith(month) && (includePlanned || !t.planned)
    );
    const inc = txs.filter(t => t.kind === 'income'   || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const exp = txs.filter(t => t.kind === 'expense'  || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    return { inc, exp, bilan: inc - exp };
  };

  if (!account || account.type === 'checking') {
    const bankBalance = getBankBalance(data, month, accountId);
    const cumBal = data.txs
      .filter(t => t.accountId === accountId && (mode === 'reel' ? !t.planned : true) && (t.kind === 'income' || t.kind === 'expense'))
      .reduce((s, t) => s + (t.kind === 'income' ? t.amountCents : -t.amountCents), 0);
    const flow = monthFlow(mode === 'previsionnel');
    const mainBal = mode === 'reel'
      ? (bankBalance ?? cumBal)
      : (getProjectedBalance(data, month, accountId) ?? cumBal);

    return (
      <div class="bal-block">
        <div class="bal-label">{mode === 'reel' ? 'Solde banque' : 'Solde prévu'}</div>
        <div class={`bal-main ${mainBal < 0 ? 'neg' : 'pos'}`}>{fmt(mainBal)}</div>
        <div class="bal-minis">
          <div class="bal-mini"><div class="bal-mini-lbl">{mode === 'reel' ? 'Revenus' : 'Revenus prev.'}</div><div class="bal-mini-val">{fmtAbs(flow.inc)}</div></div>
          <div class="bal-mini"><div class="bal-mini-lbl">{mode === 'reel' ? 'Dépenses' : 'Dépenses prev.'}</div><div class="bal-mini-val">{fmtAbs(flow.exp)}</div></div>
          <div class="bal-mini"><div class="bal-mini-lbl">Bilan</div><div class={`bal-mini-val ${flow.bilan >= 0 ? 'pos' : 'neg'}`}>{fmtCompact(flow.bilan)}</div></div>
        </div>
      </div>
    );
  }

  if (account.type === 'savings') {
    const bankBal = getBankBalance(data, month, accountId);
    const allTxs  = data.txs.filter(t => t.accountId === accountId && !t.planned);
    const allInc  = allTxs.filter(t => t.kind === 'income' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const allExp  = allTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const solde   = bankBal !== null ? bankBal : (allInc - allExp);
    const monthTxs      = allTxs.filter(t => t.date.startsWith(month));
    const verseCeMois   = monthTxs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const retireCeMois  = monthTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const bilanMois     = verseCeMois - retireCeMois;

    return (
      <div class="bal-block">
        <div class="bal-label">Solde livret</div>
        <div class="bal-main pos">{fmt(solde)}</div>
        <div class="bal-minis">
          <div class="bal-mini"><div class="bal-mini-lbl">Versé ce mois</div><div class="bal-mini-val">{fmtAbs(verseCeMois)}</div></div>
          <div class="bal-mini"><div class="bal-mini-lbl">Retiré ce mois</div><div class="bal-mini-val">{fmtAbs(retireCeMois)}</div></div>
          <div class="bal-mini"><div class="bal-mini-lbl">Ce mois</div><div class={`bal-mini-val ${bilanMois >= 0 ? 'pos' : 'neg'}`}>{fmtCompact(bilanMois)}</div></div>
        </div>
      </div>
    );
  }

  // Crédit
  const allReal = data.txs.filter(t => t.accountId === accountId && !t.planned);
  const allPrev = mode === 'previsionnel'
    ? data.txs.filter(t => t.accountId === accountId && t.planned && t.date.startsWith(month))
    : [];
  const allTxs       = [...allReal, ...allPrev];
  const totalEmprunte  = allTxs.filter(t => t.kind === 'income'  || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
  const totalRembourse = allTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
  const restant        = Math.max(0, totalEmprunte - totalRembourse);
  const rembCeMois     = allTxs.filter(t => t.date.startsWith(month) && (t.kind === 'expense' || t.kind === 'transfer_in')).reduce((s, t) => s + t.amountCents, 0);
  const moisRestants   = account.mensualite && restant > 0 ? Math.ceil(restant / account.mensualite) : null;

  return (
    <div class="bal-block">
      <div class="bal-label">{mode === 'previsionnel' ? 'Restant prévu' : 'Restant à payer'}</div>
      <div class={`bal-main ${restant > 0 ? 'neg' : ''}`}>{fmt(restant)}</div>
      <div class="bal-minis">
        <div class="bal-mini"><div class="bal-mini-lbl">{mode === 'previsionnel' ? 'Remboursé prévu' : 'Remboursé ce mois'}</div><div class="bal-mini-val">{fmtAbs(rembCeMois)}</div></div>
        <div class="bal-mini"><div class="bal-mini-lbl">{account.mensualite ? 'Mensualité' : 'Total remboursé'}</div><div class="bal-mini-val">{fmtAbs(account.mensualite ?? totalRembourse)}</div></div>
        {moisRestants !== null && (
          <div class="bal-mini"><div class="bal-mini-lbl">Mois restants</div><div class="bal-mini-val">{moisRestants}</div></div>
        )}
      </div>
    </div>
  );
}

// ── TxItem ────────────────────────────────────────────────────

function TxItem({ tx, customCats, onConfirm, onDelete }: {
  tx: Transaction,
  customCats: ReturnType<typeof getCatDef>[],
  onConfirm: (id: TxId) => void,
  onDelete:  (id: TxId) => void,
}) {
  const isIncome   = tx.kind === 'income'   || tx.kind === 'transfer_in';
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
