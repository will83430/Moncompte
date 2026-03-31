/* ═══════════════════════════════════════════════════════════════
   router.ts — Navigation entre sections + state courant (compte, mois, mode)
   ═══════════════════════════════════════════════════════════════ */

import { AppData, AccountId, MonthKey } from '../core/types';
import { currentMonthKey } from '../core/balance';
import { renderHeader } from './header';
import { renderDashboard } from './dashboard';
import { renderStats } from './stats';
import { renderRec } from './rec';
import { renderAnalyse } from './analyse';

export type Section = 'dash' | 'add' | 'stats' | 'rec' | 'analyse';
export type ViewMode = 'reel' | 'previsionnel';

// ── État navigation ───────────────────────────────────────────

let _data: AppData | null = null;
let _section: Section = 'dash';
let _month: MonthKey  = currentMonthKey();
let _mode: ViewMode   = 'reel';
let _accountId: AccountId = 'cc' as AccountId;

// ── Accesseurs ────────────────────────────────────────────────

export const Nav = {
  get data():      AppData   { return _data!; },
  get section():   Section   { return _section; },
  get month():     MonthKey  { return _month; },
  get mode():      ViewMode  { return _mode; },
  get accountId(): AccountId { return _accountId; },
};

// ── Router ────────────────────────────────────────────────────

export const Router = {

  init(data: AppData) {
    _data = data;
    // Restaurer le compte actif depuis localStorage (préférence UI, non chiffrée)
    const saved = localStorage.getItem('mc5_curaccount');
    if (saved) _accountId = saved as AccountId;
    else if (data.accounts.length > 0) _accountId = data.accounts[0]!.id;

    this.go('dash');
  },

  /** Met à jour les données (après setState) et re-render la section courante */
  refresh(data?: AppData) {
    if (data) _data = data;
    this._render();
  },

  go(section: Section) {
    _section = section;
    // Activer onglet nav
    document.querySelectorAll<HTMLElement>('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset['section'] === section);
    });
    // Afficher/masquer sections
    document.querySelectorAll<HTMLElement>('.section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `sec-${section}`);
    });
    this._render();
  },

  setMonth(mk: MonthKey) {
    _month = mk;
    this._render();
  },

  setMode(mode: ViewMode) {
    _mode = mode;
    el('mode-reel').classList.toggle('mode-on', mode === 'reel');
    el('mode-prev').classList.toggle('mode-on', mode === 'previsionnel');
    this._render();
  },

  setAccount(id: AccountId) {
    _accountId = id;
    localStorage.setItem('mc5_curaccount', id);
    this._render();
  },

  changeMonth(delta: number) {
    const [y, m] = _month.split('-').map(Number) as [number, number];
    const d = new Date(y, m - 1 + delta, 1);
    _month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` as MonthKey;
    this._render();
  },

  _render() {
    if (!_data) return;
    renderHeader(_data, _month, _accountId, _mode);
    switch (_section) {
      case 'dash':    renderDashboard(_data, _month, _accountId, _mode); break;
      case 'stats':   renderStats(_data, _month, _accountId, _mode); break;
      case 'rec':     renderRec(_data, _accountId); break;
      case 'analyse': renderAnalyse(_data, _month, _accountId, _mode); break;
    }
  },
};

function el(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

// Exposer globalement pour les onclick HTML
(window as any).navGo        = (s: Section)   => Router.go(s);
(window as any).changeMonth  = (d: number)    => Router.changeMonth(d);
(window as any).setViewMode  = (m: ViewMode)  => Router.setMode(m);
(window as any).setAccount   = (id: AccountId) => Router.setAccount(id);
