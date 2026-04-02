/* ═══════════════════════════════════════════════════════════════
   analyse.ts — Analyse par catégorie
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { setAnchor, getAnchor, getMonthSummary, addGoal, deleteGoal } from '../core/service';
import { getState, setState } from './app';
import { Nav } from './router';
import { toast } from './toast';
import { fmt, fmtAbs, inputToCents } from './format';
import { getCatDef } from '../core/categories';

// ── Solde bancaire réel ───────────────────────────────────────

export async function saveBalRef(): Promise<void> {
  const input = document.getElementById('inp-balref') as HTMLInputElement | null;
  if (!input) return;

  const cents = inputToCents(input.value);
  if (cents <= 0) { toast('Montant invalide'); return; }

  const state     = getState();
  const accountId = Nav.accountId;
  const month     = Nav.month;

  const next = setAnchor(state, accountId, cents, month);
  await setState(next);

  const display = document.getElementById('balref-display');
  if (display) {
    display.style.display = 'block';
    const anchor = getAnchor(next, accountId);
    display.textContent = `Référence : ${fmt(anchor!.amountCents)} au ${anchor!.month}`;
  }

  toast(`✓ Solde de référence enregistré : ${fmt(cents)}`);
}

// ── Budget ────────────────────────────────────────────────────

export async function saveBudget(): Promise<void> {
  const input = document.getElementById('inp-bgt') as HTMLInputElement | null;
  if (!input) return;
  const cents = inputToCents(input.value);
  if (cents <= 0) { toast('Montant invalide'); return; }

  const state = getState();
  await setState({ ...state, budget: cents });
  toast(`✓ Budget défini : ${fmt(cents)}`);
}

function renderBudget(data: AppData, month: MonthKey, accountId: AccountId): void {
  const display = document.getElementById('bgt-display');
  if (!display) return;

  const budget = data.budget;
  if (!budget) { display.style.display = 'none'; return; }

  // Pré-remplir le champ
  const inp = document.getElementById('inp-bgt') as HTMLInputElement | null;
  if (inp && !inp.value) inp.value = String(budget / 100);

  const summary = getMonthSummary(data, month, accountId, 'reel');
  const exp = summary.expenseCents;
  const remaining = budget - exp;
  const pct = Math.min(Math.round(exp / budget * 100), 100);

  display.style.display = 'block';
  const remEl = document.getElementById('bgt-rem');
  if (remEl) { remEl.textContent = fmt(remaining); remEl.style.color = remaining >= 0 ? 'var(--green)' : '#c8102e'; }
  const subEl = document.getElementById('bgt-sub');
  if (subEl) subEl.textContent = `${fmt(exp)} dépensé sur ${fmt(budget)}`;
  const bar = document.getElementById('bgt-bar') as HTMLElement | null;
  if (bar) { bar.style.width = pct + '%'; bar.style.background = pct < 70 ? 'var(--green)' : pct < 90 ? 'var(--orange)' : '#c8102e'; }
  const pctEl = document.getElementById('bgt-pct');
  if (pctEl) pctEl.textContent = pct + '%';
}

// ── Règle 50/30/20 ────────────────────────────────────────────

const FIXED_CATS   = ['loyer','energie','telephone','credit_immo','credit_conso','assurance_hab','assurance_auto','assurance_vie','mutuelle','impots','frais_bancaires'];
const LOISIR_CATS  = ['streaming','cinema','sport_loisir','livre','jeux','voyage','hotel','restaurant','livraison','cafe','vetements','beaute','high_tech','amazon'];

function renderRule(incCents: number, expCents: number, byCat: Map<string, number>): void {
  const card = document.getElementById('rule-card');
  if (!card) return;
  if (incCents <= 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  const fixed   = FIXED_CATS.reduce((s, id) => s + (byCat.get(id) ?? 0), 0);
  const loisirs = LOISIR_CATS.reduce((s, id) => s + (byCat.get(id) ?? 0), 0);
  const epargne = Math.max(0, incCents - expCents);

  const rows = [
    { name: 'Charges fixes (50%)', val: fixed,   target: incCents * 0.5, color: 'var(--blue)' },
    { name: 'Loisirs (30%)',       val: loisirs,  target: incCents * 0.3, color: 'var(--orange)' },
    { name: 'Épargne (20%)',       val: epargne,  target: incCents * 0.2, color: 'var(--green)' },
  ];

  const el = document.getElementById('rule-bars');
  if (!el) return;
  el.innerHTML = rows.map(r => {
    const p = r.target > 0 ? Math.min(Math.round(r.val / r.target * 100), 100) : 0;
    return `<div class="rule-row">
      <div class="rule-top"><div class="rule-name">${r.name}</div><div class="rule-vals">${fmt(r.val)} / ${fmt(r.target)}</div></div>
      <div class="track"><div class="fill" style="width:${p}%;background:${r.color}"></div></div>
    </div>`;
  }).join('');
}

// ── Objectifs ─────────────────────────────────────────────────

export async function addGoalUI(): Promise<void> {
  const nameEl = document.getElementById('goal-name') as HTMLInputElement | null;
  const amtEl  = document.getElementById('goal-amt')  as HTMLInputElement | null;
  if (!nameEl || !amtEl) return;

  const label       = nameEl.value.trim();
  const targetCents = inputToCents(amtEl.value);
  if (!label || targetCents <= 0) { toast('Remplissez tous les champs'); return; }

  const state = getState();
  await setState(addGoal(state, { label, targetCents, savedCents: 0 }));
  nameEl.value = '';
  amtEl.value  = '';
  toast('✓ Objectif ajouté');
}

export async function deleteGoalUI(id: string): Promise<void> {
  if (!confirm('Supprimer cet objectif ?')) return;
  const state = getState();
  await setState(deleteGoal(state, id));
  toast('✓ Objectif supprimé');
}

function renderGoals(data: AppData): void {
  const el = document.getElementById('goals-list');
  if (!el) return;

  if (!data.goals.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:8px 0">Aucun objectif défini</div>';
    return;
  }

  // Bilan global toutes périodes pour les objectifs
  const totalSavedCents = data.goals.reduce((s, g) => s + g.savedCents, 0);

  el.innerHTML = data.goals.map(g => {
    const pct    = g.targetCents > 0 ? Math.min(Math.round(g.savedCents / g.targetCents * 100), 100) : 0;
    const remain = Math.max(0, g.targetCents - g.savedCents);
    return `<div class="goal-item">
      <div class="goal-top">
        <div>
          <div class="goal-name">${g.label}</div>
          <div class="goal-sub">${fmt(g.savedCents)} / ${fmt(g.targetCents)}</div>
        </div>
        <button class="goal-del" onclick="deleteGoalUI('${g.id}')">✕</button>
      </div>
      <div class="track"><div class="fill" style="width:${pct}%;background:var(--teal)"></div></div>
      ${pct >= 100
        ? `<div class="goal-eta" style="color:var(--green)">✓ Objectif atteint !</div>`
        : remain > 0 ? `<div class="goal-eta">Reste ${fmt(remain)}</div>` : ''}
    </div>`;
  }).join('');
}

// ── KPIs ─────────────────────────────────────────────────────

function renderKpis(incCents: number, expCents: number, month: MonthKey): void {
  const card = document.getElementById('analyse-kpis-card');
  const el   = document.getElementById('analyse-kpis');
  if (!card || !el) return;

  const bilan       = incCents - expCents;
  const savingsRate = incCents > 0 ? Math.round(bilan / incCents * 100) : 0;
  const rateColor   = savingsRate >= 20 ? 'var(--green)' : savingsRate >= 0 ? 'var(--orange)' : '#c8102e';

  const [y, m] = month.split('-').map(Number) as [number, number];
  const days   = new Date(y, m, 0).getDate();
  const expDay = days > 0 ? expCents / days : 0;

  card.style.display = 'block';
  el.innerHTML = `
    <div class="kpi"><div class="kpi-val" style="color:${rateColor}">${savingsRate}%</div><div class="kpi-lbl">Taux d'épargne</div></div>
    <div class="kpi"><div class="kpi-val" style="color:var(--teal)">${fmt(Math.round(expDay))}</div><div class="kpi-lbl">Dépenses/jour</div></div>
    <div class="kpi"><div class="kpi-val" style="color:var(--green)">${fmt(incCents)}</div><div class="kpi-lbl">Revenus ce mois</div></div>
    <div class="kpi"><div class="kpi-val" style="color:${bilan>=0?'var(--green)':'#c8102e'}">${bilan>=0?'+':''}${fmt(Math.abs(bilan))}</div><div class="kpi-lbl">Bilan mensuel</div></div>
  `;
}

// ── Conseils automatiques ─────────────────────────────────────

function renderConseils(incCents: number, expCents: number, byCat: Map<string, number>): void {
  const card = document.getElementById('analyse-conseils-card');
  const el   = document.getElementById('conseils-list');
  if (!card || !el) return;

  const savings     = incCents - expCents;
  const savingsRate = incCents > 0 ? Math.round(savings / incCents * 100) : 0;
  const conseils: { ico: string; bg: string; title: string; text: string }[] = [];

  if (incCents === 0) {
    conseils.push({ ico: '📥', bg: 'var(--blue-bg)', title: 'Aucun revenu ce mois', text: 'Ajoutez vos revenus pour obtenir une analyse complète.' });
  } else {
    if (savings < 0) conseils.push({ ico: '🚨', bg: '#fff0f0', title: 'Dépenses > Revenus', text: `Vous dépensez ${fmt(Math.abs(savings))} de plus que vous ne gagnez.` });
    if (savingsRate >= 20) conseils.push({ ico: '✅', bg: 'var(--green-bg)', title: 'Excellent taux d\'épargne', text: `${savingsRate}% de vos revenus sont épargnés. Continuez ainsi !` });
    else if (savingsRate >= 0) conseils.push({ ico: '⚠️', bg: 'var(--orange-bg)', title: 'Épargne à améliorer', text: `Taux d'épargne : ${savingsRate}%. L'objectif recommandé est 20%.` });

    const resto = (byCat.get('restaurant') ?? 0) + (byCat.get('livraison') ?? 0) + (byCat.get('cafe') ?? 0);
    if (resto > 20000) conseils.push({ ico: '🍽️', bg: 'var(--orange-bg)', title: 'Restauration élevée', text: `${fmt(resto)} en restauration ce mois.` });

    const streaming = byCat.get('streaming') ?? 0;
    if (streaming > 5000) conseils.push({ ico: '📺', bg: 'var(--blue-bg)', title: 'Abonnements streaming', text: `${fmt(streaming)}/mois en streaming.` });
  }

  if (!conseils.length) conseils.push({ ico: '👍', bg: 'var(--green-bg)', title: 'Tout va bien', text: 'Aucune anomalie détectée dans vos dépenses ce mois.' });

  card.style.display = 'block';
  el.innerHTML = conseils.map(c => `
    <div class="conseil-item" style="background:${c.bg}">
      <div class="conseil-ico">${c.ico}</div>
      <div class="conseil-body"><div class="c-title">${c.title}</div><div class="c-text">${c.text}</div></div>
    </div>`).join('');
}

// ── Actions données ───────────────────────────────────────────

export async function clearCurrentAccountTxs(): Promise<void> {
  const state   = getState();
  const id      = Nav.accountId;
  const account = state.accounts.find(a => a.id === id);
  const name    = account?.name ?? id;

  if (!confirm(`Supprimer TOUTES les transactions de "${name}" ?\nLes autres comptes ne sont pas touchés.`)) return;
  if (!confirm(`⚠ DERNIÈRE CONFIRMATION\n\nToutes les transactions de "${name}" seront effacées définitivement.`)) return;

  await setState({ ...state, txs: state.txs.filter(t => t.accountId !== id) });
  toast(`✓ Transactions "${name}" supprimées`);
}

export async function resetAll(): Promise<void> {
  if (!confirm('⚠ ATTENTION\n\nSuppression DÉFINITIVE de toutes les données.')) return;
  if (!confirm('⚠ DERNIÈRE CONFIRMATION\n\nTOUTES les données de TOUS les comptes seront effacées.')) return;

  const state = getState();
  await setState({ ...state, txs: [], recs: [], goals: [], anchors: [] });
  toast('✓ Données supprimées');
}

export async function saveMensualite(): Promise<void> {
  const inp = document.getElementById('inp-mensualite') as HTMLInputElement | null;
  if (!inp) return;
  const val = inp.value.replace(',', '.');
  const cents = Math.round(parseFloat(val) * 100);
  if (isNaN(cents) || cents <= 0) { toast('⚠ Montant invalide'); return; }

  const state = getState();
  const accountId = Nav.accountId;
  const accounts = state.accounts.map(a =>
    a.id === accountId ? { ...a, mensualite: cents } : a
  );
  await setState({ ...state, accounts });
  toast('✓ Mensualité mise à jour');
}

// ── Catégories personnalisées ─────────────────────────────────

let _ccKind: 'income' | 'expense' = 'expense';
let _ccEditId: string | null = null;

export function renderCustomCats(data: AppData): void {
  const el = document.getElementById('custom-cats-list');
  if (!el) return;
  const cats = data.customCats ?? [];
  if (cats.length === 0) {
    el.innerHTML = '<p class="tx-empty" style="margin:8px 0;">Aucune catégorie personnalisée</p>';
    return;
  }
  el.innerHTML = cats.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:22px;">${c.icon}</span>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:14px;">${c.label}</div>
        <div style="font-size:11px;color:var(--text2);">${c.type === 'expense' ? 'Dépense' : 'Revenu'}</div>
      </div>
      <button onclick="deleteCustomCatUI('${c.id}')" style="background:none;border:none;font-size:16px;cursor:pointer;color:var(--text3);padding:4px;">✕</button>
    </div>
  `).join('');
}

export function openCustomCatForm(): void {
  _ccKind = 'expense';
  _ccEditId = null;
  const f = document.getElementById('custom-cat-form');
  if (f) f.style.display = 'block';
  customCatSetKind('expense');
  (document.getElementById('cc-inp-label') as HTMLInputElement).value = '';
  (document.getElementById('cc-inp-icon')  as HTMLInputElement).value = '';
}

export function closeCustomCatForm(): void {
  const f = document.getElementById('custom-cat-form');
  if (f) f.style.display = 'none';
}

export function customCatSetKind(kind: 'income' | 'expense'): void {
  _ccKind = kind;
  const dep = document.getElementById('cc-btn-dep') as HTMLButtonElement | null;
  const rev = document.getElementById('cc-btn-rev') as HTMLButtonElement | null;
  if (!dep || !rev) return;
  if (kind === 'expense') {
    dep.style.cssText = 'flex:1;padding:8px;border-radius:8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;';
    rev.style.cssText = 'flex:1;padding:8px;border-radius:8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);';
  } else {
    rev.style.cssText = 'flex:1;padding:8px;border-radius:8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:2px solid var(--green);background:#f0fff4;color:var(--green);';
    dep.style.cssText = 'flex:1;padding:8px;border-radius:8px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);';
  }
}

export async function saveCustomCat(): Promise<void> {
  const label = (document.getElementById('cc-inp-label') as HTMLInputElement).value.trim();
  const icon  = (document.getElementById('cc-inp-icon')  as HTMLInputElement).value.trim() || '📌';
  if (!label) { toast('⚠ Nom requis'); return; }

  const state = getState();
  const id    = 'custom_' + Date.now();
  const newCat = { id, label, icon, type: _ccKind };
  const customCats = [...(state.customCats ?? []), newCat];
  await setState({ ...state, customCats });
  closeCustomCatForm();
  renderCustomCats(getState());
  toast('✓ Catégorie ajoutée');
}

export async function deleteCustomCatUI(id: string): Promise<void> {
  const state = getState();
  const customCats = (state.customCats ?? []).filter(c => c.id !== id);
  await setState({ ...state, customCats });
  renderCustomCats(getState());
  toast('✓ Catégorie supprimée');
}

// Exposer globalement
(window as any).saveBalRef              = saveBalRef;
(window as any).saveBudget              = saveBudget;
(window as any).addGoalUI               = addGoalUI;
(window as any).deleteGoalUI            = deleteGoalUI;
(window as any).clearCurrentAccountTxs  = clearCurrentAccountTxs;
(window as any).resetAll                = resetAll;
(window as any).saveMensualite          = saveMensualite;
(window as any).openCustomCatForm       = openCustomCatForm;
(window as any).closeCustomCatForm      = closeCustomCatForm;
(window as any).customCatSetKind        = customCatSetKind;
(window as any).saveCustomCat           = saveCustomCat;
(window as any).deleteCustomCatUI       = deleteCustomCatUI;

// ── Rendu analyse ─────────────────────────────────────────────

export function renderAnalyse(
  data:      AppData,
  month:     MonthKey,
  accountId: AccountId,
  mode:      'reel' | 'previsionnel'
) {
  // Ancre
  const anchor  = getAnchor(data, accountId);
  const display = document.getElementById('balref-display');
  if (display) {
    if (anchor) {
      display.style.display = 'block';
      display.textContent   = `Référence : ${fmt(anchor.amountCents)} au ${anchor.month}`;
    } else {
      display.style.display = 'none';
    }
  }

  // Budget (pré-remplissage champ)
  const inp = document.getElementById('inp-bgt') as HTMLInputElement | null;
  if (inp && data.budget && !inp.value) inp.value = String(data.budget / 100);

  // Transactions réelles du mois
  const txs = data.txs.filter(t =>
    t.accountId === accountId &&
    t.date.startsWith(month) &&
    (mode === 'previsionnel' ? true : !t.planned)
  );

  const TRANSFER_CATS = ['epargne_dep', 'livret', 'epargne'];
  const expTxs = txs.filter(t => t.kind === 'expense' && !TRANSFER_CATS.includes(t.cat));
  const incTxs = txs.filter(t => t.kind === 'income');

  const expCents = expTxs.reduce((s, t) => s + t.amountCents, 0);
  const incCents = incTxs.reduce((s, t) => s + t.amountCents, 0);

  // Map par catégorie (dépenses)
  const byCat = new Map<string, number>();
  for (const t of expTxs) {
    byCat.set(t.cat, (byCat.get(t.cat) ?? 0) + t.amountCents);
  }

  // Sections KPI/conseils/règle uniquement pour compte courant
  const accountType = data.accounts.find(a => a.id === accountId)?.type ?? 'checking';
  const isChecking = accountType === 'checking';

  if (isChecking) {
    renderKpis(incCents, expCents, month);
    renderConseils(incCents, expCents, byCat);
    renderBudget(data, month, accountId);
    renderRule(incCents, expCents, byCat);
  } else {
    // Masquer les sections CC
    const kpisCard = document.getElementById('analyse-kpis-card');
    const consCard = document.getElementById('analyse-conseils-card');
    const ruleCard = document.getElementById('rule-card');
    if (kpisCard) kpisCard.style.display = 'none';
    if (consCard) consCard.style.display = 'none';
    if (ruleCard) ruleCard.style.display = 'none';
  }
  renderGoals(data);
  renderCustomCats(data);

  // Barres par catégorie (uniquement pour compte courant)
  const catEl = document.getElementById('analyse-by-cat');
  if (!catEl) return;

  const account = data.accounts.find(a => a.id === accountId);
  if (account?.type === 'savings') {
    catEl.innerHTML = '';
    return;
  }
  if (account?.type === 'credit') {
    const curMensualite = account.mensualite ? (account.mensualite / 100).toFixed(2).replace('.', ',') : '';
    catEl.innerHTML = `
      <div class="card">
        <div class="card-title">Mensualité du crédit</div>
        <div class="modal-field" style="margin-top:8px;">
          <label>Montant mensuel (€)</label>
          <input type="text" inputmode="decimal" id="inp-mensualite"
                 value="${curMensualite}" placeholder="ex: 113,38">
        </div>
        <button onclick="saveMensualite()" class="modal-btn-save" style="width:100%;margin-top:8px;">
          Enregistrer
        </button>
      </div>
    `;
    return;
  }

  if (expTxs.length === 0) {
    catEl.innerHTML = '<p class="tx-empty">Aucune dépense ce mois-ci</p>';
    return;
  }

  const sorted = [...byCat.entries()].sort(([, a], [, b]) => b - a);

  catEl.innerHTML = `
    <div class="card">
      <div class="card-title">Dépenses par catégorie — ${fmt(expCents)}</div>
      <div class="analyse-list">
        ${sorted.map(([catId, cents]) => {
          const pct    = expCents > 0 ? Math.round((cents / expCents) * 100) : 0;
          const catDef = getCatDef(catId, data.customCats);
          return `
            <div class="analyse-item">
              <div class="analyse-cat">${catDef.icon} ${catDef.label}</div>
              <div class="analyse-bar-wrap">
                <div class="analyse-bar" style="width:${pct}%;background:${catDef.color}"></div>
              </div>
              <div class="analyse-amount">${fmt(cents)} <span class="analyse-pct">${pct}%</span></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
