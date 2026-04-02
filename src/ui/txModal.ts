/* ═══════════════════════════════════════════════════════════════
   txModal.ts — Modal édition transaction (style V1)
   ═══════════════════════════════════════════════════════════════ */

import { AppData, Transaction, TxId, IsoDate } from '../core/types';
import { updateTransactionWithMirror, confirmTransaction, revertToPlanned, deleteTransaction, removeTransfer } from '../core/service';
import { SYSTEM_CATS } from '../core/categories';
import { getState, setState } from './app';
import { toast } from './toast';
import { centsToInput, inputToCents } from './format';

let _txId: TxId | null = null;
let _editKind: 'income' | 'expense' = 'expense';

// ── Ouvrir le modal ───────────────────────────────────────────

export function openTxModal(id: TxId) {
  _txId = id;
  const state = getState();
  const tx = state.txs.find(t => t.id === id);
  if (!tx) return;

  const isTransfer = tx.kind === 'transfer_out' || tx.kind === 'transfer_in';

  if (isTransfer) {
    // Pour les virements : juste afficher + supprimer, pas d'édition
    renderTransferModal(tx);
  } else {
    // Ouvrir directement en mode édition comme V1
    _editKind = tx.kind === 'income' ? 'income' : 'expense';
    renderEditModal(tx, state);
  }

  document.getElementById('tx-modal')!.classList.add('open');
}

export function closeTxModal() {
  document.getElementById('tx-modal')!.classList.remove('open');
  _txId = null;
}

// ── Modal virement (lecture seule) ────────────────────────────

function renderTransferModal(tx: Transaction) {
  const box = document.getElementById('tx-modal-inner')!;
  box.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-title">Modifier la transaction</div>

    <div class="modal-field" style="text-align:center;padding:6px 0 2px;">
      <span class="badge-transfer">↔ Virement</span>
      ${tx.planned ? '<span class="badge-planned">Prévu</span>' : ''}
    </div>

    <div class="modal-field" style="display:flex;gap:10px;align-items:flex-end;">
      <div style="flex:0 0 64px;">
        <label>Icône</label>
        <input type="text" id="tx-edit-icon" value="${/^[\w_-]+$/.test(tx.cat) ? '↔️' : tx.cat}" maxlength="4"
               style="font-size:22px;text-align:center;padding:10px 4px;width:64px;">
      </div>
      <div style="flex:1;">
        <label>Description</label>
        <input type="text" id="tx-edit-desc" value="${escHtml(tx.desc)}" placeholder="Description">
      </div>
    </div>

    <div class="modal-field">
      <label>Montant (€)</label>
      <input type="text" id="tx-edit-amt" inputmode="decimal" value="${centsToInput(tx.amountCents)}">
    </div>

    <div class="modal-field">
      <label>Date</label>
      <input type="date" id="tx-edit-date" value="${tx.date}">
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-planned">
        <input type="checkbox" id="tx-edit-planned" ${tx.planned ? 'checked' : ''}>
        <div><div>Transaction prévue</div><small>Décocher quand elle est effectuée</small></div>
      </label>
    </div>

    <div class="modal-btns" style="margin-top:8px;">
      <button class="modal-btn-cancel" onclick="closeTxModal()">Annuler</button>
      ${tx.planned
        ? `<button class="modal-btn-save" onclick="txModalConfirm()">✓ Valider</button>`
        : `<button class="modal-btn-save" onclick="txModalSaveTransfer()">Enregistrer</button>`
      }
    </div>
  `;
}

// ── Modal édition complet (style V1) ──────────────────────────

function renderEditModal(tx: Transaction, data: AppData) {
  const box = document.getElementById('tx-modal-inner')!;

  box.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-title">Modifier la transaction</div>

    <div class="modal-field">
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        <button id="tx-edit-btn-exp" onclick="txModalSetKind('expense')"
          style="flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;
                 border:2px solid ${tx.kind === 'expense' ? '#c8102e' : 'var(--border)'};
                 background:${tx.kind === 'expense' ? '#fff0f0' : 'var(--bg)'};
                 color:${tx.kind === 'expense' ? '#c8102e' : 'var(--text2)'};">Dépense</button>
        <button id="tx-edit-btn-inc" onclick="txModalSetKind('income')"
          style="flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;
                 border:2px solid ${tx.kind === 'income' ? 'var(--green)' : 'var(--border)'};
                 background:${tx.kind === 'income' ? '#f0fff4' : 'var(--bg)'};
                 color:${tx.kind === 'income' ? 'var(--green)' : 'var(--text2)'};">Revenu</button>
      </div>
    </div>

    <div class="modal-field">
      <label>Description</label>
      <input type="text" id="tx-edit-desc" value="${escHtml(tx.desc)}" placeholder="Description">
    </div>

    <div class="modal-field">
      <label>Montant (€)</label>
      <input type="text" id="tx-edit-amt" inputmode="decimal"
             value="${centsToInput(tx.amountCents)}">
    </div>

    <div class="modal-field">
      <label>Date</label>
      <input type="date" id="tx-edit-date" value="${tx.date}">
    </div>

    <div class="modal-field">
      <label>Catégorie</label>
      <select id="tx-edit-cat">${buildCatOptions(tx.kind === 'income' ? 'income' : 'expense', tx.cat, data)}</select>
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-planned">
        <input type="checkbox" id="tx-edit-planned" ${tx.planned ? 'checked' : ''}>
        <div><div>Transaction prévue</div><small>Décocher quand elle est effectuée</small></div>
      </label>
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-neutral">
        <input type="checkbox" id="tx-edit-neutral" ${tx.kind === 'transfer_out' || (tx as any)._neutral ? 'checked' : ''}>
        <div><div>Virement neutre</div><small>Exclu des stats et du bilan</small></div>
      </label>
    </div>

    <div class="modal-field">
      <label class="field-check" for="tx-edit-rec">
        <input type="checkbox" id="tx-edit-rec" ${tx.recurring ? 'checked' : ''}>
        <div><div>Récurrente</div><small>Sera proposée automatiquement chaque mois</small></div>
      </label>
    </div>

    ${buildCreditField(tx, data)}

    <div class="modal-btns" style="margin-top:8px;">
      <button class="modal-btn-cancel" onclick="closeTxModal()">Annuler</button>
      <button class="modal-btn-save" onclick="txModalSave()">Enregistrer</button>
    </div>
  `;
}

