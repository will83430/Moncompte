/* ═══════════════════════════════════════════════════════════════
   header.ts — Rendu du header (solde + mini-cards + switcher compte)
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { getBankBalance, getProjectedBalance, getMonthSummary } from '../core/service';
import { fmt, fmtCompact } from './format';

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
      class="acc-btn${acc.id === activeId ? ' active' : ''}"
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

  if (isChecking) {
    const bankBalance = getBankBalance(data, month, accountId);

    if (mode === 'reel') {
      // Gros chiffre = Solde banque estimé
      const summary = getMonthSummary(data, month, accountId, 'reel');
      el('bal-label')!.textContent   = 'Solde banque estimé';
      el('bal-main')!.innerHTML      = bankBalance !== null ? fmt(bankBalance) : '—';
      el('bal-inc-lbl')!.textContent = 'Revenus';
      el('bal-exp-lbl')!.textContent = 'Dépenses';
      el('bal-month-lbl')!.textContent = 'Bilan';
      el('bal-inc')!.textContent     = fmtCompact(summary.incomeCents);
      el('bal-exp')!.textContent     = fmtCompact(summary.expenseCents);
      el('bal-month')!.textContent   = fmtCompact(summary.bilanCents);
      setSign('bal-month', summary.bilanCents);
    } else {
      // Gros chiffre = Solde prévu
      const projBalance = getProjectedBalance(data, month, accountId);
      const realSummary = getMonthSummary(data, month, accountId, 'reel');
      const planSummary = getMonthSummary(data, month, accountId, 'previsionnel');
      el('bal-label')!.textContent   = 'Solde prévu';
      el('bal-main')!.innerHTML      = projBalance !== null ? fmt(projBalance) : '—';
      el('bal-inc-lbl')!.textContent = 'Revenus prev.';
      el('bal-exp-lbl')!.textContent = 'Dépenses prev.';
      el('bal-month-lbl')!.textContent = 'Bilan prev.';
      el('bal-inc')!.textContent     = fmtCompact(planSummary.incomeCents);
      el('bal-exp')!.textContent     = fmtCompact(planSummary.expenseCents);
      el('bal-month')!.textContent   = fmtCompact(planSummary.bilanCents);
      setSign('bal-month', planSummary.bilanCents);
    }
  } else {
    // Compte épargne ou crédit : affiche bilan du mois
    const summary = getMonthSummary(data, month, accountId, mode);
    el('bal-label')!.textContent = mode === 'reel' ? 'Bilan du mois' : 'Bilan prévu';
    el('bal-main')!.innerHTML    = fmtCompact(summary.bilanCents);
    el('bal-inc')!.textContent   = fmtCompact(summary.incomeCents);
    el('bal-exp')!.textContent   = fmtCompact(summary.expenseCents);
    el('bal-month')!.textContent = fmtCompact(summary.bilanCents);
    setSign('bal-main',  summary.bilanCents);
    setSign('bal-month', summary.bilanCents);
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
  const el = document.getElementById('mn-lbl');
  if (!el) return;
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  el.textContent = label.charAt(0).toUpperCase() + label.slice(1);
}
