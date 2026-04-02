/* ═══════════════════════════════════════════════════════════════
   header.ts — Rendu du header (solde + mini-cards + switcher compte)
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { getBankBalance, getProjectedBalance } from '../core/service';
import { fmt, fmtCompact, fmtAbs } from './format';

export function renderHeader(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  renderAccountSwitcher(data, accountId);
  renderBalance(data, month, accountId, mode);
  renderMonthNav(month);
}

// ── Switcher compte ───────────────────────────────────────────

function renderAccountSwitcher(data: AppData, activeId: AccountId) {
  const container = document.getElementById('account-switcher');
  if (!container) return;

  container.innerHTML = data.accounts.map(acc => `
    <button
      class="acc-pill${acc.id === activeId ? ' acc-pill-active' : ''}"
      onclick="setAccount('${acc.id}')"
    >
      <span>${acc.icon}</span>
      <span>${acc.name}</span>
    </button>
  `).join('');
}

// ── Balance + mini-cards ──────────────────────────────────────

function renderBalance(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  const account = data.accounts.find(a => a.id === accountId);
  const isChecking = !account || account.type === 'checking';

  const el = (id: string) => document.getElementById(id);

  // Nettoyer les classes de couleur du solde principal à chaque rendu
  el('bal-main')?.classList.remove('neg', 'pos');

  if (isChecking) {
    const bankBalance = getBankBalance(data, month, accountId);

    // Fallback cumul si pas d'ancre (réel = sans prévus, prévu = avec prévus)
    const cumBalReel = data.txs
      .filter(t => t.accountId === accountId && !t.planned && (t.kind === 'income' || t.kind === 'expense'))
      .reduce((s, t) => s + (t.kind === 'income' ? t.amountCents : -t.amountCents), 0);
    const cumBalPrev = data.txs
      .filter(t => t.accountId === accountId && (t.kind === 'income' || t.kind === 'expense'))
      .reduce((s, t) => s + (t.kind === 'income' ? t.amountCents : -t.amountCents), 0);

    // Mini-helper : income/expense + transfer_in/out du mois (hors prévus si réel)
    const monthFlow = (includePlanned: boolean) => {
      const txs = data.txs.filter(t =>
        t.accountId === accountId &&
        t.date.startsWith(month) &&
        (includePlanned || !t.planned)
      );
      const inc = txs.filter(t => t.kind === 'income'   || t.kind === 'transfer_in')
        .reduce((s, t) => s + t.amountCents, 0);
      const exp = txs.filter(t => t.kind === 'expense'  || t.kind === 'transfer_out')
        .reduce((s, t) => s + t.amountCents, 0);
      return { inc, exp, bilan: inc - exp };
    };

    if (mode === 'reel') {
      const flow = monthFlow(false);
      el('bal-label')!.textContent     = 'Solde banque';
      el('bal-main')!.innerHTML        = fmt(bankBalance ?? cumBalReel);
      el('bal-inc-lbl')!.textContent   = 'Revenus';
      el('bal-exp-lbl')!.textContent   = 'Dépenses';
      el('bal-month-lbl')!.textContent = 'Bilan';
      el('bal-inc')!.textContent       = fmtAbs(flow.inc);
      el('bal-exp')!.textContent       = fmtAbs(flow.exp);
      el('bal-month')!.textContent     = fmtCompact(flow.bilan);
      setSign('bal-month', flow.bilan);
    } else {
      const projBalance = getProjectedBalance(data, month, accountId);
      const flow = monthFlow(true);
      el('bal-label')!.textContent     = 'Solde prévu';
      el('bal-main')!.innerHTML        = fmt(projBalance ?? cumBalPrev);
      el('bal-inc-lbl')!.textContent   = 'Revenus prev.';
      el('bal-exp-lbl')!.textContent   = 'Dépenses prev.';
      el('bal-month-lbl')!.textContent = 'Bilan prev.';
      el('bal-inc')!.textContent       = fmtAbs(flow.inc);
      el('bal-exp')!.textContent       = fmtAbs(flow.exp);
      el('bal-month')!.textContent     = fmtCompact(flow.bilan);
      setSign('bal-month', flow.bilan);
    }
  } else if (account?.type === 'savings') {
    // Livret : solde depuis ancre si dispo, sinon cumul total (income + transfer_in)
    const bankBal = getBankBalance(data, month, accountId);
    const allTxs  = data.txs.filter(t => t.accountId === accountId && !t.planned);
    const allInc  = allTxs.filter(t => t.kind === 'income' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const allExp  = allTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const solde   = bankBal !== null ? bankBal : (allInc - allExp);
    // Versé/Retiré ce mois = income/expense + transfer_in/out du mois
    const monthTxs     = allTxs.filter(t => t.date.startsWith(month));
    const verseCeMois  = monthTxs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const retireCeMois = monthTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const bilanMois    = verseCeMois - retireCeMois;
    el('bal-label')!.textContent     = 'Solde livret';
    el('bal-main')!.innerHTML        = fmt(solde);
    el('bal-inc-lbl')!.textContent   = 'Versé ce mois';
    el('bal-exp-lbl')!.textContent   = 'Retiré ce mois';
    el('bal-month-lbl')!.textContent = 'Ce mois';
    el('bal-inc')!.textContent       = fmtAbs(verseCeMois);
    el('bal-exp')!.textContent       = fmtAbs(retireCeMois);
    el('bal-month')!.textContent     = fmtCompact(bilanMois);
    setSign('bal-month', bilanMois);
  } else if (account?.type === 'credit') {
    // Crédit : restant à payer
    // Réel = sans prévus ; Prévision = avec prévus du mois cible inclus
    const allReal = data.txs.filter(t => t.accountId === accountId && !t.planned);
    const allPrev = mode === 'previsionnel'
      ? data.txs.filter(t => t.accountId === accountId && t.planned && t.date.startsWith(month))
      : [];
    const allTxs = [...allReal, ...allPrev];

    const totalEmprunte  = allTxs.filter(t => t.kind === 'income'  || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const totalRembourse = allTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const restant   = Math.max(0, totalEmprunte - totalRembourse);
    const monthCard = el('bal-month')?.closest('.bal-mini') as HTMLElement | null;

    el('bal-label')!.textContent     = mode === 'previsionnel' ? 'Restant prévu' : 'Restant à payer';
    el('bal-main')!.innerHTML        = fmt(restant);
    el('bal-main')!.classList.toggle('neg', restant > 0);
    const monthTxsCredit = allTxs.filter(t => t.date.startsWith(month));
    const rembCeMois     = monthTxsCredit.filter(t => t.kind === 'expense' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    el('bal-inc-lbl')!.textContent   = mode === 'previsionnel' ? 'Remboursé prévu' : 'Remboursé ce mois';
    el('bal-exp-lbl')!.textContent   = account.mensualite ? 'Mensualité' : 'Total remboursé';
    el('bal-inc')!.textContent       = fmtAbs(rembCeMois);
    el('bal-exp')!.textContent       = account.mensualite ? fmtAbs(account.mensualite) : fmtAbs(totalRembourse);

    if (monthCard && account.mensualite && restant > 0) {
      monthCard.style.display = '';
      const moisRestants = Math.ceil(restant / account.mensualite);
      el('bal-month-lbl')!.textContent = 'Mois restants';
      el('bal-month')!.textContent     = String(moisRestants);
      el('bal-month')!.className       = 'bal-mini-val';
    } else if (monthCard) {
      monthCard.style.display = 'none';
    }
  }
}

function setSign(id: string, cents: number) {
  const e = document.getElementById(id);
  if (!e) return;
  e.classList.toggle('pos', cents > 0);
  e.classList.toggle('neg', cents < 0);
}

// ── Navigation mois ───────────────────────────────────────────

function renderMonthNav(month: MonthKey) {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const text  = label.charAt(0).toUpperCase() + label.slice(1);
  ['mn-lbl', 'mn-lbl-stats', 'mn-lbl-analyse'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}
