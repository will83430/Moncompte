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

  const inc = txs.filter(t => t.kind === 'income').reduce((s, t) => s + t.amountCents, 0);
  const exp = txs.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amountCents, 0);
  const [y, m] = month.split('-').map(Number) as [number, number];
  const days = new Date(y, m, 0).getDate();

  // Mois précédent
  const prevMonthKey = prevMK(month);
  const prevTxs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(prevMonthKey) &&
    !t.planned
  );
  const prevInc = prevTxs.filter(t => t.kind === 'income').reduce((s, t) => s + t.amountCents, 0);
  const prevExp = prevTxs.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amountCents, 0);
  const prevDays = new Date(...(prevMonthKey.split('-').map((v, i) => i === 1 ? parseInt(v) : parseInt(v)) as [number, number]));

  const el = document.getElementById('sec-stats');
  if (!el) return;

  // Catégories par dépense
  const byCat: Record<string, number> = {};
  txs.filter(t => t.kind === 'expense').forEach(t => {
    byCat[t.cat] = (byCat[t.cat] ?? 0) + t.amountCents;
  });
  const sorted  = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalExp = sorted.reduce((s, [, v]) => s + v, 0);

  el.innerHTML = `
    <div class="month-nav">
      <button onclick="changeMonth(-1)">&#9664;</button>
      <span class="month-label" id="mn-lbl-stats">-</span>
      <button onclick="changeMonth(1)">&#9654;</button>
    </div>

    <div class="two-col">
      <div class="mini-s"><div class="v" style="color:var(--green)">${fmtShort(inc)}</div><div class="l">Revenus</div><div class="vs-lm" id="vs-inc">${vsDelta(inc, prevInc, false)}</div></div>
      <div class="mini-s"><div class="v" style="color:var(--teal)">${fmtShort(exp)}</div><div class="l">Dépenses</div><div class="vs-lm" id="vs-exp">${vsDelta(exp, prevExp, true)}</div></div>
      <div class="mini-s"><div class="v" style="color:var(--blue)">${txs.length}</div><div class="l">Opérations</div></div>
      <div class="mini-s"><div class="v" style="color:var(--orange)">${fmtShort(exp / days)}</div><div class="l">Moy/jour</div></div>
    </div>

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
          const cat = getCatDef(catId, data.customCats);
          const pct = Math.round(amt / (totalExp || 1) * 100);
          return `<div class="legend-item">
            <div class="legend-dot" style="background:${cat.color}"></div>
            <div class="legend-name">${cat.icon} ${cat.label}</div>
            <div class="legend-pct">${pct}%</div>
            <div class="legend-amt">${fmtShort(amt)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

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
        <div class="bl-item"><div class="bl-dot" style="background:#00857a"></div>Dépenses</div>
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

    <div class="card">
      <div class="card-title">Détail par catégorie</div>
      <div id="cat-bars">
        ${buildCatBars(sorted, totalExp, data.customCats)}
      </div>
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
    const cat  = getCatDef(catId, customCats);
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

// ── Graphique barres 3D revenus/dépenses ──────────────────────

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
    return {
      label: mk.split('-')[1]!.replace(/^0/, '') + '/' + mk.split('-')[0]!.slice(2),
      inc:   txs.filter(t => t.kind === 'income').reduce((s, t) => s + t.amountCents, 0),
      exp:   txs.filter(t => t.kind === 'expense').reduce((s, t) => s + t.amountCents, 0),
    };
  });

  const maxV = Math.max(...pts.flatMap(d => [d.inc, d.exp]), 1);
  const W=320, H=130, ml=8, mr=20, mt=10, mb=24, D=8, dY=5;
  const ch=H-mt-mb-dY;
  const f2=(v: number)=>+v.toFixed(2);
  const bw=n<=3?28:n<=6?15:9;
  const bGap=2, gGap=n<=3?24:n<=6?12:6;
  const gW=2*bw+bGap;
  const totalG=n*gW+(n-1)*gGap;
  const startX=ml+(W-ml-mr-D-totalG)/2;
  const gx=(i: number)=>startX+i*(gW+gGap);
  const by=(h: number)=>f2(mt+dY+ch-h);
  const barH=(v: number)=>f2(v/maxV*ch);
  const incC='#10b981', expC='#00857a';

  let s = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;
  [0.5,1].forEach(f => {
    const gy=f2(mt+dY+ch*(1-f));
    s += `<line x1="${ml}" y1="${gy}" x2="${W-mr+D}" y2="${gy}" stroke="#e4e6ea" stroke-width="1" pointer-events="none"/>`;
  });
  pts.forEach((d, i) => {
    const gLeft=gx(i);
    ([[ d.inc, incC, 0], [d.exp, expC, bw+bGap]] as [number,string,number][]).forEach(([val, fc, ox]) => {
      if (!val) return;
      const h=barH(val), x=f2(gLeft+ox), yT=by(h), yB=f2(mt+dY+ch);
      const sc=hexDarken(fc,0.58), tc=hexDarken(fc,0.78);
      s += `<rect x="${x}" y="${yT}" width="${bw}" height="${f2(yB-yT)}" fill="${fc}"/>`;
      s += `<polygon points="${f2(x+bw)},${yT} ${f2(x+bw+D)},${f2(yT-dY)} ${f2(x+bw+D)},${f2(yB-dY)} ${f2(x+bw)},${yB}" fill="${sc}"/>`;
      s += `<polygon points="${x},${yT} ${f2(x+bw)},${yT} ${f2(x+bw+D)},${f2(yT-dY)} ${f2(x+D)},${f2(yT-dY)}" fill="${tc}"/>`;
    });
    s += `<text x="${f2(gLeft+gW/2)}" y="${H-4}" text-anchor="middle" font-size="${n>9?8:9}" fill="#9ca3af">${d.label}</text>`;
  });
  s += '</svg>';
  return s;
}

