/* ═══════════════════════════════════════════════════════════════
   pdf-export.ts — Export relevé mensuel en PDF (via print navigateur)
   ═══════════════════════════════════════════════════════════════ */

import type { AppData, AccountId, MonthKey } from '../core/types';
import { getCatDef } from '../core/categories';

function fmtCents(c: number): string {
  return (Math.abs(c) / 100).toFixed(2).replace('.', ',') + ' €';
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const lbl = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return lbl.charAt(0).toUpperCase() + lbl.slice(1);
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-') as [string, string, string];
  return `${d}/${m}/${y}`;
}

export function exportPDF(data: AppData, accountId: AccountId, month: MonthKey): void {
  const account = data.accounts.find(a => a.id === accountId);
  const txs = data.txs
    .filter(t => t.accountId === accountId && t.date.startsWith(month) && !t.planned)
    .sort((a, b) => a.date.localeCompare(b.date));

  const inc = txs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
  const exp = txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
  const bilan = inc - exp;

  const rows = txs.map(t => {
    const isInc = t.kind === 'income' || t.kind === 'transfer_in';
    const cat   = getCatDef(t.cat, data.customCats);
    const sign  = isInc ? '+' : '-';
    const color = isInc ? '#059669' : '#dc2626';
    return `<tr>
      <td>${fmtDate(t.date)}</td>
      <td>${cat.icon} ${t.desc || cat.label}</td>
      <td>${cat.label}</td>
      <td style="text-align:right;font-weight:600;color:${color};">${sign}${fmtCents(t.amountCents)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Relevé ${month} — ${account?.name ?? accountId}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; background: #fff; }
  .header { border-bottom: 3px solid #00857a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
  .brand { font-size: 22px; font-weight: 800; color: #00857a; }
  .brand span { color: #1a1a1a; }
  .meta { text-align: right; font-size: 11px; color: #666; }
  .meta strong { font-size: 14px; color: #1a1a1a; display: block; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .sum-card { background: #f5f7fa; border-radius: 8px; padding: 10px 12px; }
  .sum-val { font-size: 16px; font-weight: 700; }
  .sum-lbl { font-size: 10px; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.4px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #00857a; color: white; }
  thead th { padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  thead th:last-child { text-align: right; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
  .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
  @media print {
    body { padding: 10px; }
    @page { margin: 1cm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Mon<span>Compte</span></div>
    <div class="meta">
      <strong>${monthLabel(month)}</strong>
      ${account ? `${account.icon} ${account.name}` : accountId}<br>
      Généré le ${new Date().toLocaleDateString('fr-FR')}
    </div>
  </div>

  <div class="summary">
    <div class="sum-card">
      <div class="sum-val" style="color:#059669;">+${fmtCents(inc)}</div>
      <div class="sum-lbl">Revenus</div>
    </div>
    <div class="sum-card">
      <div class="sum-val" style="color:#dc2626;">-${fmtCents(exp)}</div>
      <div class="sum-lbl">Dépenses</div>
    </div>
    <div class="sum-card">
      <div class="sum-val" style="color:${bilan >= 0 ? '#059669' : '#dc2626'};">${bilan >= 0 ? '+' : '-'}${fmtCents(bilan)}</div>
      <div class="sum-lbl">Bilan</div>
    </div>
    <div class="sum-card">
      <div class="sum-val">${txs.length}</div>
      <div class="sum-lbl">Opérations</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Catégorie</th>
        <th style="text-align:right;">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px;">Aucune transaction ce mois</td></tr>'}
    </tbody>
  </table>

  <div class="footer">MonCarnetCompte — Relevé personnel non officiel</div>
</body>
</html>`;

  const pw = 900, ph = 700;
  const pl = Math.round((screen.width  - pw) / 2);
  const pt = Math.round((screen.height - ph) / 2);
  const win = window.open('', '_blank', `width=${pw},height=${ph},left=${Math.max(0,pl)},top=${Math.max(0,pt)}`);
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  } else {
    // Fallback : téléchargement HTML
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `releve-${month}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