// ── Toggle dépense/revenu ─────────────────────────────────────

export function txModalSetKind(kind: 'income' | 'expense') {
  _editKind = kind;
  const btnExp = document.getElementById('tx-edit-btn-exp') as HTMLButtonElement;
  const btnInc = document.getElementById('tx-edit-btn-inc') as HTMLButtonElement;
  if (!btnExp || !btnInc) return;

  if (kind === 'expense') {
    btnExp.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;';
    btnInc.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);';
  } else {
    btnInc.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--green);background:#f0fff4;color:var(--green);';
    btnExp.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);';
  }

  // Rafraîchir la liste de catégories
  const sel = document.getElementById('tx-edit-cat') as HTMLSelectElement | null;
  if (sel) {
    const state = getState();
    sel.innerHTML = buildCatOptions(kind, sel.value, state);
  }
}

// ── Champ compte crédit lié ───────────────────────────────────

function buildCreditField(tx: Transaction, data: AppData): string {
  if (tx.kind === 'income') return '';
  const savings = data.accounts.filter(a => a.type === 'savings');
  const credits = data.accounts.filter(a => a.type === 'credit');
  if (savings.length === 0 && credits.length === 0) return '';
  const current = (tx as any).creditAccountId ?? '';
  const savingsOpts = savings.length
    ? `<optgroup label="── Épargne (versement)">
        ${savings.map(a => `<option value="${a.id}" ${a.id === current ? 'selected' : ''}>${a.icon} ${a.name}</option>`).join('')}
       </optgroup>` : '';
  const creditOpts = credits.length
    ? `<optgroup label="── Crédit (remboursement)">
        ${credits.map(a => `<option value="${a.id}" ${a.id === current ? 'selected' : ''}>${a.icon} ${a.name}</option>`).join('')}
       </optgroup>` : '';
  return `
    <div class="modal-field">
      <label>Compte lié</label>
      <select id="tx-edit-credit">
        <option value="">— Aucun —</option>
        ${savingsOpts}${creditOpts}
      </select>
      <small style="color:var(--text2);font-size:11px;">À la validation, injecte aussi une transaction dans ce compte</small>
    </div>
  `;
}

// ── Construire les options catégorie groupées ─────────────────

