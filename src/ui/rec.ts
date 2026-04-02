/* ═══════════════════════════════════════════════════════════════
   rec.ts — Gestion des récurrentes (style V1)
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, RecId, RecurringTemplate, MonthKey } from '../core/types';
import {
  addRecurring, updateRecurring, deleteRecurring, generatePlannedFromRecs,
} from '../core/service';
import { SYSTEM_CATS, getCatDef } from '../core/categories';
import { nextMonth, currentMonthKey } from '../core/balance';
import { setState, getState } from './app';
import { toast } from './toast';
import { fmt, inputToCents, centsToInput } from './format';
import { Nav } from './router';

function targetMonth(): MonthKey {
  return nextMonth(currentMonthKey());
}

// ── État local form ───────────────────────────────────────────

let _editId: RecId | null = null;
let _formKind: 'income' | 'expense' = 'expense';
let _formVisible = false;

// ── Rendu principal ───────────────────────────────────────────

export function renderRec(data: AppData, accountId: AccountId) {
  const el = document.getElementById('sec-rec');
  if (!el) return;

  const next  = targetMonth();
  const recs  = data.recs.filter(r => r.accountId === accountId);

  // Recs non encore importées pour le mois SUIVANT
  const pending = recs.filter(r =>
    r.active && !data.txs.some(t => t.recId === r.id && t.date.startsWith(next))
  );

  const pendingCount = pending.length;
  const nextLabel    = new Date(next + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  el.innerHTML = `
    <!-- Bannière si des recs sont en attente pour le mois suivant -->
    ${pendingCount > 0 ? `
    <div class="card" style="background:var(--accent-light,#fff8e6);border:1.5px solid var(--yellow,#f59e0b);margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="font-weight:600;font-size:14px;">⏳ ${pendingCount} récurrente${pendingCount > 1 ? 's' : ''} à importer</div>
          <div style="font-size:12px;color:var(--text2);">Pour ${nextLabel}</div>
        </div>
        <button class="modal-btn-save" onclick="generateRec()" style="white-space:nowrap;padding:8px 14px;font-size:13px;">
          Tout importer
        </button>
      </div>
    </div>` : ''}

    <!-- Liste des récurrentes -->
    <div class="rec-list">
      ${recs.length === 0
        ? '<p class="tx-empty">Aucune récurrente — appuyez sur + pour en créer une</p>'
        : recs.map(r => renderRecItem(r, data, next)).join('')
      }
    </div>

    <!-- Formulaire add/edit (caché par défaut) -->
    <div id="rec-form-wrap" style="display:${_formVisible ? 'block' : 'none'};">
      ${_formVisible ? buildRecForm(data, accountId) : ''}
    </div>

    <button onclick="openRecForm()"
      style="display:${_formVisible ? 'none' : 'flex'};position:fixed;bottom:80px;right:20px;width:52px;height:52px;border-radius:50%;background:var(--teal);color:#fff;border:none;font-size:28px;cursor:pointer;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,133,122,.35);z-index:10;font-family:Inter,sans-serif;">+</button>
  `;
}

function renderRecItem(r: RecurringTemplate, data: AppData, month: string): string {
  const cat      = getCatDef(r.cat, data.customCats);
  const sign     = r.kind === 'income' ? '+' : '-';
  const amtCls   = r.kind === 'income' ? 'pos' : 'neg';
  const icoColor = cat.color + '22';

  const alreadyApplied = data.txs.some(t => t.recId === r.id && t.date.startsWith(month));
  const isPending      = r.active && !alreadyApplied;

  return `
    <div class="rec-item" style="${r.active ? '' : 'opacity:0.5;'}">
      <div class="tx-ico" style="background:${icoColor};font-size:18px;">${cat.icon}</div>
      <div class="rec-body">
        <div class="rec-desc">${escHtml(r.desc)}</div>
        <div class="rec-meta">
          Le ${r.dayOfMonth} du mois
          ${alreadyApplied ? '<span class="badge-planned" style="background:#d1fae5;color:#065f46;">✓ importée</span>' : ''}
          ${!r.active ? '<span class="badge-planned">inactif</span>' : ''}
        </div>
      </div>
      <div class="rec-right">
        <div class="rec-amt ${amtCls}">${sign}${fmt(r.amountCents)}</div>
        <div style="display:flex;gap:4px;margin-top:6px;justify-content:flex-end;">
          ${isPending
            ? `<button class="rec-apply-btn" onclick="applyOneRec('${r.id}')" title="Importer ce mois">↓ Ce mois</button>`
            : ''
          }
          <button class="rec-edit-btn" onclick="openRecForm('${r.id}')" title="Modifier">✏️</button>
          <button class="rec-del" onclick="deleteRec('${r.id}')" title="Supprimer">✕</button>
        </div>
      </div>
    </div>
  `;
}

// ── Formulaire ────────────────────────────────────────────────

function buildRecForm(data: AppData, _accountId: AccountId): string {
  const isEdit = _editId !== null;
  const rec    = isEdit ? data.recs.find(r => r.id === _editId) : null;

  const kind     = rec ? rec.kind : _formKind;
  const desc     = rec ? escHtml(rec.desc) : '';
  const amt      = rec ? centsToInput(rec.amountCents) : '';
  const day      = rec ? rec.dayOfMonth : 1;
  const active   = rec ? rec.active : true;

  return `
    <div class="card" style="margin-top:8px;">
      <div class="card-title" style="margin-bottom:12px;">${isEdit ? 'Modifier' : 'Nouvelle'} récurrente</div>

      <!-- Toggle type -->
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="rec-btn-exp" onclick="recFormSetKind('expense')"
          style="flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;
                 border:2px solid ${kind === 'expense' ? '#c8102e' : 'var(--border)'};
                 background:${kind === 'expense' ? '#fff0f0' : 'var(--bg)'};
                 color:${kind === 'expense' ? '#c8102e' : 'var(--text2)'};">Dépense</button>
        <button id="rec-btn-inc" onclick="recFormSetKind('income')"
          style="flex:1;padding:10px;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;
                 border:2px solid ${kind === 'income' ? 'var(--green)' : 'var(--border)'};
                 background:${kind === 'income' ? '#f0fff4' : 'var(--bg)'};
                 color:${kind === 'income' ? 'var(--green)' : 'var(--text2)'};">Revenu</button>
      </div>

      <div class="modal-field">
        <label>Description</label>
        <input type="text" id="rec-inp-desc" placeholder="Ex: Loyer, Salaire…" value="${desc}">
      </div>

      <div class="modal-field">
        <label>Montant (€)</label>
        <input type="number" id="rec-inp-amt" min="0" step="0.01" inputmode="decimal" value="${amt}">
      </div>

      <div class="modal-field">
        <label>Catégorie</label>
        <select id="rec-inp-cat">${buildRecCatOptions(kind, rec?.cat ?? '')}</select>
      </div>

      <div class="modal-field">
        <label>Jour du mois</label>
        <input type="number" id="rec-inp-day" min="1" max="31" value="${day}">
      </div>

      ${buildRecCreditField(data, rec?.creditAccountId ?? '')}

      ${isEdit ? `
      <div class="modal-field">
        <label class="field-check" for="rec-inp-active">
          <input type="checkbox" id="rec-inp-active" ${active ? 'checked' : ''}>
          <div><div>Active</div><small>Décocher pour suspendre sans supprimer</small></div>
        </label>
      </div>` : ''}

      <div class="modal-btns" style="margin-top:12px;">
        <button class="modal-btn-cancel" onclick="closeRecForm()">Annuler</button>
        <button class="modal-btn-save"   onclick="saveRecForm()">Enregistrer</button>
      </div>
    </div>
  `;
}

function buildRecCreditField(data: AppData, currentCreditId: string): string {
  const savings = data.accounts.filter(a => a.type === 'savings');
  const credits = data.accounts.filter(a => a.type === 'credit');
  if (savings.length === 0 && credits.length === 0) return '';
  const savingsOpts = savings.length
    ? `<optgroup label="── Épargne (versement)">${savings.map(a => `<option value="${a.id}" ${a.id === currentCreditId ? 'selected' : ''}>${a.icon} ${a.name}</option>`).join('')}</optgroup>` : '';
  const creditOpts = credits.length
    ? `<optgroup label="── Crédit (remboursement)">${credits.map(a => `<option value="${a.id}" ${a.id === currentCreditId ? 'selected' : ''}>${a.icon} ${a.name}</option>`).join('')}</optgroup>` : '';
  return `
    <div class="modal-field">
      <label>Compte lié</label>
      <select id="rec-inp-credit">
        <option value="">— Aucun —</option>
        ${savingsOpts}${creditOpts}
      </select>
      <small style="color:var(--text2);font-size:11px;">À la validation, injecte une transaction dans ce compte</small>
    </div>
  `;
}

function buildRecCatOptions(kind: 'income' | 'expense', currentCat: string): string {
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

// ── Actions form ──────────────────────────────────────────────

export function openRecForm(id?: RecId) {
  _editId      = id ?? null;
  _formVisible = true;
  if (id) {
    const rec = getState().recs.find(r => r.id === id);
    _formKind = rec?.kind ?? 'expense';
  } else {
    _formKind = 'expense';
  }
  // Re-render la section
  renderRec(getState(), Nav.accountId);
  // Scroll vers le formulaire
  document.getElementById('rec-form-wrap')?.scrollIntoView({ behavior: 'smooth' });
}

export function closeRecForm() {
  _editId      = null;
  _formVisible = false;
  renderRec(getState(), Nav.accountId);
}

export function recFormSetKind(kind: 'income' | 'expense') {
  _formKind = kind;

  const btnExp = document.getElementById('rec-btn-exp') as HTMLButtonElement | null;
  const btnInc = document.getElementById('rec-btn-inc') as HTMLButtonElement | null;
  if (!btnExp || !btnInc) return;

  if (kind === 'expense') {
    btnExp.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;';
    btnInc.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);';
  } else {
    btnInc.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--green);background:#f0fff4;color:var(--green);';
    btnExp.style.cssText = 'flex:1;padding:10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);';
  }

  const sel = document.getElementById('rec-inp-cat') as HTMLSelectElement | null;
  if (sel) sel.innerHTML = buildRecCatOptions(kind, sel.value);
}

export async function saveRecForm() {
  const desc  = (document.getElementById('rec-inp-desc') as HTMLInputElement).value.trim();
  const amt   = inputToCents((document.getElementById('rec-inp-amt') as HTMLInputElement).value);
  const cat   = (document.getElementById('rec-inp-cat') as HTMLSelectElement).value;
  const day   = parseInt((document.getElementById('rec-inp-day') as HTMLInputElement).value, 10);

  if (!desc || amt <= 0 || !cat || !day || day < 1 || day > 31) {
    toast('⚠ Champs invalides'); return;
  }

  const state     = getState();
  const accountId = Nav.accountId;
  const creditSel = document.getElementById('rec-inp-credit') as HTMLSelectElement | null;
  const creditAccountId = (creditSel?.value || undefined) as import('../core/types').AccountId | undefined;

  if (_editId) {
    const activeEl = document.getElementById('rec-inp-active') as HTMLInputElement | null;
    const active   = activeEl ? activeEl.checked : true;
    await setState(updateRecurring(state, _editId, {
      kind: _formKind, desc, amountCents: amt, cat, dayOfMonth: day, active,
      ...(creditAccountId ? { creditAccountId } : {}),
    }));
    toast('✓ Récurrente modifiée');
  } else {
    await setState(addRecurring(state, {
      accountId, kind: _formKind, desc, amountCents: amt, cat, dayOfMonth: day, active: true,
      ...(creditAccountId ? { creditAccountId } : {}),
    }));
    toast('✓ Récurrente ajoutée');
  }

  _editId      = null;
  _formVisible = false;
  renderRec(getState(), accountId);
}

// ── Actions liste ─────────────────────────────────────────────

export async function toggleRec(id: RecId) {
  const state = getState();
  const rec   = state.recs.find(r => r.id === id);
  if (!rec) return;
  await setState(updateRecurring(state, id, { active: !rec.active }));
  renderRec(getState(), Nav.accountId);
}

export async function deleteRec(id: RecId) {
  await setState(deleteRecurring(getState(), id));
  toast('✓ Récurrente supprimée');
  renderRec(getState(), Nav.accountId);
}

/** Importer toutes les récurrentes en attente pour le mois SUIVANT */
export async function generateRec() {
  const state     = getState();
  const month     = targetMonth();
  const accountId = Nav.accountId;
  const next      = generatePlannedFromRecs(state, month, accountId);
  const added     = next.txs.length - state.txs.length;
  await setState(next);
  toast(added > 0 ? `✓ ${added} transaction${added > 1 ? 's' : ''} planifiée${added > 1 ? 's' : ''}` : 'Déjà à jour');
  renderRec(getState(), accountId);
}

