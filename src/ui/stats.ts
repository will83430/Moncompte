/* ═══════════════════════════════════════════════════════════════
   stats.ts — Statistiques : donut 3D + barres 3/6/12 mois
   Logique portée depuis v1 app.js, adaptée aux types v2
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { getCatDef } from '../core/categories';
import { getBankBalance } from '../core/service';
import { fmt } from './format';

let _barPeriod = 6;
let _balPeriod = 12;

// ── Rendu principal ───────────────────────────────────────────

export function renderStats(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  const txs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(month) &&
    (mode === 'reel' ? !t.planned : true)
  );

  const inc = txs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
  const exp = txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
  const [y, m] = month.split('-').map(Number) as [number, number];
  const days = new Date(y, m, 0).getDate();

  // Mois précédent
  const prevMonthKey = prevMK(month);
  const prevTxs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(prevMonthKey) &&
    !t.planned
  );
  const prevInc = prevTxs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
  const prevExp = prevTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
  const prevDays = new Date(...(prevMonthKey.split('-').map((v, i) => i === 1 ? parseInt(v) : parseInt(v)) as [number, number]));

  const account = data.accounts.find(a => a.id === accountId);
  const el = document.getElementById('sec-stats');
  if (!el) return;

  // Catégories par dépense + virements (transfer_out groupés sous '↔️')
  const byCat: Record<string, number> = {};
  txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').forEach(t => {
    const key = t.kind === 'transfer_out' ? '__virement__' : t.cat;
    byCat[key] = (byCat[key] ?? 0) + t.amountCents;
  });
  const sorted  = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalExp = sorted.reduce((s, [, v]) => s + v, 0);

  // Bloc spécial crédit
  const creditBlock = account?.type === 'credit' ? (() => {
    const allTxs         = data.txs.filter(t => t.accountId === accountId && !t.planned);
    const totalEmprunte  = allTxs.filter(t => t.kind === 'income'  || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    const totalRembourse = allTxs.filter(t => t.kind === 'expense' || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const restant        = Math.max(0, totalEmprunte - totalRembourse);
    const pct            = totalEmprunte > 0 ? Math.round(totalRembourse / totalEmprunte * 100) : 0;
    const mensualite     = account.mensualite ?? 0;
    const moisRestants   = mensualite > 0 && restant > 0 ? Math.ceil(restant / mensualite) : null;
    return `
      <div class="card">
        <div class="card-title">Suivi crédit</div>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-val" style="color:var(--green)">${fmt(totalRembourse)}</div><div class="kpi-lbl">Remboursé</div></div>
          <div class="kpi"><div class="kpi-val" style="color:#ef4444">${fmt(restant)}</div><div class="kpi-lbl">Restant à payer</div></div>
        </div>
        <div class="kpi-grid" style="margin-top:0">
          <div class="kpi"><div class="kpi-val" style="color:var(--blue)">${fmt(totalEmprunte)}</div><div class="kpi-lbl">Montant emprunté</div></div>
          ${mensualite ? `<div class="kpi"><div class="kpi-val" style="color:var(--orange)">${fmt(mensualite)}</div><div class="kpi-lbl">Mensualité</div></div>` : ''}
        </div>
        <div style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:4px;">
            <span>Progression remboursement</span><span>${pct}%</span>
          </div>
          <div class="track"><div class="fill" style="width:${pct}%;background:var(--green)"></div></div>
          ${moisRestants ? `<div style="font-size:11px;color:var(--text3);margin-top:6px;">≈ ${moisRestants} mois restants à ${fmt(mensualite)}/mois</div>` : ''}
        </div>
      </div>`;
  })() : '';

  el.innerHTML = `
    <div class="month-nav">
      <button onclick="changeMonth(-1)">&#9664;</button>
      <span class="month-label" id="mn-lbl-stats">${monthLabel(month)}</span>
      <button onclick="changeMonth(1)">&#9654;</button>
    </div>
    ${creditBlock}

    <div class="two-col">
      <div class="mini-s"><div class="v" style="color:var(--green)">${fmtShort(inc)}</div><div class="l">Revenus</div><div class="vs-lm" id="vs-inc">${vsDelta(inc, prevInc, false)}</div></div>
      <div class="mini-s"><div class="v" style="color:var(--teal)">${fmtShort(exp)}</div><div class="l">Dépenses</div><div class="vs-lm" id="vs-exp">${vsDelta(exp, prevExp, true)}</div></div>
      <div class="mini-s"><div class="v" style="color:var(--blue)">${txs.length}</div><div class="l">Opérations</div></div>
      <div class="mini-s"><div class="v" style="color:var(--orange)">${fmtShort(exp / days)}</div><div class="l">Moy/jour</div></div>
    </div>

    ${account?.type === 'savings' ? '' : `
    <div class="card">
      <div class="card-title">Répartition des dépenses</div>
      <div class="donut-wrap">
        <svg id="donut-svg" width="200" height="155" viewBox="0 0 200 155">
          ${buildDonut(sorted, totalExp, data.customCats)}
        </svg>
      </div>
      <div class="donut-3d-total"><span>${fmtShort(totalExp)}</span> <span class="dc-lbl">de dépenses</span></div>
      <div class="legend-list">
        ${sorted.map(([catId, amt]) => {
          const cat = catId === '__virement__'
            ? { icon: '↔️', label: 'Virements', color: '#6366f1' }
            : getCatDef(catId, data.customCats);
          const pct = Math.round(amt / (totalExp || 1) * 100);
          return `<div class="legend-item">
            <div class="legend-dot" style="background:${cat.color}"></div>
            <div class="legend-name">${cat.icon} ${cat.label}</div>
            <div class="legend-pct">${pct}%</div>
            <div class="legend-amt">${fmtShort(amt)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`}

    <div class="card">
      <div class="chart-title-row">
        <div class="card-title" style="margin:0">Évolution revenus / dépenses</div>
        <div class="prd-btns">
          <button class="prd-btn bar-prd-btn${_barPeriod===3?' prd-on':''}" onclick="setBarPeriod(3)">3M</button>
          <button class="prd-btn bar-prd-btn${_barPeriod===6?' prd-on':''}" onclick="setBarPeriod(6)">6M</button>
          <button class="prd-btn bar-prd-btn${_barPeriod===12?' prd-on':''}" onclick="setBarPeriod(12)">12M</button>
        </div>
      </div>
      <div class="bar-chart" id="bar-chart">${buildBarChart(data, accountId, month, _barPeriod, mode)}</div>
      <div class="bar-legend">
        <div class="bl-item"><div class="bl-dot" style="background:#10b981"></div>Revenus</div>
        <div class="bl-item"><div class="bl-dot" style="background:#fca5a5"></div>Dépenses</div>
        <div class="bl-item"><div class="bl-dot" style="background:#1e293b;border-radius:50%"></div>Bilan</div>
      </div>
    </div>

    <div class="card">
      <div class="chart-title-row">
        <div class="card-title" style="margin:0">Évolution du solde</div>
        <div class="prd-btns">
          <button class="prd-btn${_balPeriod===3?' prd-on':''}" onclick="setBalPeriod(3)">3M</button>
          <button class="prd-btn${_balPeriod===6?' prd-on':''}" onclick="setBalPeriod(6)">6M</button>
          <button class="prd-btn${_balPeriod===12?' prd-on':''}" onclick="setBalPeriod(12)">12M</button>
        </div>
      </div>
      <div id="balance-chart">${buildBalanceChart(data, accountId, month, _balPeriod)}</div>
    </div>

  `;
}

// ── Donut 3D ──────────────────────────────────────────────────

function buildDonut(
  sorted:     [string, number][],
  totalExp:   number,
  customCats: AppData['customCats']
): string {
  if (!sorted.length || totalExp === 0) {
    return '<ellipse cx="100" cy="52" rx="65" ry="29" fill="none" stroke="#e4e6ea" stroke-width="24"/>';
  }

  const CX=100, CY=64, R=62, ri=36, RY=0.44, D=22;
  const P  = (a: number, rad: number, dy=0): [number,number] =>
    [+(CX+rad*Math.cos(a)).toFixed(2), +(CY+rad*RY*Math.sin(a)+dy).toFixed(2)];
  const f2 = (v: number) => +v.toFixed(2);

  let start = -Math.PI / 2;
  const segs = sorted.map(([catId, amt]) => {
    const cat  = catId === '__virement__'
      ? { icon: '↔️', label: 'Virements', color: '#6366f1', id: '__virement__', group: 'Virements' }
      : getCatDef(catId, customCats);
    const span = amt / totalExp * 2 * Math.PI;
    const seg  = { catId, cat, a0: start, a1: start + span, span };
    start += span;
    return seg;
  });

  let out = '';
  out += `<ellipse cx="${CX}" cy="${f2(CY+R*RY+D+8)}" rx="${f2(R*0.86)}" ry="${f2(R*RY*0.44)}" fill="rgba(0,0,0,0.18)" pointer-events="none"/>`;

  // Parois extérieures
  for (const { cat, a0, a1 } of segs) {
    const vA0=Math.max(a0,0), vA1=Math.min(a1,Math.PI);
    if (vA1<=vA0) continue;
    const [x0,y0]=P(vA0,R,0), [x1,y1]=P(vA1,R,0);
    const [x0b,y0b]=P(vA0,R,D), [x1b,y1b]=P(vA1,R,D);
    const rY=f2(R*RY), lg=(vA1-vA0)>Math.PI?1:0;
    out += `<path d="M${x0},${y0} A${R},${rY} 0 ${lg},1 ${x1},${y1} L${x1b},${y1b} A${R},${rY} 0 ${lg},0 ${x0b},${y0b} Z" fill="${hexDarken(cat.color,0.50)}"/>`;
  }
  // Parois intérieures
  for (const { cat, a0, a1 } of segs) {
    const vA0=Math.max(a0,0), vA1=Math.min(a1,Math.PI);
    if (vA1<=vA0) continue;
    const [x0,y0]=P(vA0,ri,0), [x1,y1]=P(vA1,ri,0);
    const [x0b,y0b]=P(vA0,ri,D), [x1b,y1b]=P(vA1,ri,D);
    const riY=f2(ri*RY), lg=(vA1-vA0)>Math.PI?1:0;
    out += `<path d="M${x0},${y0} A${ri},${riY} 0 ${lg},1 ${x1},${y1} L${x1b},${y1b} A${ri},${riY} 0 ${lg},0 ${x0b},${y0b} Z" fill="${hexDarken(cat.color,0.35)}"/>`;
  }
  // Faces supérieures
  for (const { cat, a0, a1, span } of segs) {
    const [ox0,oy0]=P(a0,R), [ox1,oy1]=P(a1,R);
    const [ix0,iy0]=P(a0,ri), [ix1,iy1]=P(a1,ri);
    const rY=f2(R*RY), riY=f2(ri*RY), lg=span>Math.PI?1:0;
    out += `<path d="M${ox0},${oy0} A${R},${rY} 0 ${lg},1 ${ox1},${oy1} L${ix1},${iy1} A${ri},${riY} 0 ${lg},0 ${ix0},${iy0} Z" fill="${cat.color}" stroke="rgba(255,255,255,0.22)" stroke-width="0.8"/>`;
  }
  // Reflet
  const hR=(R+ri)/2;
  out += `<ellipse cx="${CX}" cy="${CY}" rx="${f2(hR)}" ry="${f2(hR*RY)}" fill="none" stroke="rgba(255,255,255,0.11)" stroke-width="${R-ri-3}" pointer-events="none"/>`;

  return out;
}

// ── Graphique revenus/dépenses : barres symétriques + ligne bilan ─

function buildBarChart(
  data:      AppData,
  accountId: AccountId,
  month:     MonthKey,
  n:         number,
  mode:      'reel' | 'previsionnel'
): string {
  const months = pastMonths(month, n);
  const pts = months.map(mk => {
    const txs = data.txs.filter(t =>
      t.accountId === accountId && t.date.startsWith(mk) && (mode === 'reel' ? !t.planned : true)
    );
    const inc = txs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const exp = txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    return {
      label: mk.split('-')[1]!.replace(/^0/, '') + '/' + mk.split('-')[0]!.slice(2),
      inc, exp, bilan: inc - exp,
    };
  });

  const maxV = Math.max(...pts.flatMap(d => [d.inc, d.exp]), 1);
  const W=320, H=200, ml=44, mr=16, mt=16, mb=24;
  const ch = (H - mt - mb) / 2; // demi-hauteur pour chaque côté
  const zy = mt + ch;           // ligne zéro
  const f2 = (v: number) => +v.toFixed(2);
  const bw = n <= 3 ? 36 : n <= 6 ? 22 : 13;
  const gap = n <= 3 ? 20 : n <= 6 ? 10 : 5;
  const totalW = n * bw + (n - 1) * gap;
  const startX = ml + (W - ml - mr - totalW) / 2;
  const cx = (i: number) => startX + i * (bw + gap) + bw / 2;
  const barTop = (v: number) => f2(zy - v / maxV * ch);
  const barBot = (v: number) => f2(zy + v / maxV * ch);

  // Grille
  let s = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;
  [1, 0.5, 0, -0.5, -1].forEach(f => {
    const gy = f2(zy - f * ch);
    const isZ = f === 0;
    s += `<line x1="${ml}" y1="${gy}" x2="${W - mr}" y2="${gy}" stroke="${isZ ? '#9ca3af' : '#e4e6ea'}" stroke-width="${isZ ? 1.5 : 1}" pointer-events="none"/>`;
    if (f !== 0) s += `<text x="${ml - 4}" y="${f2(gy + 3.5)}" text-anchor="end" font-size="8" fill="#9ca3af">${chartLbl(f * maxV / 100)}</text>`;
    else s += `<text x="${ml - 4}" y="${f2(gy + 3.5)}" text-anchor="end" font-size="8" fill="#9ca3af">0</text>`;
  });

  // Barres revenus (au-dessus) et dépenses (en-dessous)
  pts.forEach((d, i) => {
    const x = f2(startX + i * (bw + gap));
    if (d.inc) {
      const yT = barTop(d.inc);
      s += `<rect x="${x}" y="${yT}" width="${bw}" height="${f2(zy - yT)}" fill="#10b981" rx="2"/>`;
    }
    if (d.exp) {
      const yB = barBot(d.exp);
      s += `<rect x="${x}" y="${f2(zy)}" width="${bw}" height="${f2(yB - zy)}" fill="#fca5a5" rx="2"/>`;
    }
  });

  // Ligne bilan
  const linePoints = pts.map((d, i) => `${f2(cx(i))},${f2(zy - d.bilan / maxV * ch)}`).join(' ');
  s += `<polyline points="${linePoints}" fill="none" stroke="#1e293b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  // Points sur la ligne
  pts.forEach((d, i) => {
    const cy2 = f2(zy - d.bilan / maxV * ch);
    s += `<circle cx="${f2(cx(i))}" cy="${cy2}" r="3" fill="#1e293b"/>`;
  });

  // Labels mois — 1 sur 2 en 6M, 1 sur 3 en 12M
  const step = n <= 3 ? 1 : n <= 6 ? 1 : n <= 9 ? 2 : 3;
  pts.forEach((d, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    s += `<text x="${f2(cx(i))}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#9ca3af">${d.label}</text>`;
  });

  s += '</svg>';
  return s;
}

// ── Graphique solde : ligne + aire remplie ────────────────────

function buildBalanceChart(
  data:      AppData,
  accountId: AccountId,
  month:     MonthKey,
  n:         number
): string {
  const account = data.accounts.find(a => a.id === accountId);
  const isChecking = !account || account.type === 'checking';
  const months = pastMonths(month, n);

  const allNonPlanned = data.txs.filter(t => t.accountId === accountId && !t.planned);

  const vals = months.map(mk => {
    const label = mk.split('-')[1]!.replace(/^0/, '') + '/' + mk.split('-')[0]!.slice(2);

    if (!isChecking) {
      // Savings/credit : cumulatif jusqu'au mois mk
      const upTo = allNonPlanned.filter(t => t.date.slice(0, 7) <= mk);
      const uInc = upTo.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
      const uExp = upTo.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
      const balance = account?.type === 'credit' ? Math.max(0, uInc - uExp) : uInc - uExp;
      return { label, balance, hasData: upTo.length > 0 };
    }

    // Checking : bilan mensuel (revenus - dépenses du mois)
    // Plus fiable que le solde cumulatif calculé depuis une seule ancre
    const txs = allNonPlanned.filter(t => t.date.startsWith(mk));
    const inc = txs.filter(t => t.kind === 'income'  || t.kind === 'transfer_in').reduce((s, t) => s + t.amountCents, 0);
    const exp = txs.filter(t => t.kind === 'expense' || t.kind === 'transfer_out').reduce((s, t) => s + t.amountCents, 0);
    return { label, balance: inc - exp, hasData: txs.length > 0 };
  });

  const withData = vals.filter(v => v.hasData);
  if (!withData.length) return '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0">Pas de données</div>';

  const balances = withData.map(v => v.balance);
  const minVal = Math.min(...balances, 0);
  const maxVal = Math.max(...balances, 0);
  const range = maxVal - minVal || 1;

  const W=320, H=180, ml=44, mr=16, mt=16, mb=24;
  const ch = H - mt - mb;
  const f2 = (v: number) => +v.toFixed(2);
  const bw = n <= 3 ? 36 : n <= 6 ? 22 : 13;
  const gap = n <= 3 ? 20 : n <= 6 ? 10 : 5;
  const totalW = n * bw + (n - 1) * gap;
  const startX = ml + (W - ml - mr - totalW) / 2;
  const cx = (i: number) => startX + i * (bw + gap) + bw / 2;
  const by = (v: number) => f2(mt + ch - ((v - minVal) / range) * ch);
  const zy = by(0);

  // Grille
  let s = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;
  const refs = minVal < 0 && maxVal > 0
    ? [minVal, 0, maxVal]
    : [minVal, minVal + range / 2, maxVal];
  refs.forEach(v => {
    const gy = f2(by(v));
    const isZ = v === 0;
    s += `<line x1="${ml}" y1="${gy}" x2="${W - mr}" y2="${gy}" stroke="${isZ ? '#9ca3af' : '#e4e6ea'}" stroke-width="${isZ ? 1.5 : 1}" ${isZ ? 'stroke-dasharray="4,3"' : ''} pointer-events="none"/>`;
    s += `<text x="${ml - 4}" y="${f2(gy + 3.5)}" text-anchor="end" font-size="8" fill="#9ca3af">${chartLbl(v / 100)}</text>`;
  });

  // Aires colorées (fill sous/sur la ligne zéro)
  const validIdx = vals.map((v, i) => v.hasData ? i : -1).filter(i => i >= 0);
  if (validIdx.length > 1) {
    // Aire positive (au-dessus de 0)
    let pathPos = `M${f2(cx(validIdx[0]!))},${zy}`;
    validIdx.forEach(i => { pathPos += ` L${f2(cx(i))},${by(Math.max(0, vals[i]!.balance))}`; });
    pathPos += ` L${f2(cx(validIdx[validIdx.length - 1]!))},${zy} Z`;
    s += `<path d="${pathPos}" fill="#10b981" opacity="0.15"/>`;

    // Aire négative (en-dessous de 0)
    if (minVal < 0) {
      let pathNeg = `M${f2(cx(validIdx[0]!))},${zy}`;
      validIdx.forEach(i => { pathNeg += ` L${f2(cx(i))},${by(Math.min(0, vals[i]!.balance))}`; });
      pathNeg += ` L${f2(cx(validIdx[validIdx.length - 1]!))},${zy} Z`;
      s += `<path d="${pathNeg}" fill="#ef4444" opacity="0.15"/>`;
    }

    // Ligne principale
    const linePoints = validIdx.map(i => `${f2(cx(i))},${by(vals[i]!.balance)}`).join(' ');
    s += `<polyline points="${linePoints}" fill="none" stroke="#00857a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

    // Points
    validIdx.forEach(i => {
      const pos = vals[i]!.balance >= 0;
      s += `<circle cx="${f2(cx(i))}" cy="${by(vals[i]!.balance)}" r="3.5" fill="${pos ? '#10b981' : '#ef4444'}" stroke="#fff" stroke-width="1.5"/>`;
    });
  }

  // Labels mois — 1 sur 2 en 6M, 1 sur 3 en 12M
  const stepB = n <= 3 ? 1 : n <= 6 ? 1 : n <= 9 ? 2 : 3;
  vals.forEach((d, i) => {
    if (i % stepB !== 0 && i !== n - 1) return;
    s += `<text x="${f2(cx(i))}" y="${H - 4}" text-anchor="middle" font-size="9" fill="${d.hasData ? '#9ca3af' : '#d1d5db'}">${d.label}</text>`;
  });

  s += '</svg>';
  return s;
}

// ── Barres catégories ─────────────────────────────────────────

function buildCatBars(
  sorted:     [string, number][],
  totalExp:   number,
  customCats: AppData['customCats']
): string {
  if (!sorted.length) return '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0">Aucune dépense ce mois</div>';
  const max = sorted[0]![1];
  return sorted.map(([catId, amt]) => {
    const cat = getCatDef(catId, customCats);
    const pct = Math.round(amt / max * 100);
    return `<div class="cat-row">
      <div class="cat-top"><div class="cat-name">${cat.icon} ${cat.label}</div><div class="cat-amt">${fmt(amt)}</div></div>
      <div class="track"><div class="fill" style="width:${pct}%;background:${cat.color}"></div></div>
    </div>`;
  }).join('');
}

// ── Handlers globaux ──────────────────────────────────────────

export function setBarPeriod(n: number) {
  _barPeriod = n;
  document.querySelectorAll('.bar-prd-btn').forEach(b =>
    (b as HTMLElement).classList.toggle('prd-on', (b as HTMLElement).dataset['p'] === String(n))
  );
  const el = document.getElementById('bar-chart');
  // Re-render nécessite les données courantes → on force un refresh via Router
  import('./router').then(({ Router }) => Router.refresh());
}

export function setBalPeriod(n: number) {
  _balPeriod = n;
  document.querySelectorAll('.prd-btn').forEach(b =>
    (b as HTMLElement).classList.toggle('prd-on', (b as HTMLElement).dataset['p'] === String(n))
  );
  import('./router').then(({ Router }) => Router.refresh());
}

(window as any).setBarPeriod = setBarPeriod;
(window as any).setBalPeriod = setBalPeriod;

// ── Helpers ───────────────────────────────────────────────────

function monthLabel(mk: MonthKey): string {
  const [y, m] = mk.split('-').map(Number) as [number, number];
  const lbl = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return lbl.charAt(0).toUpperCase() + lbl.slice(1);
}

function hexDarken(hex: string, factor: number): string {
  const h=hex.replace('#','');
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;
}

function fmtShort(cents: number): string {
  const v = cents / 100;
  return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + '\u00a0€';
}

function chartLbl(v: number): string {
  const n = Math.round(v);
  const sign = n >= 0 ? '+' : '';
  return sign + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}

function vsDelta(cur: number, prev: number, invertColor: boolean): string {
  if (!prev) return '';
  const delta = cur - prev;
  const pct   = Math.round(Math.abs(delta) / prev * 100);
  const up    = delta >= 0;
  const good  = invertColor ? !up : up;
  const color = good ? 'var(--green)' : '#c8102e';
  return `<span style="color:${color};font-size:10px;">${up?'▲':'▼'}${pct}%</span>`;
}

function pastMonths(current: MonthKey, n: number): MonthKey[] {
  const [y, m] = current.split('-').map(Number) as [number, number];
  const result: MonthKey[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` as MonthKey);
  }
  return result;
}

function prevMK(mk: MonthKey): MonthKey {
  const [y, m] = mk.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` as MonthKey;
}
