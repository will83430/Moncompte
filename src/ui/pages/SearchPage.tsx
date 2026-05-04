import { h } from 'preact';
import { useState, useMemo, useCallback } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, setAppData } from '../../store';
import { confirmTransaction, deleteTransaction, removeTransfer } from '../../core/service';
import { getCatDef, SYSTEM_CATS } from '../../core/categories';
import { fmt, fmtDateShort } from '../format';
import { toast } from '../toast';
import type { AccountId, Transaction, TxId } from '../../core/types';

type Period      = 'all' | 'month' | '3m' | '6m' | '1y' | 'custom';
type TxType      = 'all' | 'income' | 'expense' | 'transfer';
type SortKey     = 'date_desc' | 'date_asc' | 'amt_desc' | 'amt_asc';
type SearchField = 'text' | 'date' | 'cat' | 'amount';

interface SearchEntry {
  id:     string;
  field:  SearchField;
  value:  string;
  value2: string; // pour montant max ou date fin
}

function newEntry(field: SearchField = 'text'): SearchEntry {
  return { id: Date.now().toString() + Math.random(), field, value: '', value2: '' };
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

const SEL = "width:100%;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);outline:none;box-sizing:border-box;";
const INP = "padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);outline:none;width:100%;box-sizing:border-box;";

export function SearchPage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;

  // ── Filtres globaux ──
  const [period,      setPeriod]      = useState<Period>('all');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [txType,      setTxType]      = useState<TxType>('all');
  const [selCat,      setSelCat]      = useState('all');
  const [allAccounts, setAllAccounts] = useState(false);
  const [sortKey,     setSortKey]     = useState<SortKey>('date_desc');
  const [amtMin,      setAmtMin]      = useState('');
  const [amtMax,      setAmtMax]      = useState('');

  // ── Multi-recherches (logique OU) ──
  const [entries, setEntries] = useState<SearchEntry[]>([newEntry('text')]);

  const availableCats = useMemo(() => {
    const ids = new Set(data.txs.map(t => t.cat));
    return SYSTEM_CATS.filter(c => ids.has(c.id))
      .concat((data.customCats ?? []).filter(c => ids.has(c.id)).map(c => ({
        id: c.id, label: c.label, icon: c.icon, color: '#6366f1', group: 'Perso',
      })));
  }, [data]);

  const [fromBound, toBound] = useMemo(() => {
    const today = new Date();
    const toStr = today.toISOString().slice(0, 10);
    if (period === 'all')   return ['', ''];
    if (period === 'month') return [today.toISOString().slice(0, 7) + '-01', toStr];
    if (period === '3m')    return [addMonths(today, -3).toISOString().slice(0, 10), toStr];
    if (period === '6m')    return [addMonths(today, -6).toISOString().slice(0, 10), toStr];
    if (period === '1y')    return [addMonths(today, -12).toISOString().slice(0, 10), toStr];
    return [dateFrom, dateTo];
  }, [period, dateFrom, dateTo]);

  // Vérifie si une transaction matche au moins une entrée de recherche
  function matchesEntries(t: Transaction): boolean {
    const active = entries.filter(e => e.value.trim() !== '' || (e.field === 'amount' && e.value2.trim() !== ''));
    if (active.length === 0) return true;

    return active.some(e => {
      if (e.field === 'text') {
        const cat = getCatDef(t.cat, data.customCats);
        return (t.desc + ' ' + cat.label).toLowerCase().includes(e.value.toLowerCase().trim());
      }
      if (e.field === 'date') {
        const v = e.value.trim();
        const v2 = e.value2.trim();
        if (v && v2) return t.date >= v && t.date <= v2;
        if (v)       return t.date === v;
        return true;
      }
      if (e.field === 'cat') {
        return e.value !== 'all' && t.cat === e.value;
      }
      if (e.field === 'amount') {
        const mn = e.value.trim()  ? Math.round(parseFloat(e.value.replace(',', '.'))  * 100) : 0;
        const mx = e.value2.trim() ? Math.round(parseFloat(e.value2.replace(',', '.')) * 100) : Infinity;
        return t.amountCents >= mn && t.amountCents <= mx;
      }
      return true;
    });
  }

  const hasActiveCriteria =
    entries.some(e => e.value.trim() !== '' || e.value2.trim() !== '') ||
    period !== 'all' || txType !== 'all' || selCat !== 'all' || amtMin !== '' || amtMax !== '';

  const results = useMemo(() => {
    if (!hasActiveCriteria) return [];

    const minCts = amtMin ? Math.round(parseFloat(amtMin.replace(',', '.')) * 100) : 0;
    const maxCts = amtMax ? Math.round(parseFloat(amtMax.replace(',', '.')) * 100) : Infinity;

    let list = data.txs.filter(t => {
      if (!allAccounts && t.accountId !== accountId) return false;
      if (t.planned) return false;
      if (fromBound && t.date < fromBound) return false;
      if (toBound   && t.date > toBound)   return false;
      if (txType === 'income'   && t.kind !== 'income')                                   return false;
      if (txType === 'expense'  && t.kind !== 'expense')                                  return false;
      if (txType === 'transfer' && t.kind !== 'transfer_in' && t.kind !== 'transfer_out') return false;
      if (selCat !== 'all' && t.cat !== selCat) return false;
      if (t.amountCents < minCts || t.amountCents > maxCts) return false;
      if (!matchesEntries(t)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'date_desc') return b.date.localeCompare(a.date);
      if (sortKey === 'date_asc')  return a.date.localeCompare(b.date);
      if (sortKey === 'amt_desc')  return b.amountCents - a.amountCents;
      return a.amountCents - b.amountCents;
    });

    return list;
  }, [data, accountId, allAccounts, fromBound, toBound, txType, selCat, amtMin, amtMax, entries, sortKey, hasActiveCriteria]);

  const totalInc = useMemo(() =>
    results.filter(t => t.kind === 'income' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0),
  [results]);
  const totalExp = useMemo(() =>
    results.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0),
  [results]);

  const confirmTx = useCallback(async (id: TxId) => {
    await setAppData(confirmTransaction(data, id));
    toast('✓ Transaction validée');
  }, [data]);

  const deleteTx = useCallback(async (id: TxId) => {
    const tx = data.txs.find(t => t.id === id);
    if (!tx) return;
    await setAppData(tx.transferId ? removeTransfer(data, tx.transferId) : deleteTransaction(data, id));
    toast('✓ Transaction supprimée');
  }, [data]);

  const addEntry   = () => setEntries(prev => [...prev, newEntry('text')]);
  const removeEntry = (id: string) =>
    setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : [newEntry('text')]);
  const updateEntry = (id: string, patch: Partial<SearchEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  const resetAll = () => {
    setPeriod('all'); setDateFrom(''); setDateTo('');
    setTxType('all'); setSelCat('all'); setAmtMin(''); setAmtMax('');
    setSortKey('date_desc'); setAllAccounts(false);
    setEntries([newEntry('text')]);
  };

  return (
    <div class="section active" id="sec-search">
      <div style="padding:12px 14px 0;">

        {/* ── Multi-recherches ── */}
        <div style="margin-bottom:12px;">
          <div class="srch-label" style="margin-bottom:8px;">Recherches — les résultats s'additionnent</div>

          {entries.map((e, i) => (
            <div key={e.id} class="srch-entry">
              {/* Sélecteur de champ */}
              <select value={e.field}
                onChange={ev => updateEntry(e.id, { field: (ev.target as HTMLSelectElement).value as SearchField, value: '', value2: '' })}
                style="flex:0 0 110px;padding:8px 6px;border-radius:8px;border:1.5px solid var(--teal);font-family:'Inter',sans-serif;font-size:12px;font-weight:600;background:var(--teal-light);color:var(--teal);outline:none;">
                <option value="text">🔤 Texte</option>
                <option value="date">📅 Date</option>
                <option value="cat">🏷 Catégorie</option>
                <option value="amount">💶 Montant</option>
              </select>

              {/* Valeur selon le champ */}
              {e.field === 'text' && (
                <input type="search" placeholder={i === 0 ? 'Description, catégorie…' : 'Autre terme…'}
                  value={e.value}
                  onInput={ev => updateEntry(e.id, { value: (ev.target as HTMLInputElement).value })}
                  style="flex:1;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);outline:none;" />
              )}

              {e.field === 'date' && (
                <div style="flex:1;display:flex;gap:4px;">
                  <input type="date" value={e.value}
                    onChange={ev => updateEntry(e.id, { value: (ev.target as HTMLInputElement).value })}
                    style="flex:1;padding:7px 6px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:12px;background:var(--bg);color:var(--text);outline:none;" />
                  <span style="align-self:center;font-size:11px;color:var(--text3);">→</span>
                  <input type="date" value={e.value2} placeholder="fin"
                    onChange={ev => updateEntry(e.id, { value2: (ev.target as HTMLInputElement).value })}
                    style="flex:1;padding:7px 6px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:12px;background:var(--bg);color:var(--text);outline:none;" />
                </div>
              )}

              {e.field === 'cat' && (
                <select value={e.value || 'all'}
                  onChange={ev => updateEntry(e.id, { value: (ev.target as HTMLSelectElement).value })}
                  style="flex:1;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);outline:none;">
                  <option value="all">— Choisir —</option>
                  {availableCats.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              )}

              {e.field === 'amount' && (
                <div style="flex:1;display:flex;gap:4px;">
                  <input type="text" inputMode="decimal" placeholder="Min €"
                    value={e.value}
                    onInput={ev => updateEntry(e.id, { value: (ev.target as HTMLInputElement).value })}
                    style="flex:1;padding:8px 6px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);outline:none;" />
                  <span style="align-self:center;font-size:11px;color:var(--text3);">→</span>
                  <input type="text" inputMode="decimal" placeholder="Max €"
                    value={e.value2}
                    onInput={ev => updateEntry(e.id, { value2: (ev.target as HTMLInputElement).value })}
                    style="flex:1;padding:8px 6px;border-radius:8px;border:1.5px solid var(--border);font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);outline:none;" />
                </div>
              )}

              {/* Bouton supprimer */}
              <button onClick={() => removeEntry(e.id)}
                style="flex:0 0 28px;height:34px;background:none;border:1.5px solid var(--border);border-radius:8px;font-size:14px;color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
          ))}

          <button onClick={addEntry}
            style="width:100%;margin-top:6px;padding:8px;border-radius:10px;border:1.5px dashed var(--border);background:none;font-family:'Inter',sans-serif;font-size:13px;color:var(--teal);cursor:pointer;font-weight:600;">
            ＋ Ajouter une recherche
          </button>
        </div>

        {/* ── Filtres dropdowns 2×2 ── */}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div>
            <div class="srch-label">Période</div>
            <select value={period} onChange={e => setPeriod((e.target as HTMLSelectElement).value as Period)} style={SEL}>
              <option value="all">Tout</option>
              <option value="month">Ce mois</option>
              <option value="3m">3 mois</option>
              <option value="6m">6 mois</option>
              <option value="1y">1 an</option>
              <option value="custom">Dates…</option>
            </select>
          </div>
          <div>
            <div class="srch-label">Type</div>
            <select value={txType} onChange={e => setTxType((e.target as HTMLSelectElement).value as TxType)} style={SEL}>
              <option value="all">Tout</option>
              <option value="income">Revenus</option>
              <option value="expense">Dépenses</option>
              <option value="transfer">Virements</option>
            </select>
          </div>
          <div>
            <div class="srch-label">Catégorie</div>
            <select value={selCat} onChange={e => setSelCat((e.target as HTMLSelectElement).value)} style={SEL}>
              <option value="all">Toutes</option>
              {availableCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <div class="srch-label">Compte</div>
            <select value={allAccounts ? 'all' : 'cur'}
              onChange={e => setAllAccounts((e.target as HTMLSelectElement).value === 'all')} style={SEL}>
              <option value="cur">Ce compte</option>
              <option value="all">Tous les comptes</option>
            </select>
          </div>
        </div>

        {/* ── Dates custom ── */}
        {period === 'custom' && (
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            <div>
              <div class="srch-label">Du</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom((e.target as HTMLInputElement).value)} style={INP} />
            </div>
            <div>
              <div class="srch-label">Au</div>
              <input type="date" value={dateTo} onChange={e => setDateTo((e.target as HTMLInputElement).value)} style={INP} />
            </div>
          </div>
        )}

        {/* ── Montant global + Tri ── */}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
          <div>
            <div class="srch-label">Min global (€)</div>
            <input type="text" inputMode="decimal" placeholder="0" value={amtMin}
              onInput={e => setAmtMin((e.target as HTMLInputElement).value)} style={INP} />
          </div>
          <div>
            <div class="srch-label">Max global (€)</div>
            <input type="text" inputMode="decimal" placeholder="∞" value={amtMax}
              onInput={e => setAmtMax((e.target as HTMLInputElement).value)} style={INP} />
          </div>
          <div>
            <div class="srch-label">Tri</div>
            <select value={sortKey} onChange={e => setSortKey((e.target as HTMLSelectElement).value as SortKey)} style={SEL}>
              <option value="date_desc">Date ↓</option>
              <option value="date_asc">Date ↑</option>
              <option value="amt_desc">Montant ↓</option>
              <option value="amt_asc">Montant ↑</option>
            </select>
          </div>
        </div>

        {/* ── Résumé ── */}
        {hasActiveCriteria && <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border-radius:10px;margin-bottom:8px;">
          <div style="font-size:13px;font-weight:600;">{results.length} résultat{results.length !== 1 ? 's' : ''}</div>
          <div style="display:flex;gap:12px;font-size:12px;">
            {totalInc > 0 && <span style="color:var(--green);font-weight:600;">+{fmt(totalInc)}</span>}
            {totalExp > 0 && <span style="color:#dc2626;font-weight:600;">-{fmt(totalExp)}</span>}
          </div>
          <button onClick={resetAll}
            style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--text3);cursor:pointer;font-family:'Inter',sans-serif;">
            Réinitialiser
          </button>
        </div>}
      </div>

      {/* ── Liste ── */}
      <div id="search-results">
        {!hasActiveCriteria ? (
          <div class="tx-empty" style="opacity:.5;padding-top:32px;">
            🔍 Lance une recherche ou applique un filtre
          </div>
        ) : results.length === 0 ? (
          <div class="tx-empty">Aucune transaction trouvée</div>
        ) : (
          results.map(t => (
            <SrchTxItem key={t.id} tx={t} customCats={data.customCats} onConfirm={confirmTx} onDelete={deleteTx} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Item transaction ──────────────────────────────────────────

function SrchTxItem({ tx, customCats, onConfirm, onDelete }: {
  tx:         Transaction;
  customCats: any[];
  onConfirm:  (id: TxId) => void;
  onDelete:   (id: TxId) => void;
}) {
  const isIncome   = tx.kind === 'income'   || tx.kind === 'transfer_in';
  const isTransfer = tx.kind === 'transfer_out' || tx.kind === 'transfer_in';
  const cat        = getCatDef(tx.cat, customCats);
  const sign       = isIncome ? '+' : '-';

  return (
    <div
      class={`tx-item${tx.planned ? ' tx-planned' : ''}`}
      onClick={() => import('../txModal').then(m => m.openTxModal(tx.id))}
    >
      {tx.planned && (
        <button class="tx-confirm" title="Valider"
          onClick={e => { e.stopPropagation(); onConfirm(tx.id); }}>✓</button>
      )}
      <div class="tx-ico" style={`background:${cat.color}22${tx.planned ? ';opacity:.5' : ''}`}>{cat.icon}</div>
      <div class="tx-body">
        <div class="tx-desc">
          {tx.desc || cat.label}
          {tx.planned && <span class="badge-planned">Prévu</span>}
        </div>
        <div class="tx-meta">
          {fmtDateShort(tx.date)} · {cat.label}
          {tx.recurring && <span class="badge-rec">↺</span>}
          {isTransfer   && <span class="badge-rec">↔</span>}
        </div>
      </div>
      <div class="tx-right">
        <div class={`tx-amt ${isIncome ? 'inc' : 'exp'}`} style={tx.planned ? 'opacity:.5' : ''}>
          {sign}{fmt(tx.amountCents)}
        </div>
      </div>
      <button class="tx-del" onClick={e => { e.stopPropagation(); onDelete(tx.id); }}>✕</button>
    </div>
  );
}
