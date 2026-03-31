/* ═══════════════════════════════════════════════════════════════
   dashboard.ts — Liste des transactions du mois
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey, Transaction, TxId } from '../core/types';
import { confirmTransaction, revertToPlanned, deleteTransaction, removeTransfer } from '../core/service';
import { setState } from './app';
import { toast } from './toast';
import { fmt, fmtDateShort } from './format';

// ── Rendu principal ───────────────────────────────────────────

export function renderDashboard(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  const list = document.getElementById('tx-list');
  if (!list) return;

  const txs = data.txs
    .filter(t => t.accountId === accountId && t.date.startsWith(month))
    .filter(t => mode === 'previsionnel' ? true : !t.planned)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (txs.length === 0) {
    list.innerHTML = `<div class="tx-empty">Aucune transaction ce mois-ci</div>`;
    return;
  }

  // Regrouper par date
  const byDate = new Map<string, Transaction[]>();
  for (const t of txs) {
    const group = byDate.get(t.date) ?? [];
    group.push(t);
    byDate.set(t.date, group);
  }

  list.innerHTML = [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, group]) => renderGroup(date, group))
    .join('');
}

function renderGroup(date: string, txs: Transaction[]): string {
  return `
    <div class="tx-group">
      <div class="tx-date-header">${fmtDateShort(date)}</div>
      ${txs.map(renderTx).join('')}
    </div>
  `;
}

function renderTx(t: Transaction): string {
  const isTransfer = t.kind === 'transfer_out' || t.kind === 'transfer_in';
  const isIncome   = t.kind === 'income';
  const isExpense  = t.kind === 'expense';
  const isPlanned  = t.planned;

  const amountStr  = fmt(t.amountCents);
  const sign       = isIncome || t.kind === 'transfer_in' ? '+' : '-';
  const colorClass = isIncome ? 'pos' : isExpense ? 'neg' : 'transfer';

  return `
    <div class="tx-item${isPlanned ? ' planned' : ''}${isTransfer ? ' transfer' : ''}"
         onclick="openTxDetail('${t.id}')">
      <div class="tx-cat-icon">${getCatIcon(t.cat)}</div>
      <div class="tx-body">
        <div class="tx-desc">${escHtml(t.desc)}</div>
        <div class="tx-meta">
          ${isPlanned ? '<span class="badge-planned">Prévu</span>' : ''}
          ${t.recurring ? '<span class="badge-rec">↺</span>' : ''}
          ${isTransfer ? '<span class="badge-transfer">Virement</span>' : ''}
        </div>
      </div>
      <div class="tx-amount ${colorClass}">${sign}${amountStr}</div>
    </div>
  `;
}

// ── Détail transaction (modal inline) ────────────────────────

export function openTxDetail(id: TxId) {
  // import dynamique pour éviter un import circulaire
  import('./txModal').then(m => m.openTxModal(id));
}

// ── Actions ───────────────────────────────────────────────────

export async function confirmTx(id: TxId) {
  if (!confirm('Valider cette transaction comme réelle ?')) return;
  const { getState } = await import('./app');
  await setState(confirmTransaction(getState(), id));
  toast('✓ Transaction validée');
}

export async function revertTx(id: TxId) {
  if (!confirm('Remettre cette transaction en "Prévu" ?')) return;
  const { getState } = await import('./app');
  await setState(revertToPlanned(getState(), id));
  toast('↩ Transaction remise en prévu');
}

export async function deleteTx(id: TxId) {
  if (!confirm('Supprimer cette transaction ?')) return;
  const { getState } = await import('./app');
  const state = getState();
  const tx = state.txs.find(t => t.id === id);
  if (!tx) return;

  let next = state;
  if (tx.transferId) {
    if (!confirm('Ce virement a deux jambes. Supprimer les deux ?')) return;
    next = removeTransfer(next, tx.transferId);
  } else {
    next = deleteTransaction(next, id);
  }
  await setState(next);
  toast('✓ Transaction supprimée');
}

// Exposer globalement
(window as any).openTxDetail = openTxDetail;
(window as any).confirmTx    = confirmTx;
(window as any).revertTx     = revertTx;
(window as any).deleteTx     = deleteTx;

// ── Helpers ───────────────────────────────────────────────────

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getCatIcon(cat: string): string {
  const icons: Record<string, string> = {
    salaire: '💼', loyer: '🏠', courses: '🛒', restaurant: '🍽️',
    transport: '🚗', sante: '💊', loisirs: '🎭', abonnement: '📱',
    transfer: '↔️', autre: '•',
  };
  return icons[cat] ?? '•';
}
