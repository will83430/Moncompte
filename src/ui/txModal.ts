/* ═══════════════════════════════════════════════════════════════
   txModal.ts — Modal détail / édition / actions transaction
   ═══════════════════════════════════════════════════════════════ */

import { AppData, Transaction, TxId, IsoDate } from '../core/types';
import { updateTransaction, confirmTransaction, revertToPlanned, deleteTransaction, removeTransfer } from '../core/service';
import { getState, setState } from './app';
import { toast } from './toast';
import { fmt, fmtDateLong, centsToInput, inputToCents } from './format';

let _txId: TxId | null = null;

// ── Ouvrir le modal ───────────────────────────────────────────

export function openTxModal(id: TxId) {
  _txId = id;
  const state = getState();
  const tx = state.txs.find(t => t.id === id);
  if (!tx) return;

  renderModal(tx, state);
  document.getElementById('tx-modal')!.classList.add('open');
}

export function closeTxModal() {
  document.getElementById('tx-modal')!.classList.remove('open');
  _txId = null;
}

// ── Rendu ─────────────────────────────────────────────────────

function renderModal(tx: Transaction, data: AppData) {
  const isTransfer = tx.kind === 'transfer_out' || tx.kind === 'transfer_in';
  const isPlanned  = tx.planned;
  const isIncome   = tx.kind === 'income';
  const signCls    = isIncome || tx.kind === 'transfer_in' ? 'pos' : 'neg';

  document.getElementById('tx-modal-title')!.textContent = tx.desc || 'Transaction';
  document.getElementById('tx-modal-amount')!.innerHTML =
    `<span class="${signCls}">${isIncome ? '+' : '-'}${fmt(tx.amountCents)}</span>`;
  document.getElementById('tx-modal-date')!.textContent = fmtDateLong(tx.date);
  document.getElementById('tx-modal-cat')!.textContent  = tx.cat;

  // Badges
  const badges = document.getElementById('tx-modal-badges')!;
  badges.innerHTML = [
    isPlanned  ? '<span class="badge-planned">Prévu</span>'     : '',
    tx.recurring ? '<span class="badge-rec">↺ Récurrent</span>' : '',
    isTransfer ? '<span class="badge-transfer">Virement</span>' : '',
  ].join('');

  // Boutons d'action
  const actions = document.getElementById('tx-modal-actions')!;
  actions.innerHTML = '';

  if (isPlanned) {
    actions.innerHTML += `
      <button class="btn-primary" onclick="txModalConfirm()">✓ Valider</button>
    `;
  } else {
    actions.innerHTML += `
      <button class="btn-secondary" onclick="txModalRevert()">↩ Remettre en prévu</button>
    `;
  }

  actions.innerHTML += `
    <button class="btn-edit" onclick="txModalEdit()">✏ Modifier</button>
    <button class="btn-danger" onclick="txModalDelete()">🗑 Supprimer</button>
  `;
}

// ── Zone édition inline ───────────────────────────────────────

function renderEditForm(tx: Transaction) {
  const form = document.getElementById('tx-modal-edit-form')!;
  form.style.display = 'block';
  form.innerHTML = `
    <div class="edit-field">
      <label>Description</label>
      <input id="edit-desc" type="text" value="${escHtml(tx.desc)}" />
    </div>
    <div class="edit-field">
      <label>Montant (€)</label>
      <input id="edit-amount" type="number" step="0.01" min="0"
             value="${centsToInput(tx.amountCents)}" />
    </div>
    <div class="edit-field">
      <label>Date</label>
      <input id="edit-date" type="date" value="${tx.date}" />
    </div>
    <div class="edit-field">
      <label>Catégorie</label>
      <input id="edit-cat" type="text" value="${escHtml(tx.cat)}" />
    </div>
    <div class="edit-field-row">
      <label><input id="edit-planned" type="checkbox" ${tx.planned ? 'checked' : ''} /> Prévisionnel</label>
    </div>
    <div class="edit-actions">
      <button class="btn-primary" onclick="txModalSave()">Sauvegarder</button>
      <button class="btn-secondary" onclick="txModalCancelEdit()">Annuler</button>
    </div>
  `;
}

// ── Actions globales ──────────────────────────────────────────

export async function txModalConfirm() {
  if (!_txId) return;
  if (!confirm('Valider cette transaction comme réelle ?')) return;
  await setState(confirmTransaction(getState(), _txId));
  closeTxModal();
  toast('✓ Transaction validée');
}

export async function txModalRevert() {
  if (!_txId) return;
  if (!confirm('Remettre cette transaction en "Prévu" ?')) return;
  await setState(revertToPlanned(getState(), _txId));
  closeTxModal();
  toast('↩ Transaction remise en prévu');
}

export async function txModalDelete() {
  if (!_txId) return;
  const state = getState();
  const tx = state.txs.find(t => t.id === _txId);
  if (!tx) return;

  if (tx.transferId) {
    if (!confirm('Ce virement a deux jambes. Supprimer les deux ?')) return;
    await setState(removeTransfer(state, tx.transferId));
  } else {
    if (!confirm('Supprimer cette transaction ?')) return;
    await setState(deleteTransaction(state, _txId));
  }
  closeTxModal();
  toast('✓ Transaction supprimée');
}

export function txModalEdit() {
  if (!_txId) return;
  const tx = getState().txs.find(t => t.id === _txId);
  if (tx) renderEditForm(tx);
}

export async function txModalSave() {
  if (!_txId) return;

  const desc    = (document.getElementById('edit-desc') as HTMLInputElement).value.trim();
  const amount  = inputToCents((document.getElementById('edit-amount') as HTMLInputElement).value);
  const date    = (document.getElementById('edit-date') as HTMLInputElement).value as IsoDate;
  const cat     = (document.getElementById('edit-cat') as HTMLInputElement).value.trim();
  const planned = (document.getElementById('edit-planned') as HTMLInputElement).checked;

  if (!desc || amount <= 0 || !date) { toast('Champs invalides'); return; }

  await setState(updateTransaction(getState(), _txId, { desc, amountCents: amount, date, cat, planned }));
  closeTxModal();
  toast('✓ Transaction modifiée');
}

export function txModalCancelEdit() {
  const form = document.getElementById('tx-modal-edit-form')!;
  form.style.display = 'none';
  form.innerHTML = '';
}

// ── Helpers ───────────────────────────────────────────────────

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Exposer globalement
(window as any).openTxModal       = openTxModal;
(window as any).closeTxModal      = closeTxModal;
(window as any).txModalConfirm    = txModalConfirm;
(window as any).txModalRevert     = txModalRevert;
(window as any).txModalDelete     = txModalDelete;
(window as any).txModalEdit       = txModalEdit;
(window as any).txModalSave       = txModalSave;
(window as any).txModalCancelEdit = txModalCancelEdit;