/** Importer une seule récurrente pour le mois SUIVANT */
export async function applyOneRec(id: RecId) {
  const state     = getState();
  const month     = targetMonth();
  const accountId = Nav.accountId;
  const rec       = state.recs.find(r => r.id === id);
  if (!rec) return;

  // Vérifier si déjà importée
  const alreadyExists = state.txs.some(t => t.recId === id && t.date.startsWith(month));
  if (alreadyExists) { toast('Déjà importée pour ce mois'); return; }

  // Générer uniquement pour ce rec (même logique que generatePlannedFromRecs mais pour un seul)
  const [year, monthNum] = month.split('-').map(Number) as [number, number];
  const daysInM = new Date(year, monthNum, 0).getDate();
  const day     = Math.min(rec.dayOfMonth, daysInM);
  const date    = `${month}-${String(day).padStart(2, '0')}` as import('../core/types').IsoDate;

  const { addTransaction } = await import('../core/service');
  const next = addTransaction(state, {
    accountId,
    date,
    amountCents: rec.amountCents,
    kind:        rec.kind,
    cat:         rec.cat,
    desc:        rec.desc,
    planned:     true,
    recurring:   true,
    recId:       rec.id,
    ...(rec.creditAccountId ? { creditAccountId: rec.creditAccountId } : {}),
  });

  await setState(next);
  toast('✓ Importée pour ce mois');
  renderRec(getState(), accountId);
}

// ── Helpers ───────────────────────────────────────────────────

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Expositions globales ──────────────────────────────────────

(window as any).openRecForm     = openRecForm;
(window as any).closeRecForm    = closeRecForm;
(window as any).saveRecForm     = saveRecForm;
(window as any).recFormSetKind  = recFormSetKind;
(window as any).toggleRec       = toggleRec;
(window as any).deleteRec       = deleteRec;
(window as any).generateRec     = generateRec;
(window as any).applyOneRec     = applyOneRec;
