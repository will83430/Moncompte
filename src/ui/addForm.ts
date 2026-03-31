/* ═══════════════════════════════════════════════════════════════
   addForm.ts — Formulaire ajout transaction / virement
   ═══════════════════════════════════════════════════════════════ */

import { IsoDate, AccountId } from '../core/types';
import { addTransaction, addTransfer } from '../core/service';
import { getState, setState } from './app';
import { Nav, Router } from './router';
import { toast } from './toast';
import { inputToCents } from './format';

// ── Type actif (income / expense / transfer) ─────────────────

type FormKind = 'income' | 'expense' | 'transfer';
let _kind: FormKind = 'expense';

export function setFormKind(kind: FormKind) {
  _kind = kind;
  document.querySelectorAll<HTMLElement>('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset['kind'] === kind);
  });
  const transferSection = document.getElementById('transfer-section');
  if (transferSection) transferSection.style.display = kind === 'transfer' ? 'block' : 'none';
}

// ── Soumission ────────────────────────────────────────────────

export async function submitAddForm(e: Event) {
  e.preventDefault();

  const desc    = (document.getElementById('add-desc')    as HTMLInputElement).value.trim();
  const amount  = inputToCents((document.getElementById('add-amount') as HTMLInputElement).value);
  const date    = (document.getElementById('add-date')    as HTMLInputElement).value as IsoDate;
  const cat     = (document.getElementById('add-cat')     as HTMLInputElement).value || 'autre';
  const planned = (document.getElementById('add-planned') as HTMLInputElement)?.checked ?? false;
  const isRec   = (document.getElementById('add-rec')     as HTMLInputElement)?.checked ?? false;

  if (!desc)       { toast('Ajoutez une description'); return; }
  if (amount <= 0) { toast('Montant invalide'); return; }
  if (!date)       { toast('Date requise'); return; }

  const accountId = Nav.accountId;
  const state     = getState();

  if (_kind === 'transfer') {
    const toId = (document.getElementById('add-transfer-to') as HTMLSelectElement).value as AccountId;
    if (!toId || toId === accountId) { toast('Compte destinataire invalide'); return; }

    await setState(addTransfer(state, {
      fromAccountId: accountId,
      toAccountId:   toId,
      amountCents:   amount,
      date,
      desc: desc || 'Virement',
    }));
    toast('✓ Virement ajouté');
  } else {
    await setState(addTransaction(state, {
      accountId,
      date,
      amountCents: amount,
      kind:        _kind,
      cat,
      desc,
      planned,
      recurring:   isRec,
    }));
    toast(`✓ ${_kind === 'income' ? 'Revenu' : 'Dépense'} ajouté${_kind === 'income' ? '' : 'e'}`);
  }

  resetForm();
  Router.go('dash');
}

// ── Reset ─────────────────────────────────────────────────────

function resetForm() {
  const form = document.getElementById('add-form') as HTMLFormElement | null;
  if (form) form.reset();
  setFormKind('expense');
  // Remettre la date à aujourd'hui
  const dateEl = document.getElementById('add-date') as HTMLInputElement | null;
  if (dateEl) dateEl.value = todayIso();
}

// ── Init (appelé au chargement de la section) ─────────────────

export function initAddForm() {
  const dateEl = document.getElementById('add-date') as HTMLInputElement | null;
  if (dateEl && !dateEl.value) dateEl.value = todayIso();

  // Remplir le sélecteur de compte cible pour les virements
  const toSelect = document.getElementById('add-transfer-to') as HTMLSelectElement | null;
  if (toSelect) {
    const state = getState();
    const current = Nav.accountId;
    toSelect.innerHTML = state.accounts
      .filter(a => a.id !== current)
      .map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`)
      .join('');
  }

  setFormKind('expense');
}

// ── Helpers ───────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Exposer globalement
(window as any).setFormKind  = setFormKind;
(window as any).submitAddForm = submitAddForm;
(window as any).initAddForm  = initAddForm;
