/* ═══════════════════════════════════════════════════════════════
   addForm.ts — Formulaire ajout transaction / virement
   ═══════════════════════════════════════════════════════════════ */

import { IsoDate, AccountId } from '../core/types';
import { addTransaction, addTransfer } from '../core/service';
import { SYSTEM_CATS } from '../core/categories';
import { getState, setState } from './app';
import { Nav, Router } from './router';
import { toast } from './toast';
import { inputToCents } from './format';

// ── Type actif (income / expense / transfer) ─────────────────

type FormKind = 'income' | 'expense' | 'transfer';
let _kind: FormKind = 'expense';

export function setFormKind(kind: FormKind) {
  _kind = kind;
  const isTransfer = kind === 'transfer';

  // Boutons actifs
  document.querySelectorAll<HTMLElement>('.type-btn').forEach(btn => {
    btn.classList.remove('act-exp', 'act-inc', 'act-transfer');
    if (btn.dataset['kind'] === kind) {
      if (kind === 'expense')  btn.classList.add('act-exp');
      if (kind === 'income')   btn.classList.add('act-inc');
      if (kind === 'transfer') btn.classList.add('act-transfer');
    }
  });

  const show = (id: string, visible: boolean) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? 'block' : 'none';
  };

  show('add-cat-field',    !isTransfer);
  show('add-credit-field', kind === 'expense');
  show('transfer-section', isTransfer);
  show('add-rec-field',    !isTransfer);

  if (!isTransfer) refreshCatSelect(kind);
}

// ── Remplissage select catégorie ──────────────────────────────

function refreshCatSelect(kind: 'income' | 'expense') {
  const sel = document.getElementById('add-cat') as HTMLSelectElement | null;
  if (!sel) return;

  const state = getState();
  const incomeGroups = ['Revenus pro', 'Revenus immo', 'Aides', 'Épargne', 'Divers'];
  const sys = SYSTEM_CATS.filter(c =>
    kind === 'income' ? incomeGroups.includes(c.group) : !incomeGroups.includes(c.group)
  );
  const custom = (state.customCats || []).filter(c => c.type === kind);

  const groups = new Map<string, typeof sys>();
  for (const c of sys) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)!.push(c);
  }

  let html = '';
  for (const [grp, cats] of groups) {
    html += `<optgroup label="── ${grp}">`;
    for (const c of cats) {
      html += `<option value="${c.id}">${c.icon} ${c.label}</option>`;
    }
    html += '</optgroup>';
  }
  if (custom.length) {
    html += `<optgroup label="── Personnalisées">`;
    for (const c of custom) {
      html += `<option value="${c.id}">${c.icon} ${c.label}</option>`;
    }
    html += '</optgroup>';
  }
  sel.innerHTML = html;
}

// ── Soumission ────────────────────────────────────────────────

export async function submitAddForm(e: Event) {
  e.preventDefault();

  const desc    = (document.getElementById('add-desc')    as HTMLInputElement).value.trim();
  const amount  = inputToCents((document.getElementById('add-amount') as HTMLInputElement).value);
  const date    = (document.getElementById('add-date')    as HTMLInputElement).value as IsoDate;
  const cat     = (document.getElementById('add-cat')     as HTMLSelectElement).value || 'autre_dep';
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
      desc:    desc || 'Virement',
      planned,
    }));
    toast('✓ Virement ajouté');
  } else {
    const creditSel = document.getElementById('add-credit-account') as HTMLSelectElement | null;
    const creditAccountId = creditSel?.value || undefined;

    await setState(addTransaction(state, {
      accountId,
      date,
      amountCents: amount,
      kind:        _kind as 'income' | 'expense',
      cat,
      desc,
      planned,
      recurring:   isRec,
      ...(creditAccountId ? { creditAccountId: creditAccountId as AccountId } : {}),
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
  const dateEl = document.getElementById('add-date') as HTMLInputElement | null;
  if (dateEl) dateEl.value = todayIso();
  refreshCatSelect('expense');
}

// ── Init (appelé au chargement de la section) ─────────────────

export function initAddForm() {
  const dateEl = document.getElementById('add-date') as HTMLInputElement | null;
  if (dateEl && !dateEl.value) dateEl.value = todayIso();

  // Remplir catégories
  const catKind: 'income' | 'expense' = (_kind === 'income') ? 'income' : 'expense';
  refreshCatSelect(catKind);

  // Remplir sélecteur de compte cible pour les virements
  const toSelect = document.getElementById('add-transfer-to') as HTMLSelectElement | null;
  if (toSelect) {
    const state = getState();
    const current = Nav.accountId;
    toSelect.innerHTML = state.accounts
      .filter(a => a.id !== current)
      .map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`)
      .join('');
  }

  // Remplir comptes liés (épargne + crédit, groupés)
  const creditSel = document.getElementById('add-credit-account') as HTMLSelectElement | null;
  if (creditSel) {
    const state = getState();
    const savings = state.accounts.filter(a => a.type === 'savings');
    const credits = state.accounts.filter(a => a.type === 'credit');
    const savingsOpts = savings.length
      ? `<optgroup label="── Épargne (versement)">${savings.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}</optgroup>` : '';
    const creditOpts = credits.length
      ? `<optgroup label="── Crédit (remboursement)">${credits.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}</optgroup>` : '';
    creditSel.innerHTML = `<option value="">— Aucun —</option>${savingsOpts}${creditOpts}`;
  }

  setFormKind(_kind);
}

// ── Helpers ───────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Exposer globalement
(window as any).setFormKind   = setFormKind;
(window as any).submitAddForm = submitAddForm;
(window as any).initAddForm   = initAddForm;
