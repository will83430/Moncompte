import { h } from 'preact';
import { useEffect, useRef, useState, useMemo } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId } from '../../store';
import { renderAnalyse } from '../analyse';
import { currentMonthKey } from '../../core/balance';
import { detectSubscriptions } from '../../services/subscriptions';
import { getCatDef } from '../../core/categories';
import { fmt } from '../format';
import type { MonthKey, AccountId, AppData } from '../../core/types';

const ANALYSE_TEMPLATE = `
  <div class="card">
    <div class="card-title">Solde bancaire réel</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px;">
      Entrez votre vrai solde — l'app projette ensuite chaque mois.
    </div>
    <div class="inline-row">
      <div class="field" style="margin-bottom:0;flex:1;">
        <input type="number" id="inp-balref" placeholder="Ex: 1852.22" step="0.01">
      </div>
      <button class="small-btn" onclick="saveBalRef()">Définir</button>
    </div>
    <div id="balref-display" style="display:none;margin-top:12px;font-size:12px;color:var(--text2);line-height:1.6;"></div>
  </div>

  <div class="card" id="analyse-kpis-card" style="display:none;">
    <div class="card-title">Indicateurs clés</div>
    <div class="kpi-grid" id="analyse-kpis"></div>
  </div>

  <div class="card" id="analyse-conseils-card" style="display:none;">
    <div class="card-title">Conseils automatiques</div>
    <div id="conseils-list"></div>
  </div>

  <div id="analyse-by-cat"></div>

  <div class="card">
    <div class="card-title">Budget mensuel</div>
    <div class="inline-row">
      <div class="field" style="margin-bottom:0;flex:1;">
        <input type="number" id="inp-bgt" placeholder="Ex : 1500" min="1">
      </div>
      <button class="small-btn" onclick="saveBudget()">Définir</button>
    </div>
    <div id="bgt-display" style="display:none;margin-top:16px;">
      <div class="bgt-remaining" id="bgt-rem">-</div>
      <div class="bgt-sub" id="bgt-sub">-</div>
      <div class="bgt-track"><div class="bgt-fill" id="bgt-bar" style="width:0%"></div></div>
      <div class="bgt-pct" id="bgt-pct">0%</div>
    </div>
  </div>

  <div class="card" id="rule-card" style="display:none;">
    <div class="card-title">Règle 50/30/20</div>
    <div id="rule-bars"></div>
    <div style="font-size:11px;color:var(--text3);margin-top:10px;line-height:1.5;">50% charges fixes · 30% loisirs · 20% épargne</div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
      Objectifs d'épargne
      <button onclick="toggleGoalForm()" class="small-btn" style="padding:4px 10px;">+ Ajouter</button>
    </div>
    <div id="goals-list"></div>
    <div id="goal-form-wrap" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
      <div class="modal-field">
        <label>Nom de l'objectif</label>
        <input type="text" id="goal-name" placeholder="Ex: Vacances, Voiture, Urgences…">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="modal-field">
          <label>Icône</label>
          <input type="text" id="goal-icon" placeholder="🎯" maxlength="2">
        </div>
        <div class="modal-field">
          <label>Montant cible (€)</label>
          <input type="text" id="goal-amt" inputmode="decimal" placeholder="ex: 2000">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="modal-field">
          <label>Déjà épargné (€)</label>
          <input type="text" id="goal-saved" inputmode="decimal" placeholder="0">
        </div>
        <div class="modal-field">
          <label>Échéance</label>
          <input type="month" id="goal-deadline">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;">
        <button class="modal-btn-cancel" onclick="toggleGoalForm()">Annuler</button>
        <button class="modal-btn-save" onclick="addGoalUI()">Enregistrer</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
      Catégories perso
      <button onclick="openCustomCatForm()" class="small-btn" style="padding:4px 10px;">+ Ajouter</button>
    </div>
    <div id="custom-cats-list"></div>
    <div id="custom-cat-form" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <button id="cc-btn-dep" onclick="customCatSetKind('expense')"
          style="flex:1;padding:8px;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;">Dépense</button>
        <button id="cc-btn-rev" onclick="customCatSetKind('income')"
          style="flex:1;padding:8px;border-radius:8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text2);">Revenu</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input type="text" id="cc-inp-icon" placeholder="Icône ex: 🌿" maxlength="2"
          style="width:60px;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:10px;font-size:20px;text-align:center;outline:none;font-family:'Inter',sans-serif;">
        <input type="text" id="cc-inp-label" placeholder="Nom de la catégorie"
          style="flex:1;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:10px;font-family:'Inter',sans-serif;font-size:14px;outline:none;color:var(--text);">
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="closeCustomCatForm()" class="modal-btn-cancel" style="flex:1;">Annuler</button>
        <button onclick="saveCustomCat()" class="modal-btn-save" style="flex:1;">Enregistrer</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Synchronisation WiFi</div>
    <p style="font-size:12px;color:var(--text2);margin:0 0 10px;">Lance <code>node sync-server.mjs</code> sur le PC, puis entre l'adresse et le token.</p>
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input id="sync-url" type="url" placeholder="http://192.168.1.x:7789"
        style="flex:1;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:'Inter',sans-serif;background:var(--bg);">
      <button onclick="syncScanQr()"
        style="padding:10px 14px;border-radius:10px;border:none;background:var(--teal);color:#fff;font-size:18px;cursor:pointer;">📷</button>
    </div>
    <div style="margin-bottom:8px;">
      <input id="sync-token" type="text" placeholder="Token (affiché dans le terminal)"
        style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:'Inter',sans-serif;background:var(--bg);">
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="syncFromPc()" class="small-btn" style="flex:1;background:var(--blue);">⬇ Recevoir</button>
      <button onclick="syncToPc()"   class="small-btn" style="flex:1;background:var(--blue);opacity:.75;">⬆ Envoyer</button>
    </div>
    <div id="sync-status" style="font-size:12px;color:var(--text2);margin-top:8px;min-height:16px;"></div>
  </div>

  <div class="card">
    <div class="card-title">Données</div>
    <div class="data-btns">
      <button onclick="exportJSON()" class="small-btn" style="background:var(--blue);">Export JSON</button>
      <button onclick="importJSON()" class="small-btn" style="background:var(--blue);opacity:.75;">Import JSON</button>
    </div>
    <button onclick="restoreBackup()"
      style="width:100%;background:none;border:1.5px solid var(--teal);color:var(--teal);border-radius:10px;padding:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;">
      Restaurer sauvegarde auto
    </button>
    <button onclick="clearCurrentAccountTxs()"
      style="width:100%;background:none;border:1.5px solid #f59e0b;color:#f59e0b;border-radius:10px;padding:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;">
      Vider le compte actif
    </button>
    <button onclick="resetAll()"
      style="width:100%;background:none;border:1.5px solid #c8102e;color:#c8102e;border-radius:10px;padding:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;margin-top:8px;">
      Supprimer toutes les données
    </button>
  </div>
`;