// ── Graphique solde ───────────────────────────────────────────

function buildBalanceChart(
  data:      AppData,
  accountId: AccountId,
  month:     MonthKey,
  n:         number
): string {
  const months = pastMonths(month, n);
  const vals = months.map(mk => {
    const bal = getBankBalance(data, mk, accountId);
    return {
      label: mk.split('-')[1]!.replace(/^0/, '') + '/' + mk.split('-')[0]!.slice(2),
      balance: bal ?? 0,
      hasAnchor: bal !== null,
    };
  });

  const balances = vals.map(v => v.balance);
  const minVal=Math.min(...balances, 0), maxVal=Math.max(...balances, 0);
  const range=maxVal-minVal||1;
  const W=320, H=165, ml=44, mr=16, mt=22, mb=28, D=10, dY=6;
  const cw=W-ml-mr-D, ch=H-mt-mb-dY;
  const f2=(v: number)=>+v.toFixed(2);
  const gap=n>6?3:5;
  const bw=(cw-gap*(n-1))/n;
  const bx=(i: number)=>ml+i*(bw+gap);
  const by=(v: number)=>mt+dY+ch-((v-minVal)/range)*ch;
  const zy=by(0);

  let s=`<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;
  // Grille
  [-1,-0.5,0,0.5,1].forEach(f => {
    const v=minVal+(maxVal-minVal)*(f+1)/2;
    if (v<minVal||v>maxVal) return;
    const gy=f2(by(v));
    s+=`<line x1="${ml}" y1="${gy}" x2="${W-mr}" y2="${gy}" stroke="${v===0?'#9ca3af':'#e4e6ea'}" stroke-width="${v===0?1.2:1}" pointer-events="none"/>`;
    s+=`<text x="${ml-4}" y="${f2(gy+3.5)}" text-anchor="end" font-size="8" fill="#9ca3af">${chartLbl(v/100)}</text>`;
  });
  // Barres
  vals.forEach((d, i) => {
    if (!d.hasAnchor) return;
    const pos=d.balance>=0;
    const x=f2(bx(i)), yT=f2(by(Math.max(d.balance,0))), yZ=f2(zy);
    const yB=pos?yZ:f2(by(d.balance));
    const h=Math.abs(f2(yZ-by(d.balance)));
    const fc=pos?'#10b981':'#ef4444';
    const sc=hexDarken(fc,0.62), tc=hexDarken(fc,0.82);
    s+=`<rect x="${x}" y="${pos?yT:yZ}" width="${f2(bw)}" height="${h}" fill="${fc}"/>`;
    s+=`<polygon points="${f2(x+bw)},${pos?yT:yZ} ${f2(x+bw+D)},${f2((pos?yT:yZ)-dY)} ${f2(x+bw+D)},${f2((pos?yZ:yB)-dY)} ${f2(x+bw)},${pos?yZ:yB}" fill="${sc}"/>`;
    s+=`<polygon points="${x},${pos?yT:yZ} ${f2(x+bw)},${pos?yT:yZ} ${f2(x+bw+D)},${f2((pos?yT:yZ)-dY)} ${f2(x+D)},${f2((pos?yT:yZ)-dY)}" fill="${tc}"/>`;
  });
  vals.forEach((d, i) => {
    s+=`<text x="${f2(bx(i)+bw/2)}" y="${H-4}" text-anchor="middle" font-size="${n>9?8:9}" fill="#9ca3af">${d.label}</text>`;
  });
  s+='</svg>';
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

function hexDarken(hex: string, factor: number): string {
  const h=hex.replace('#','');
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;
}

function fmtShort(cents: number): string {
  const v = cents / 100;
  if (Math.abs(v) >= 1000) return (v/1000).toFixed(1).replace('.',',') + 'k €';
  return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}

function chartLbl(v: number): string {
  if (Math.abs(v) >= 1000) return (v>=0?'+':'')+(v/1000).toFixed(1).replace('.',',')+'k';
  return (v>=0?'+':'')+Math.round(v);
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
