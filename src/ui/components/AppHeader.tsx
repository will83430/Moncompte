import { h } from 'preact';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, currentViewMonth, currentViewMode, navigate } from '../../store';
import { getBankBalance, getProjectedBalance } from '../../core/service';
import { fmt, fmtAbs, fmtCompact } from '../format';
import type { AccountId, MonthKey } from '../../core/types';

function changeMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function AppHeader() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;
  const month     = useSignal(currentViewMonth) as MonthKey;
  const mode      = useSignal(currentViewMode);

  if (!data) return null;

  const account = data.accounts.find(a => a.id === accountId);
  const today   = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const txs = data.txs.filter(t =>
    t.accountId === accountId && t.date.startsWith(month) && (mode === 'reel' ? !t.planned : true)
  );
  const inc = txs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
  const exp = txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
  const bilan = inc - exp;

  let mainBal: number;
  if (!account || account.type === 'checking') {
    const bank  = getBankBalance(data, month, accountId);
    const cumBal = data.txs
      .filter(t => t.accountId === accountId && (mode === 'reel' ? !t.planned : true) && (t.kind === 'income' || t.kind === 'expense'))
      .reduce((s, t) => s + (t.kind === 'income' ? t.amountCents : -t.amountCents), 0);
    mainBal = mode === 'reel' ? (bank ?? cumBal) : (getProjectedBalance(data, month, accountId) ?? cumBal);
  } else if (account.type === 'savings') {
    const bank     = getBankBalance(data, month, accountId);
    const realTxs  = data.txs.filter(t => t.accountId === accountId && !t.planned);
    const allTxs   = data.txs.filter(t => t.accountId === accountId);
    const txsToUse = mode === 'previsionnel' ? allTxs : realTxs;
    const sInc = txsToUse.filter(t => t.kind === 'income' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const sExp = txsToUse.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const cumBal = sInc - sExp;
    mainBal = mode === 'reel' ? (bank !== null ? bank : cumBal) : cumBal;
  } else {
    const realTxs  = data.txs.filter(t => t.accountId === accountId && !t.planned);
    const txsToUse = mode === 'previsionnel' ? data.txs.filter(t => t.accountId === accountId) : realTxs;
    const emprunte  = txsToUse.filter(t => t.kind === 'income'  || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const rembourse = txsToUse.filter(t => t.kind === 'expense' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    mainBal = Math.max(0, emprunte - rembourse);
  }

  const balLabel = account?.type === 'savings' ? (mode === 'reel' ? 'Solde livret'       : 'Solde prévu livret')
                 : account?.type === 'credit'  ? (mode === 'reel' ? 'Restant à payer'    : 'Restant prévu')
                 : mode === 'reel'              ? 'Solde banque'
                 :                               'Solde prévu';

  return (
    <div class="header">
      <div class="hdr-top">
        <div class="brand">Mon<span>Compte</span></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="hdr-date">{today}</div>
          <button onClick={() => navigate('settings')} style="background:none;border:none;font-size:20px;cursor:pointer;padding:2px 4px;border-radius:8px;color:var(--text2);" title="Paramètres">⚙️</button>
        </div>
      </div>

      <div class="account-switcher">
        {data.accounts.map(acc => (
          <button
            key={acc.id}
            class={`acc-pill${acc.id === accountId ? ' acc-pill-active' : ''}`}
            onClick={() => {
              currentAccountId.value = acc.id;
              localStorage.setItem('mc5_curaccount', acc.id);
            }}
          >
            {acc.icon} {acc.name}
          </button>
        ))}
      </div>

      <div class="balance-wrap">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
          <div class="bal-label">{balLabel}</div>
          {true && (
            <div class="mode-toggle">
              <button class={`mode-btn${mode === 'reel' ? ' mode-on' : ''}`} onClick={() => { currentViewMode.value = 'reel'; }}>Réel</button>
              <button class={`mode-btn${mode === 'previsionnel' ? ' mode-on' : ''}`} onClick={() => { currentViewMode.value = 'previsionnel'; }}>Prévision</button>
            </div>
          )}
        </div>
        <div class={`bal-amount${mainBal < 0 ? ' neg' : ''}`}>{fmt(mainBal)}</div>
        <div class="bal-cards">
          <div class="bal-mini"><div class="bal-mini-lbl">Revenus</div><div class="bal-mini-val pos">{fmtAbs(inc)}</div></div>
          <div class="bal-mini"><div class="bal-mini-lbl">Dépenses</div><div class="bal-mini-val neg">{fmtAbs(exp)}</div></div>
          <div class="bal-mini"><div class="bal-mini-lbl">Ce mois</div><div class={`bal-mini-val${bilan >= 0 ? ' pos' : ' neg'}`}>{fmtCompact(bilan)}</div></div>
        </div>
      </div>

    </div>
  );
}