function buildCatOptions(kind: 'income' | 'expense', currentCat: string, data: AppData): string {
  const isIncome = kind === 'income';

  // Catégories système filtrées par type
  const incomeGroups = ['Revenus pro', 'Revenus immo', 'Aides', 'Épargne', 'Divers'];
  const sys = SYSTEM_CATS.filter(c =>
    isIncome ? incomeGroups.includes(c.group) : !incomeGroups.includes(c.group)
  );

  // Catégories custom
  const custom = (data.customCats || []).filter(c => c.type === kind);

  // Grouper
  const groups = new Map<string, typeof sys>();
  for (const c of sys) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group)!.push(c);
  }

  let html = '';
  for (const [grp, cats] of groups) {
    html += `<optgroup label="── ${grp}">`;
    for (const c of cats) {
      html += `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.icon} ${c.label}</option>`;
    }
    html += '</optgroup>';
  }
  if (custom.length) {
    html += `<optgroup label="── Personnalisées">`;
    for (const c of custom) {
      html += `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.icon} ${c.label}</option>`;
    }
    html += '</optgroup>';
  }
  return html;
}

// ── Actions ───────────────────────────────────────────────────

export async function txModalSave() {
  if (!_txId) return;

  const desc      = (document.getElementById('tx-edit-desc') as HTMLInputElement).value.trim();
  const amount    = inputToCents((document.getElementById('tx-edit-amt') as HTMLInputElement).value);
  const date      = (document.getElementById('tx-edit-date') as HTMLInputElement).value as IsoDate;
  const cat       = (document.getElementById('tx-edit-cat') as HTMLSelectElement).value;
  const planned   = (document.getElementById('tx-edit-planned') as HTMLInputElement).checked;
  const recurring = (document.getElementById('tx-edit-rec') as HTMLInputElement).checked;

  if (amount < 0 || !date) { toast('⚠ Montant ou date invalide'); return; }

  // Virement neutre → kind devient transfer_out (exclu des stats)
  const neutral = (document.getElementById('tx-edit-neutral') as HTMLInputElement).checked;
  const kind = neutral ? 'transfer_out' as const : _editKind;

  const creditSel = document.getElementById('tx-edit-credit') as HTMLSelectElement | null;
  const creditAccountId = creditSel?.value || undefined;

  await setState(updateTransactionWithMirror(getState(), _txId, {
    desc, amountCents: amount, date, cat, planned, recurring, kind,
    ...(creditAccountId ? { creditAccountId: creditAccountId as import('../core/types').AccountId } : {}),
  }));
  closeTxModal();
  toast('✓ Transaction modifiée');
}

/** Enregistre les modifications d'un virement (desc, montant, date, planned sur les deux jambes) */
export async function txModalSaveTransfer() {
  if (!_txId) return;

  const desc    = (document.getElementById('tx-edit-desc') as HTMLInputElement).value.trim();
  const amount  = inputToCents((document.getElementById('tx-edit-amt') as HTMLInputElement).value);
  const date    = (document.getElementById('tx-edit-date') as HTMLInputElement).value as import('../core/types').IsoDate;
  const planned = (document.getElementById('tx-edit-planned') as HTMLInputElement).checked;
  const icon    = (document.getElementById('tx-edit-icon') as HTMLInputElement).value.trim() || '↔️';

  if (amount <= 0 || !date) { toast('⚠ Montant ou date invalide'); return; }

  const state = getState();
  const tx = state.txs.find(t => t.id === _txId);
  if (!tx) return;

  const patch = { desc, amountCents: amount, date, planned, cat: icon };
  let updated = updateTransactionWithMirror(state, _txId, patch);

  // Mettre à jour aussi l'autre jambe du virement
  if (tx.transferId) {
    const other = state.txs.find(t => t.transferId === tx.transferId && t.id !== _txId);
    if (other) updated = updateTransactionWithMirror(updated, other.id, patch);
  }

  await setState(updated);
  closeTxModal();
  toast('✓ Virement modifié');
}

export async function txModalConfirm() {
  if (!_txId) return;
  await setState(confirmTransaction(getState(), _txId));
  closeTxModal();
  toast('✓ Transaction validée');
}

export async function txModalRevert() {
  if (!_txId) return;
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

// ── Helpers ───────────────────────────────────────────────────

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Exposer globalement
(window as any).openTxModal          = openTxModal;
(window as any).closeTxModal         = closeTxModal;
(window as any).txModalSetKind       = txModalSetKind;
(window as any).txModalSave          = txModalSave;
(window as any).txModalSaveTransfer  = txModalSaveTransfer;
(window as any).txModalConfirm       = txModalConfirm;
(window as any).txModalRevert        = txModalRevert;
(window as any).txModalDelete        = txModalDelete;