function changeMonth(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` as MonthKey;
}

function monthLabel(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ── Détection abonnements ─────────────────────────────────────

function SubscriptionsSection({ data, accountId }: { data: AppData; accountId: AccountId }) {
  const subs = useMemo(() => detectSubscriptions(data, accountId), [data, accountId]);

  const totalMonthly = subs.reduce((s, sub) => s + sub.amountCents, 0);
  const totalAnnual  = subs.reduce((s, sub) => s + sub.annualCost, 0);

  return (
    <div class="card" style="padding:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div class="card-title" style="margin:0;">🔁 Abonnements détectés</div>
        {subs.length > 0 && (
          <div style="font-size:11px;color:var(--text2);text-align:right;">
            <div style="font-weight:600;">{fmt(totalMonthly)}/mois</div>
            <div>{fmt(totalAnnual)}/an</div>
          </div>
        )}
      </div>

      {subs.length === 0 ? (
        <div style="color:var(--text3);font-size:13px;text-align:center;padding:12px 0;">
          Aucun abonnement régulier détecté<br/>
          <span style="font-size:11px;">(nécessite au moins 2 mois de données)</span>
        </div>
      ) : (
        subs.map((sub, i) => {
          const cat = getCatDef(sub.cat, data.customCats);
          return (
            <div key={i} style={`display:flex;align-items:center;gap:10px;padding:9px 0;${i > 0 ? 'border-top:1px solid var(--border);' : ''}`}>
              <div style={`font-size:18px;width:36px;height:36px;border-radius:10px;background:${cat.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;`}>
                {cat.icon}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{sub.name}</div>
                <div style="font-size:11px;color:var(--text3);">
                  {sub.monthCount} mois · prochain ≈ {sub.nextDate.slice(0, 7)}
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:14px;font-weight:700;">{fmt(sub.amountCents)}/mois</div>
                <div style="font-size:11px;color:var(--text3);">{fmt(sub.annualCost)}/an</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Simulation crédit ─────────────────────────────────────────

function CreditSimulator() {
  const [capital,  setCapital]  = useState('');
  const [taux,     setTaux]     = useState('');
  const [duree,    setDuree]    = useState('');
  const [result,   setResult]   = useState<null | { mensualite: number; totalInteret: number; totalCout: number; }>(null);

  const simulate = () => {
    const P = parseFloat(capital.replace(',', '.'));
    const r = parseFloat(taux.replace(',', '.')) / 100 / 12;
    const n = parseInt(duree);
    if (!P || !r || !n || P <= 0 || r <= 0 || n <= 0) return;

    const mensualite   = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalCout    = mensualite * n;
    const totalInteret = totalCout - P;
    setResult({ mensualite, totalInteret, totalCout });
  };

  const fmtE = (v: number) => (v / 1).toFixed(2).replace('.', ',') + ' €';

  return (
    <div class="card" style="padding:14px;">
      <div class="card-title">💳 Simulation crédit</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div class="modal-field" style="margin:0;">
          <label>Capital (€)</label>
          <input type="text" inputMode="decimal" placeholder="ex: 15000"
            value={capital} onInput={e => setCapital((e.target as HTMLInputElement).value)} />
        </div>
        <div class="modal-field" style="margin:0;">
          <label>Taux annuel (%)</label>
          <input type="text" inputMode="decimal" placeholder="ex: 4,5"
            value={taux} onInput={e => setTaux((e.target as HTMLInputElement).value)} />
        </div>
      </div>

      <div class="modal-field" style="margin-bottom:12px;">
        <label>Durée (mois)</label>
        <input type="text" inputMode="numeric" placeholder="ex: 60 (= 5 ans)"
          value={duree} onInput={e => setDuree((e.target as HTMLInputElement).value)} />
      </div>

      <button class="modal-btn-save" style="width:100%;" onClick={simulate}>
        Calculer
      </button>

      {result && (
        <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
            <div style="text-align:center;background:var(--teal-light);border-radius:10px;padding:10px 6px;">
              <div style="font-size:16px;font-weight:700;color:var(--teal);">{fmtE(result.mensualite)}</div>
              <div style="font-size:10px;color:var(--text2);margin-top:2px;">Mensualité</div>
            </div>
            <div style="text-align:center;background:#fff0f0;border-radius:10px;padding:10px 6px;">
              <div style="font-size:16px;font-weight:700;color:#dc2626;">{fmtE(result.totalInteret)}</div>
              <div style="font-size:10px;color:var(--text2);margin-top:2px;">Intérêts</div>
            </div>
            <div style="text-align:center;background:var(--bg);border-radius:10px;padding:10px 6px;">
              <div style="font-size:16px;font-weight:700;">{fmtE(result.totalCout)}</div>
              <div style="font-size:10px;color:var(--text2);margin-top:2px;">Coût total</div>
            </div>
          </div>
          <div style="margin-top:10px;background:var(--bg);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--text2);">
            Sur <strong>{duree} mois</strong> ({Math.round(parseInt(duree)/12*10)/10} ans),
            vous remboursez <strong>{fmtE(parseFloat(capital.replace(',','.')))}</strong> + <strong style="color:#dc2626;">{fmtE(result.totalInteret)}</strong> d'intérêts.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────

export function AnalysePage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;
  const bodyRef   = useRef<HTMLDivElement>(null);

  const [month, setMonth] = useState<MonthKey>(currentMonthKey);
  const [mode,  setMode]  = useState<'reel'|'previsionnel'>('reel');

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.innerHTML = ANALYSE_TEMPLATE;
  }, []);

  useEffect(() => {
    if (!data) return;
    renderAnalyse(data, month, accountId, mode);
  }, [data, month, accountId, mode]);

  return (
    <div class="section active" id="sec-analyse">
      <div class="month-nav">
        <button class="mn-arrow" onClick={() => setMonth(m => changeMonth(m, -1))}>‹</button>
        <span class="mn-lbl-analyse">{monthLabel(month)}</span>
        <button class="mn-arrow" onClick={() => setMonth(m => changeMonth(m, 1))}>›</button>
      </div>
      <div class="mode-toggle">
        <button class={`mode-btn${mode === 'reel' ? ' mode-on' : ''}`} onClick={() => setMode('reel')}>Réel</button>
        <button class={`mode-btn${mode === 'previsionnel' ? ' mode-on' : ''}`} onClick={() => setMode('previsionnel')}>Prévisionnel</button>
      </div>

      {/* Sections existantes (impératives) */}
      <div id="analyse-body" ref={bodyRef}></div>

      {/* Sections V7 — en bas */}
      <CreditSimulator />
      <SubscriptionsSection data={data} accountId={accountId} />
    </div>
  );
}
