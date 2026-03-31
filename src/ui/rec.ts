/* ═══════════════════════════════════════════════════════════════
   rec.ts — Gestion des récurrentes
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, RecId } from '../core/types';
import { addRecurring, updateRecurring, deleteRecurring, generatePlannedFromRecs } from '../core/service';
import { setState, getState } from './app';
import { toast } from './toast';
import { fmt } from './format';
import { Nav } from './router';

export function renderRec(data: AppData, accountId: AccountId) {
  const el = document.getElementById('sec-rec');
  if (!el) return;

  const recs = data.recs.filter(r => r.accountId === accountId);

  el.innerHTML = `
    <div class="rec-list">
      ${recs.length === 0
        ? '<p class="tx-empty">Aucune récurrente</p>'
        : recs.map(renderRecItem).join('')
      }
    </div>
    <button class="fab" onclick="openRecForm()">+</button>
  `;
}

function renderRecItem(r: import('../core/types').RecurringTemplate): string {
  const sign = r.kind === 'income' ? '+' : '-';
  const cls  = r.kind === 'income' ? 'pos' : 'neg';
  return `
    <div class="rec-item${r.active ? '' : ' inactive'}">
      <div class="rec-body">
        <div class="rec-desc">${escHtml(r.desc)}</div>
        <div class="rec-meta">Le ${r.dayOfMonth} du mois · ${r.cat}</div>
      </div>
      <div class="rec-amount ${cls}">${sign}${fmt(r.amountCents)}</div>
      <div class="rec-actions">
        <button onclick="toggleRec('${r.id}')">${r.active ? '⏸' : '▶'}</button>
        <button onclick="deleteRec('${r.id}')">🗑</button>
      </div>
    </div>
  `;
}

export async function toggleRec(id: RecId) {
  const state = getState();
  const rec = state.recs.find(r => r.id === id);
  if (!rec) return;
  await setState(updateRecurring(state, id, { active: !rec.active }));
}

export async function deleteRec(id: RecId) {
  if (!confirm('Supprimer cette récurrente ?')) return;
  await setState(deleteRecurring(getState(), id));
  toast('✓ Récurrente supprimée');
}

export async function generateRec() {
  const state = getState();
  const month = Nav.month;
  const accountId = Nav.accountId;
  const next = generatePlannedFromRecs(state, month, accountId);
  const added = next.txs.length - state.txs.length;
  await setState(next);
  toast(added > 0 ? `✓ ${added} transaction(s) planifiée(s)` : 'Déjà à jour');
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

(window as any).toggleRec   = toggleRec;
(window as any).deleteRec   = deleteRec;
(window as any).generateRec = generateRec;
(window as any).openRecForm = () => { /* TODO modal */ };
