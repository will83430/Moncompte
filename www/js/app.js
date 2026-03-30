/* ═══════════════════════════════════════════════════════════════
   MonCarnetCompte — Logique applicative complète
   ═══════════════════════════════════════════════════════════════ */

/* ── CATÉGORIES DÉPENSES ── */
const CATS_EXP = [
  {id:'loyer',group:'Logement',label:'Loyer / Charges',icon:'🏠',color:'#3b82f6'},
  {id:'energie',group:'Logement',label:'Électricité / Gaz / Eau',icon:'💡',color:'#f59e0b'},
  {id:'telephone',group:'Logement',label:'Téléphone / Internet',icon:'📡',color:'#06b6d4'},
  {id:'travaux',group:'Logement',label:'Travaux / Entretien',icon:'🔧',color:'#78716c'},
  {id:'electromenager',group:'Logement',label:'Électroménager / Mobilier',icon:'🛋️',color:'#8b5cf6'},
  {id:'courses',group:'Alimentation',label:'Courses / Supermarché',icon:'🛒',color:'#10b981'},
  {id:'restaurant',group:'Alimentation',label:'Restaurant / Fast-food',icon:'🍽️',color:'#f97316'},
  {id:'livraison',group:'Alimentation',label:'Livraison repas',icon:'🛵',color:'#ef4444'},
  {id:'cafe',group:'Alimentation',label:'Café / Bar',icon:'☕',color:'#92400e'},
  {id:'carburant',group:'Transports',label:'Carburant',icon:'⛽',color:'#dc2626'},
  {id:'assurance_auto',group:'Transports',label:'Assurance véhicule',icon:'🚗',color:'#7c3aed'},
  {id:'transports_com',group:'Transports',label:'Transports en commun',icon:'🚇',color:'#2563eb'},
  {id:'taxi',group:'Transports',label:'Taxi / VTC',icon:'🚕',color:'#ca8a04'},
  {id:'parking',group:'Transports',label:'Parking / Péage',icon:'🅿️',color:'#4f46e5'},
  {id:'entretien_auto',group:'Transports',label:'Entretien véhicule',icon:'🔩',color:'#9a3412'},
  {id:'medecin',group:'Santé',label:'Médecin / Spécialiste',icon:'🩺',color:'#be123c'},
  {id:'pharmacie',group:'Santé',label:'Pharmacie / Médicaments',icon:'💊',color:'#e11d48'},
  {id:'mutuelle',group:'Santé',label:'Mutuelle / Complémentaire',icon:'🏥',color:'#9f1239'},
  {id:'optique',group:'Santé',label:'Optique / Dentaire',icon:'👓',color:'#881337'},
  {id:'sport_sante',group:'Santé',label:'Sport / Bien-être',icon:'🏋️',color:'#15803d'},
  {id:'streaming',group:'Loisirs',label:'Streaming / Abonnements',icon:'📺',color:'#7c3aed'},
  {id:'cinema',group:'Loisirs',label:'Cinéma / Spectacles',icon:'🎭',color:'#be185d'},
  {id:'sport_loisir',group:'Loisirs',label:'Sport / Club',icon:'⚽',color:'#16a34a'},
  {id:'livre',group:'Loisirs',label:'Livres / Presse / Musique',icon:'📚',color:'#b45309'},
  {id:'jeux',group:'Loisirs',label:'Jeux vidéo / Loisirs',icon:'🎮',color:'#0891b2'},
  {id:'voyage',group:'Loisirs',label:'Voyage / Vacances',icon:'✈️',color:'#0284c7'},
  {id:'hotel',group:'Loisirs',label:'Hôtel / Hébergement',icon:'🏨',color:'#0369a1'},
  {id:'vetements',group:'Shopping',label:'Vêtements / Chaussures',icon:'👕',color:'#db2777'},
  {id:'beaute',group:'Shopping',label:'Beauté / Cosmétiques',icon:'💅',color:'#ec4899'},
  {id:'high_tech',group:'Shopping',label:'High-Tech / Électronique',icon:'💻',color:'#6d28d9'},
  {id:'amazon',group:'Shopping',label:'Achats en ligne',icon:'📦',color:'#d97706'},
  {id:'ecole',group:'Famille',label:'École / Garde enfants',icon:'🏫',color:'#ca8a04'},
  {id:'jouets',group:'Famille',label:'Jouets / Enfants',icon:'🧸',color:'#ea580c'},
  {id:'animaux',group:'Famille',label:'Animaux de compagnie',icon:'🐾',color:'#92400e'},
  {id:'impots',group:'Finances',label:'Impôts / Taxes',icon:'🏛️',color:'#4338ca'},
  {id:'assurance_hab',group:'Finances',label:'Assurance habitation',icon:'🛡️',color:'#3730a3'},
  {id:'assurance_vie',group:'Finances',label:'Assurance vie / Prévoyance',icon:'📋',color:'#312e81'},
  {id:'credit_immo',group:'Finances',label:'Crédit immobilier',icon:'🏡',color:'#1e40af'},
  {id:'credit_conso',group:'Finances',label:'Crédit consommation',icon:'💳',color:'#1d4ed8'},
  {id:'epargne_dep',group:'Finances',label:'Épargne / Livret',icon:'🏦',color:'#059669'},
  {id:'frais_bancaires',group:'Finances',label:'Frais bancaires',icon:'🏧',color:'#6b7280'},
  {id:'don',group:'Finances',label:'Dons / Cadeaux',icon:'🎁',color:'#db2777'},
  {id:'retrait',group:'Finances',label:'Retrait espèces',icon:'💵',color:'#374151'},
  {id:'autre_dep',group:'Divers',label:'Autre dépense',icon:'📌',color:'#9ca3af'},
];

/* ── CATÉGORIES REVENUS ── */
const CATS_INC = [
  {id:'salaire',group:'Revenus pro',label:'Salaire / Traitement',icon:'💼',color:'#059669'},
  {id:'prime',group:'Revenus pro',label:'Prime / Bonus',icon:'⭐',color:'#10b981'},
  {id:'freelance',group:'Revenus pro',label:'Freelance / Auto-entreprise',icon:'🖥️',color:'#06b6d4'},
  {id:'chomage',group:'Revenus pro',label:'Chômage / ARE',icon:'📄',color:'#3b82f6'},
  {id:'retraite',group:'Revenus pro',label:'Retraite / Pension',icon:'👴',color:'#6366f1'},
  {id:'loyer_percu',group:'Revenus immo',label:'Loyer perçu',icon:'🏡',color:'#2563eb'},
  {id:'plus_value',group:'Revenus immo',label:'Plus-value / Vente',icon:'📈',color:'#16a34a'},
  {id:'caf',group:'Aides',label:'CAF / APL / Allocations',icon:'🤝',color:'#0284c7'},
  {id:'cpam',group:'Aides',label:'Remboursement CPAM',icon:'💊',color:'#be123c'},
  {id:'mutuelle_remb',group:'Aides',label:'Remboursement mutuelle',icon:'🏥',color:'#9f1239'},
  {id:'impots_remb',group:'Aides',label:'Remboursement impôts',icon:'🏛️',color:'#4338ca'},
  {id:'aide_logement',group:'Aides',label:'Aide logement / MaPrimeRénov',icon:'🏠',color:'#1d4ed8'},
  {id:'dividendes',group:'Épargne',label:'Dividendes / Intérêts',icon:'💹',color:'#059669'},
  {id:'livret',group:'Épargne',label:'Retrait livret / épargne',icon:'🏦',color:'#10b981'},
  {id:'vente',group:'Divers',label:'Vente (Leboncoin, etc.)',icon:'🏷️',color:'#ca8a04'},
  {id:'cadeau_recu',group:'Divers',label:'Cadeau / Don reçu',icon:'🎁',color:'#ec4899'},
  {id:'argent_rendu',group:'Divers',label:'Argent rendu / Remboursement ami',icon:'🤙',color:'#f97316'},
  {id:'gains_jeux',group:'Divers',label:'Gains / Loterie',icon:'🎰',color:'#eab308'},
  {id:'autre_rev',group:'Divers',label:'Autre revenu',icon:'💰',color:'#6b7280'},
];

/* ── COMPTES PAR DÉFAUT ── */
const DEFAULT_ACCOUNTS = [
  {id:'cc',     name:'Compte courant', icon:'🏦', type:'checking', color:'#00857a'},
  {id:'livret', name:'Livret A Sup',   icon:'💰', type:'savings',  color:'#f59e0b'},
  {id:'credit', name:'Crédit liberté', icon:'💳', type:'credit',   color:'#6366f1'},
];

/* ── ÉTAT ── */
let txs       = [];
let recs      = [];
let budget    = 0;
let goals     = [];
let customCats  = [];
let balanceRef  = null; // {[accountId]: {amount, month: 'YYYY-MM'}}
let accounts    = [];
let curAccountId = 'cc';
let curDate   = new Date();
let curType   = 'expense';
let cicData   = [];
let cicTab    = 'all';
let searchQuery = '';
let newCatType  = 'expense';
let filterType  = 'all';
let filterCat   = '';
let filterMin   = null;
let filterMax   = null;
let sortMode    = 'date-desc';
let filterOpen  = false;
let balChartPeriod = 12;
let viewMode = 'reel'; // 'reel' | 'previsionnel'
let barChartPeriod = 6;

/* ── HELPERS ── */
function todayStr() { return new Date().toISOString().slice(0, 10); }
// Transactions neutres (virements entre comptes propres) : visibles dans la liste mais exclues des stats
function _isIncome(t)  { return t.type === 'income'  && !t.transfer; }
function _isExpense(t) { return t.type === 'expense' && !t.transfer; }
function catList()  {
  const base = curType === 'expense' ? CATS_EXP : CATS_INC;
  const custom = customCats.filter(c => c.type === curType);
  return [...base, ...custom];
}
function catById(id){ return [...CATS_EXP, ...CATS_INC, ...customCats].find(c => c.id === id) || {icon:'📌', label:'Autre', color:'#9ca3af'}; }

function fmt(n, short = false) {
  if (short && Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + ' k€';
  return n.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
}
function fmtShort(n) { return fmt(n, false); }
function monthKey(d)   { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function monthLabel(d) { return d.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}).toUpperCase(); }
function getMonthTxs(d, aid, forceMode) {
  const mk   = monthKey(d || curDate);
  const a    = aid !== undefined ? aid : curAccountId;
  const mode = forceMode || viewMode;
  return txs.filter(t =>
    t.date.startsWith(mk) &&
    (t.accountId || 'cc') === a &&
    (mode === 'previsionnel' || !t.planned)
  );
}

function setViewMode(mode) {
  viewMode = mode;
  document.getElementById('mode-reel').classList.toggle('mode-on', mode === 'reel');
  document.getElementById('mode-prev').classList.toggle('mode-on', mode === 'previsionnel');
  renderAll();
}
function todayISO() { return todayStr(); }
function _findTx(id)  { return txs.find(t  => String(t.id)  === String(id)); }
function _findRec(id) { return recs.find(r => String(r.id)  === String(id)); }
function confirmTx(id) {
  const t = _findTx(id);
  if (!t) return;
  if (!confirm(`Confirmer "${t.desc}" (${t.type === 'expense' ? '-' : '+'}${t.amount.toFixed(2)} €) ?`)) return;
  t.planned = false;
  saveAll();
  renderAll();
  toast('✓ Transaction confirmée');
}

/* ── SAUVEGARDE (async, fire-and-forget OK car état en mémoire sync) ── */
function saveAll() {
  StorageManager.save(txs, recs, budget, goals).catch(e => console.error('Erreur sauvegarde:', e));
  _updateWidget();
  _scheduleAutoBackup();
}

let _backupTimer = null;
function _scheduleAutoBackup() {
  if (_backupTimer) clearTimeout(_backupTimer);
  _backupTimer = setTimeout(_autoBackup, 4000);
}

async function _autoBackup() {
  try {
    if (!window.Capacitor?.isNativePlatform()) return;
    const { Filesystem } = window.Capacitor.Plugins;
    if (!Filesystem) return;
    // Ne jamais sauvegarder si les données sont vides (protection contre reset accidentel)
    if (txs.length === 0) return;
    const payload = {txs, recs, budget, goals, customCats, accounts, balanceRef, exported: new Date().toISOString()};
    const data = JSON.stringify(payload);
    await Filesystem.writeFile({path: 'moncarnetcompte_backup.json', data, directory: 'EXTERNAL', encoding: 'utf8', recursive: true});
  } catch(e) { console.warn('Auto-backup:', e); }
}

function _updateWidget() {
  try {
    if (!window.Capacitor?.isNativePlatform()) return;
    const list = getMonthTxs();
    const inc  = list.filter(_isIncome).reduce((s,t)=>s+t.amount,0);
    const exp  = list.filter(_isExpense).reduce((s,t)=>s+t.amount,0);
    const bal  = inc - exp;
    const bankBal = getBankBalance(monthKey(curDate));
    const displayBal = bankBal !== null ? bankBal : bal;
    const sign = displayBal >= 0 ? '+' : '';
    window.Capacitor.Plugins.WidgetPlugin.updateWidget({
      month:    monthLabel(curDate),
      balance:  sign + fmt(displayBal),
      income:   fmt(inc),
      expenses: fmt(exp)
    });
  } catch(e) { /* widget non dispo, on ignore */ }
}

/* ── POINT D'ENTRÉE appelé par pin.js après déverrouillage ── */
function _normType(t) {
  if (t === 'revenu')  return 'income';
  if (t === 'depense') return 'expense';
  return t;
}

async function appInit(data) {
  txs    = (data.txs  || []).map(t => ({...t, type: _normType(t.type)}));
  recs   = (data.recs || []).map(r => ({...r, type: _normType(r.type)}));
  budget = data.budget || 0;
  goals  = data.goals  || [];
  customCats   = JSON.parse(localStorage.getItem('mc4_cats')      || '[]');
  balanceRef   = JSON.parse(localStorage.getItem('mc4_balref')    || 'null');
  accounts     = JSON.parse(localStorage.getItem('mc4_accounts')  || 'null') || DEFAULT_ACCOUNTS;
  curAccountId = localStorage.getItem('mc4_curaccount') || 'cc';
  if (!accounts.find(a => a.id === curAccountId)) curAccountId = accounts[0].id;
  // Migration balanceRef plat → par compte
  if (balanceRef && 'amount' in balanceRef && !balanceRef['cc']) {
    balanceRef = {cc: {amount: balanceRef.amount, month: balanceRef.month}};
    localStorage.setItem('mc4_balref', JSON.stringify(balanceRef));
  }

  document.getElementById('hdr-date').textContent =
    new Date().toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'long'}).toUpperCase();
  document.getElementById('inp-date').value = todayStr();
  if (budget) document.getElementById('inp-bgt').value = budget;

  // Migration : stamper accountId 'cc' sur les récurrents sans compte
  recs = recs.map(r => r.accountId ? r : {...r, accountId: 'cc'});

  populateCats();

  // Restauration auto uniquement si les données sont vides
  if (txs.length === 0 && window.Capacitor?.isNativePlatform()) {
    try {
      const { Filesystem } = window.Capacitor.Plugins;
      if (Filesystem) {
        const r = await Filesystem.readFile({path: 'moncarnetcompte_backup.json', directory: 'EXTERNAL', encoding: 'utf8'});
        const d = JSON.parse(r.data);
        if (d.txs && d.txs.length > 0) {
          txs    = d.txs.map(t => ({...t, type: _normType(t.type)}));
          recs   = (d.recs   || []).map(r => ({...r, type: _normType(r.type)}));
          budget = d.budget || budget;
          goals  = d.goals  || goals;
          if (d.customCats)  { customCats  = d.customCats;  localStorage.setItem('mc4_cats',    JSON.stringify(customCats)); }
          if (d.accounts)    { accounts    = d.accounts;    localStorage.setItem('mc4_accounts', JSON.stringify(accounts)); }
          if (d.balanceRef)  { balanceRef  = d.balanceRef;  localStorage.setItem('mc4_balref',   JSON.stringify(balanceRef)); }
          saveAll();
          toast('✓ Données restaurées (' + txs.length + ' transactions)');
        }
      }
    } catch(e) { /* pas de backup, on continue */ }
  }

  // Auto-import de l'historique si données vides et fichier présent
  if (txs.length === 0) {
    try {
      const r = await fetch('./import_history.json');
      if (r.ok) {
        const imported = await r.json();
        if (imported.txs && imported.txs.length) {
          txs    = imported.txs;
          recs   = imported.recs   || recs;
          budget = imported.budget || budget;
          goals  = imported.goals  || goals;
          saveAll();
          toast('✓ Historique importé — ' + txs.length + ' transactions');
        }
      }
    } catch(e) { /* pas de fichier, on continue */ }
  }

  renderAll();
  _updateWidget();

  // Désinstaller les anciens SW en dev (évite les conflits de cache)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
  }
}

/* ── CATÉGORIES SELECT ── */
function populateCats() {
  const sel = document.getElementById('inp-cat');
  sel.innerHTML = '';
  const groups = {};
  catList().forEach(c => { if (!groups[c.group]) groups[c.group] = []; groups[c.group].push(c); });
  Object.entries(groups).forEach(([g, cats]) => {
    const og = document.createElement('optgroup');
    og.label = '── ' + g;
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.icon + ' ' + c.label;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
}

/* ── NAVIGATION ── */
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  const navBtn = document.getElementById('nav-' + name);
  if (navBtn) navBtn.classList.add('active');
  renderAll();
}

function changeMonth(d) {
  curDate = new Date(curDate.getFullYear(), curDate.getMonth() + d, 1);
  renderAll();
}

function setType(t) {
  curType = t;
  document.getElementById('btn-exp').className = 'type-btn' + (t === 'expense' ? ' act-exp' : '');
  document.getElementById('btn-inc').className = 'type-btn' + (t === 'income'  ? ' act-inc' : '');
  document.getElementById('submit-btn').className = 'submit-btn ' + (t === 'expense' ? 'exp' : 'inc');
  document.getElementById('amt-line').style.background = t === 'expense' ? 'var(--teal)' : 'var(--green)';
  populateCats();
}

/* ── AJOUTER TRANSACTION ── */
function addTx() {
  const amt    = parseFloat(document.getElementById('inp-amt').value);
  const desc   = document.getElementById('inp-desc').value.trim();
  const cat    = document.getElementById('inp-cat').value;
  const date   = document.getElementById('inp-date').value;
  const isRec     = document.getElementById('chk-rec').checked;
  const recDay    = parseInt(document.getElementById('inp-recday').value) || 1;
  const isPlanned  = document.getElementById('chk-planned').checked;
  const isTransfer = document.getElementById('chk-transfer').checked;

  if (!amt || amt <= 0) return toast('⚠ Montant invalide');
  if (!desc)            return toast('⚠ Description manquante');
  if (!date)            return toast('⚠ Date manquante');

  const newTx = {id: Date.now(), type: curType, amount: amt, desc, cat, date, accountId: curAccountId, recurring: isRec, planned: isPlanned};
  if (isTransfer) newTx.transfer = true;
  txs.push(newTx);

  if (isRec) {
    const exists = recs.find(r => r.desc === desc && r.cat === cat && r.type === curType);
    if (!exists) {
      recs.push({id: Date.now() + 1, type: curType, amount: amt, desc, cat, day: recDay, accountId: curAccountId});
    }
    toast('✓ Enregistré + ajouté aux récurrents');
  } else if (isPlanned) {
    toast('📅 Transaction prévue enregistrée');
  } else {
    toast('✓ ' + (curType === 'expense' ? 'Dépense' : 'Revenu') + ' enregistré');
  }

  saveAll();
  document.getElementById('inp-amt').value  = '';
  document.getElementById('inp-desc').value = '';
  document.getElementById('inp-date').value = todayStr();
  document.getElementById('chk-rec').checked = false;
  document.getElementById('chk-planned').checked  = false;
  document.getElementById('chk-transfer').checked = false;
  document.getElementById('inp-recday').value = '';
  renderAll();
  showSection('dash');
}

/* ── RÉCURRENTS ── */
function getPendingRecs() {
  const mk = monthKey(curDate);
  return recs
    .filter(r => (r.accountId || 'cc') === curAccountId)
    .filter(r => !txs.some(t => t.cat === r.cat && t.date.startsWith(mk) && (t.accountId || 'cc') === curAccountId));
}

function applyAllRec() {
  const pending = getPendingRecs();
  const mk = monthKey(curDate);
  const [y, m] = mk.split('-');
  pending.forEach(r => {
    const day  = Math.min(r.day, new Date(y, m, 0).getDate());
    const date = `${y}-${m}-${String(day).padStart(2, '0')}`;
    txs.push({id: Date.now() + Math.random(), type: r.type, amount: r.amount, desc: r.desc, cat: r.cat, date, accountId: curAccountId, recurring: true, planned: true});
  });
  saveAll();
  toast('✓ ' + pending.length + ' transaction(s) importée(s)');
  renderAll();
}

function applyOneRec(id) {
  const r = _findRec(id);
  if (!r) return;
  const mk = monthKey(curDate);
  const [y, m] = mk.split('-');
  const day  = Math.min(r.day, new Date(y, m, 0).getDate());
  const date = `${y}-${m}-${String(day).padStart(2, '0')}`;
  txs.push({id: Date.now(), type: r.type, amount: r.amount, desc: r.desc, cat: r.cat, date, accountId: curAccountId, recurring: true, planned: true});
  saveAll();
  toast('✓ Importée : ' + r.desc);
  renderAll();
}

function deleteRec(id) {
  if (!confirm('Supprimer cette récurrente ?')) return;
  recs = recs.filter(r => String(r.id) !== String(id));
  saveAll();
  renderAll();
  toast('✓ Récurrente supprimée');
}

function deleteTx(id) {
  if (!confirm('Supprimer cette transaction ?')) return;
  txs = txs.filter(t => String(t.id) !== String(id));
  saveAll();
  renderAll();
  toast('✓ Supprimé');
}

/* ── RENDER ALL ── */
/* ── COMPTES ── */
function switchAccount(id) {
  curAccountId = id;
  localStorage.setItem('mc4_curaccount', id);
  renderAll();
}

function renderAccountSwitcher() {
  const el = document.getElementById('account-switcher');
  if (!el) return;
  el.innerHTML = accounts.map(a =>
    `<button class="acc-pill${a.id === curAccountId ? ' acc-pill-active' : ''}"
       onclick="switchAccount('${a.id}')">${a.icon} ${a.name}</button>`
  ).join('');
}

function renderAll() {
  renderAccountSwitcher();
  renderHeader();
  renderDash();
  renderStats();
  renderAnalyse();
  renderRecs();
  const mnLbl = document.getElementById('mn-lbl');
  if (mnLbl) mnLbl.textContent = monthLabel(curDate);
  const mnStats = document.getElementById('mn-lbl-stats');
  if (mnStats) mnStats.textContent = monthLabel(curDate);
}

/* ── SOLDE BANCAIRE ── */
function getBankBalance(targetMk, aid) {
  const a   = aid || curAccountId;
  const ref = balanceRef ? balanceRef[a] : null;
  if (!ref) return null;
  const refMk = ref.month;
  let balance = ref.amount;
  if (targetMk === refMk) return balance;
  const toNum = mk => { const [y, m] = mk.split('-').map(Number); return y * 12 + m; };
  const refN  = toNum(refMk), tgtN = toNum(targetMk);
  const step  = tgtN > refN ? 1 : -1;
  for (let n = refN + step; step > 0 ? n <= tgtN : n >= tgtN; n += step) {
    const y = Math.floor((n - 1) / 12), m = ((n - 1) % 12) + 1;
    // Toujours 'reel' : le solde bancaire n'inclut jamais les transactions prévues
    const l = getMonthTxs(new Date(y, m - 1, 1), a, 'reel');
    const bilan = l.filter(_isIncome).reduce((s,t)=>s+t.amount,0)
                - l.filter(_isExpense).reduce((s,t)=>s+t.amount,0);
    balance += step > 0 ? bilan : -bilan;
  }
  return balance;
}

function saveBalRef() {
  const val = parseFloat(document.getElementById('inp-balref').value);
  if (isNaN(val)) return toast('⚠ Montant invalide');
  if (!balanceRef) balanceRef = {};
  // Stocker sur le mois précédent : val = refPrev + bilanceMoisCourant
  // → refPrev = val - bilanMoisCourant (confirmé seulement)
  const curMk = monthKey(curDate);
  const [cy, cm] = curMk.split('-').map(Number);
  const prevMk = cm === 1
    ? `${cy - 1}-12`
    : `${cy}-${String(cm - 1).padStart(2, '0')}`;
  const curMonthTxs = getMonthTxs(curDate, curAccountId, 'reel');
  const curBilan = curMonthTxs.filter(_isIncome).reduce((s, t) => s + t.amount, 0)
                 - curMonthTxs.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  balanceRef[curAccountId] = {amount: val - curBilan, month: prevMk};
  localStorage.setItem('mc4_balref', JSON.stringify(balanceRef));
  renderHeader();
  renderBalRefDisplay();
  toast('✓ Solde de référence défini pour ' + monthLabel(curDate));
}

function clearBalRef() {
  if (balanceRef) delete balanceRef[curAccountId];
  localStorage.setItem('mc4_balref', JSON.stringify(balanceRef || {}));
  renderHeader();
  renderBalRefDisplay();
}

function renderBalRefDisplay() {
  const el = document.getElementById('balref-display');
  if (!el) return;
  const ref = balanceRef ? balanceRef[curAccountId] : null;
  if (!ref) { el.style.display = 'none'; return; }
  const bankBal  = getBankBalance(monthKey(curDate));
  const refLabel = new Date(ref.month + '-15').toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'});
  el.style.display = 'block';
  el.innerHTML = `Référence : <strong>${fmt(ref.amount)}</strong> (${refLabel})<br>
    Solde estimé ce mois : <strong style="color:${bankBal >= 0 ? 'var(--green)' : '#c8102e'}">${fmt(bankBal)}</strong>
    <button onclick="clearBalRef()"
      style="margin-left:10px;background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;text-decoration:underline;">Effacer</button>`;
}

/* ── HEADER ── */
function renderHeader() {
  // mInc/mExp toujours en mode réel (transactions confirmées uniquement)
  // pour que le calcul du solde prévu soit correct
  const mList = getMonthTxs(undefined, undefined, 'reel');
  const mInc  = mList.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
  const mExp  = mList.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  const mBal  = mInc - mExp;
  const acc   = accounts.find(a => a.id === curAccountId) || accounts[0];
  const type  = acc?.type || 'checking';

  const elMain     = document.getElementById('bal-main');
  const elLabel    = document.getElementById('bal-label');
  const elIncLbl   = document.getElementById('bal-inc-lbl');
  const elExpLbl   = document.getElementById('bal-exp-lbl');
  const elInc      = document.getElementById('bal-inc');
  const elExp      = document.getElementById('bal-exp');
  const elMonth    = document.getElementById('bal-month');
  const elMonthLbl = document.getElementById('bal-month-lbl');

  // Réafficher la 3ème carte par défaut
  const elMonthCard = elMonth?.closest('.bal-mini');
  if (elMonthCard) elMonthCard.style.display = '';

  if (type === 'credit') {
    // Crédit : solde total cumulé comme valeur principale
    const allTxs = txs.filter(t => (t.accountId || 'cc') === curAccountId);
    const allExp = allTxs.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
    const allInc = allTxs.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
    const totalBal = getBankBalance(monthKey(new Date()));
    const mainVal  = totalBal !== null ? totalBal : (allInc - allExp);
    if (elLabel) elLabel.textContent = 'Encours crédit';
    elMain.textContent = fmt(Math.abs(mainVal));
    elMain.className   = 'bal-amount neg';
    if (elIncLbl) elIncLbl.textContent = 'Remboursé ce mois';
    if (elExpLbl) elExpLbl.textContent = acc.mensualite ? 'Mensualité' : 'Total remboursé';
    elInc.textContent = fmtShort(mExp);
    elExp.textContent = acc.mensualite ? fmtShort(acc.mensualite) : fmtShort(allExp);
    // 3ème carte : mois restants si mensualité connue, sinon cachée
    if (elMonthCard && acc.mensualite && mainVal > 0) {
      elMonthCard.style.display = '';
      const moisRestants = Math.ceil(Math.abs(mainVal) / acc.mensualite);
      if (elMonthLbl) elMonthLbl.textContent = 'Mois restants';
      elMonth.textContent = moisRestants;
      elMonth.className = 'bal-mini-val';
    } else if (elMonthCard) {
      elMonthCard.style.display = 'none';
    }
  } else if (type === 'savings') {
    // Livret : solde total cumulé comme valeur principale
    const allTxs  = txs.filter(t => (t.accountId || 'cc') === curAccountId);
    const allInc2 = allTxs.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
    const allExp2 = allTxs.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
    const totalBal2 = getBankBalance(monthKey(new Date()));
    const mainVal2  = totalBal2 !== null ? totalBal2 : (allInc2 - allExp2);
    if (elLabel) elLabel.textContent = 'Solde livret';
    elMain.textContent = fmt(mainVal2);
    elMain.className   = 'bal-amount';
    if (elIncLbl) elIncLbl.textContent = 'Versé ce mois';
    if (elExpLbl) elExpLbl.textContent = 'Retiré ce mois';
    elInc.textContent = fmtShort(mInc);
    elExp.textContent = fmtShort(mExp);
    if (elMonthLbl) elMonthLbl.textContent = 'Ce mois';
    elMonth.textContent = (mBal >= 0 ? '+' : '') + fmtShort(mBal);
    elMonth.className   = 'bal-mini-val' + (mBal >= 0 ? ' pos' : ' neg');
  } else {
    // Compte courant (défaut)
    const bankBal = getBankBalance(monthKey(curDate));
    if (viewMode === 'previsionnel') {
      // En prévision : mini-cartes montrent les totaux incluant les prévus
      const allList = getMonthTxs();  // mode previsionnel courant
      const allInc  = allList.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
      const allExp  = allList.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
      const allBal  = allInc - allExp;
      if (elIncLbl) elIncLbl.textContent = 'Revenus';
      if (elExpLbl) elExpLbl.textContent = 'Dépenses';
      elInc.textContent = fmtShort(allInc);
      elExp.textContent = fmtShort(allExp);
      if (elMonthLbl) elMonthLbl.textContent = 'Bilan du mois';
      elMonth.textContent = (allBal >= 0 ? '+' : '') + fmtShort(allBal);
      elMonth.className   = 'bal-mini-val' + (allBal >= 0 ? ' pos' : ' neg');
      // Solde prévu = solde banque réel + transactions prévues restantes
      const projBal = bankBal !== null ? bankBal + (allInc - mInc) - (allExp - mExp) : allBal;
      if (elLabel) elLabel.textContent = 'Solde prévu';
      elMain.textContent = (projBal >= 0 ? '+' : '') + fmt(projBal);
      elMain.className   = 'bal-amount' + (projBal < 0 ? ' neg' : '');
    } else {
      // Mode Réel : mini-cartes en reel uniquement
      if (elIncLbl) elIncLbl.textContent = 'Revenus';
      if (elExpLbl) elExpLbl.textContent = 'Dépenses';
      elInc.textContent = fmtShort(mInc);
      elExp.textContent = fmtShort(mExp);
      if (elMonthLbl) elMonthLbl.textContent = 'Bilan du mois';
      elMonth.textContent = (mBal >= 0 ? '+' : '') + fmtShort(mBal);
      elMonth.className   = 'bal-mini-val' + (mBal >= 0 ? ' pos' : ' neg');
      if (bankBal !== null) {
        if (elLabel) elLabel.textContent = 'Solde banque';
        elMain.textContent = fmt(bankBal);
        elMain.className   = 'bal-amount' + (bankBal < 0 ? ' neg' : '');
      } else {
        if (elLabel) elLabel.textContent = 'Bilan du mois';
        elMain.textContent = (mBal >= 0 ? '+' : '') + fmt(mBal);
        elMain.className   = 'bal-amount' + (mBal < 0 ? ' neg' : '');
      }
    }
  }
}

/* ── RECHERCHE & FILTRES ── */
function onSearch(q) { searchQuery = q.trim().toLowerCase(); renderDash(); }

function toggleFilters() {
  filterOpen = !filterOpen;
  const panel = document.getElementById('flt-panel');
  const btn   = document.getElementById('flt-toggle');
  if (panel) panel.style.display = filterOpen ? 'block' : 'none';
  if (btn) btn.style.borderColor = filterOpen ? 'var(--teal)' : 'var(--border)';
  if (filterOpen) populateFilterCats();
}

function populateFilterCats() {
  const sel = document.getElementById('flt-cat');
  if (!sel) return;
  const cats = [...new Set(getMonthTxs().map(t => t.cat))].sort();
  sel.innerHTML = '<option value="">Toutes catégories</option>' +
    cats.map(id => { const c = catById(id); return `<option value="${id}" ${filterCat===id?'selected':''}>${c.icon} ${c.label}</option>`; }).join('');
}

function setFilterType(t) {
  filterType = t;
  ['all','exp','inc'].forEach(k => {
    const el = document.getElementById('flt-' + k);
    if (el) el.className = 'flt-btn' + (k === (t==='all'?'all':t==='expense'?'exp':'inc') ? ' flt-on' : '');
  });
  renderDash();
}

function setSort(mode) {
  sortMode = mode;
  ['dd','da','ad','aa'].forEach((k,i) => {
    const el = document.getElementById('srt-' + k);
    if (el) el.className = 'srt-btn' + (['date-desc','date-asc','amt-desc','amt-asc'][i]===mode ? ' srt-on' : '');
  });
  renderDash();
}

function applyFilters() {
  filterCat = document.getElementById('flt-cat')?.value || '';
  filterMin = parseFloat(document.getElementById('flt-min')?.value) || null;
  filterMax = parseFloat(document.getElementById('flt-max')?.value) || null;
  renderDash();
}

function resetFilters() {
  filterType = 'all'; filterCat = ''; filterMin = null; filterMax = null; sortMode = 'date-desc';
  const fMin = document.getElementById('flt-min'); if (fMin) fMin.value = '';
  const fMax = document.getElementById('flt-max'); if (fMax) fMax.value = '';
  populateFilterCats();
  setFilterType('all');
  setSort('date-desc');
}

/* ── DONUT 3D ── */
function _darkenHex(hex, f) {
  const n = parseInt(hex.replace('#',''), 16);
  const d = v => Math.max(0, Math.round(v * f)).toString(16).padStart(2,'0');
  return '#' + d((n>>16)&255) + d((n>>8)&255) + d(n&255);
}

function _buildDonut3D(sorted, totalExp) {
  const cx=100, cy=52, Ro=65, Ri=38, ys=0.45, dep=20;
  const px = (r, a)       => (cx + r * Math.cos(a)).toFixed(2);
  const py = (r, a, dy=0) => (cy + r * Math.sin(a) * ys + dy).toFixed(2);
  const A  = (r, a, lg, sw, dy=0) =>
    `A ${r} ${(r*ys).toFixed(2)} 0 ${lg} ${sw} ${px(r,a)} ${py(r,a,dy)}`;

  let ang = -Math.PI / 2;
  const slices = sorted.map(([catId, amt]) => {
    const sweep = amt / totalExp * 2 * Math.PI;
    const s = { catId, sa: ang, ea: ang + sweep, sweep };
    ang += sweep;
    return s;
  });

  let out = '';

  // Ombre portée
  out += `<ellipse cx="${cx}" cy="${(cy + Ro*ys + dep + 8).toFixed(1)}" rx="${Ro+6}" ry="${((Ro+6)*ys*0.35).toFixed(1)}" fill="rgba(0,0,0,0.18)"/>`;

  // Faces du bas (fond de l'anneau visible depuis trou)
  slices.forEach(({catId, sa, ea, sweep}) => {
    const c = catById(catId);
    const lg = sweep > Math.PI ? 1 : 0;
    out += `<path fill="${_darkenHex(c.color,0.55)}" d="M ${px(Ro,sa)} ${py(Ro,sa,dep)} ${A(Ro,ea,lg,1,dep)} L ${px(Ri,ea)} ${py(Ri,ea,dep)} ${A(Ri,sa,lg,0,dep)} Z"/>`;
  });

  // Parois extérieures — tri peintre: dos d'abord, avant en dernier
  [...slices]
    .sort((a,b) => Math.sin((a.sa+a.ea)/2) - Math.sin((b.sa+b.ea)/2))
    .forEach(({catId, sa, ea, sweep}) => {
      if (Math.sin((sa+ea)/2) < -0.08 && sweep < Math.PI) return;
      const c = catById(catId);
      const lg = sweep > Math.PI ? 1 : 0;
      out += `<path fill="${_darkenHex(c.color,0.72)}" onclick="openCatDetail('${catId}')" style="cursor:pointer" d="M ${px(Ro,sa)} ${py(Ro,sa)} ${A(Ro,ea,lg,1)} L ${px(Ro,ea)} ${py(Ro,ea,dep)} ${A(Ro,sa,lg,0,dep)} Z"/>`;
    });

  // Face supérieure (anneau)
  slices.forEach(({catId, sa, ea, sweep}) => {
    const c = catById(catId);
    const lg = sweep > Math.PI ? 1 : 0;
    out += `<path fill="${c.color}" onclick="openCatDetail('${catId}')" style="cursor:pointer" d="M ${px(Ro,sa)} ${py(Ro,sa)} ${A(Ro,ea,lg,1)} L ${px(Ri,ea)} ${py(Ri,ea)} ${A(Ri,sa,lg,0)} Z"/>`;
  });

  return out;
}

/* ── DÉTAIL CATÉGORIE (donut) ── */
function openCatDetail(catId) {
  const c    = catById(catId);
  const list = getMonthTxs().filter(t => t.cat === catId).sort((a,b) => b.date.localeCompare(a.date));
  const total = list.reduce((s,t) => s + (t.type==='expense'?-1:1) * t.amount, 0);
  document.getElementById('cat-detail-title').textContent = c.icon + ' ' + c.label;
  document.getElementById('cat-detail-total').textContent = (total>=0?'+':'') + fmt(total);
  document.getElementById('cat-detail-total').style.color = total >= 0 ? 'var(--green)' : '#c8102e';
  document.getElementById('cat-detail-list').innerHTML = list.map(t => {
    const d = new Date(t.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const descSafe = t.desc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const sign = t.type==='income' ? '+' : '-';
    const col  = t.type==='income' ? 'var(--green)' : '#c8102e';
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${descSafe}</div><div style="font-size:11px;color:var(--text3)">${d}</div></div>
      <div style="font-size:14px;font-weight:600;color:${col};flex-shrink:0;">${sign}${fmt(t.amount)}</div>
    </div>`;
  }).join('');
  document.getElementById('cat-detail-modal').classList.add('open');
}

function closeCatDetail(event) {
  if (!event || event.target === document.getElementById('cat-detail-modal'))
    document.getElementById('cat-detail-modal').classList.remove('open');
}

/* ── DASHBOARD ── */
function renderDash() {
  const monthList = getMonthTxs();
  let list = searchQuery
    ? txs.filter(t => t.desc.toLowerCase().includes(searchQuery) || String(t.amount).includes(searchQuery))
    : monthList;
  if (filterType !== 'all') list = list.filter(t => t.type === filterType);
  if (filterCat)            list = list.filter(t => t.cat === filterCat);
  if (filterMin !== null)   list = list.filter(t => t.amount >= filterMin);
  if (filterMax !== null)   list = list.filter(t => t.amount <= filterMax);
  const inc  = monthList.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
  const exp  = monthList.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  const bal  = inc - exp;
  document.getElementById('qs-inc').textContent = fmtShort(inc);
  document.getElementById('qs-exp').textContent = fmtShort(exp);
  const qb = document.getElementById('qs-bal');
  qb.textContent = (bal >= 0 ? '+' : '') + fmtShort(bal);
  qb.style.color = bal >= 0 ? 'var(--green)' : '#c8102e';

  const pending = getPendingRecs();
  const alertEl = document.getElementById('rec-alert');
  const isFuture = monthKey(curDate) > monthKey(new Date());
  const accType = (accounts.find(a => a.id === curAccountId) || {}).type || 'checking';
  if (pending.length > 0 && isFuture && (accType === 'checking' || accType === 'credit') && !searchQuery) {
    alertEl.style.display = 'block';
    document.getElementById('rec-alert-txt').textContent =
      pending.length + ' dépense' + (pending.length > 1 ? 's' : '') + ' récurrente' + (pending.length > 1 ? 's' : '') + ' à importer';
  } else {
    alertEl.style.display = 'none';
  }

  const sorted = [...list].sort((a, b) => {
    if (sortMode === 'date-asc')  return a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id));
    if (sortMode === 'amt-desc')  return b.amount - a.amount;
    if (sortMode === 'amt-asc')   return a.amount - b.amount;
    return b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id));
  });
  const el = document.getElementById('tx-list');
  if (!sorted.length) {
    const hasFilter = filterType !== 'all' || filterCat || filterMin || filterMax;
    const emptyMsg = (searchQuery || hasFilter) ? 'Aucun résultat' : 'Aucune transaction ce mois';
    el.innerHTML = `<div class="empty"><div class="empty-ico">📂</div><div class="empty-lbl">${emptyMsg}</div></div>`;
    return;
  }
  const isCredit = (accounts.find(a => a.id === curAccountId) || {}).type === 'credit';
  el.innerHTML = sorted.map(t => {
    const c    = catById(t.cat);
    const d    = new Date(t.date + 'T12:00').toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
    // Pour le crédit : tout s'affiche en positif (vert = remboursement)
    const sign = isCredit ? '+' : (t.type === 'income' ? '+' : '-');
    const cls  = isCredit ? 'inc' : (t.type === 'income' ? 'inc' : 'exp');
    const recBadge = t.recurring ? `<span class="badge-rec">🔄</span>` : '';
    const descSafe = t.desc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const tid = `'${t.id}'`;
    if (t.planned) {
      return `<div class="tx-item tx-planned" onclick="openTxModal(${tid})">
        <button class="tx-confirm" onclick="event.stopPropagation();confirmTx(${tid})" title="Confirmer">✓</button>
        <div class="tx-ico" style="background:${c.color}18;opacity:.5">${c.icon}</div>
        <div class="tx-body">
          <div class="tx-desc">${descSafe} <span class="badge-planned">Prévu</span></div>
          <div class="tx-meta">${c.label} · ${d}</div>
        </div>
        <div class="tx-right"><div class="tx-amt ${cls}" style="opacity:.5">${sign}${fmt(t.amount)}</div></div>
        <button class="tx-del" onclick="event.stopPropagation();deleteTx(${tid})">✕</button>
      </div>`;
    }
    return `<div class="tx-item" onclick="openTxModal(${tid})" style="cursor:pointer;">
      <div class="tx-ico" style="background:${c.color}18">${c.icon}</div>
      <div class="tx-body">
        <div class="tx-desc">${descSafe}</div>
        <div class="tx-meta">${c.label} · ${d} ${recBadge}</div>
      </div>
      <div class="tx-right"><div class="tx-amt ${cls}">${sign}${fmt(t.amount)}</div></div>
      <button class="tx-del" onclick="event.stopPropagation();deleteTx(${tid})">✕</button>
    </div>`;
  }).join('');
}

/* ── STATS ── */
function _vsDelta(cur, prev, elId, lessIsBetter) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!prev) { el.textContent = ''; return; }
  const diff = cur - prev;
  const pct  = Math.round(diff / prev * 100);
  const good = lessIsBetter ? diff <= 0 : diff >= 0;
  el.textContent = (diff > 0 ? '+' : '') + pct + '% vs mois préc.';
  el.style.color = good ? 'var(--green)' : '#c8102e';
}

function renderStats() {
  const list = getMonthTxs();
  const inc  = list.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
  const exp  = list.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  const days = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate();

  // Mois précédent pour comparaison
  const prevDate  = new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1);
  const prevList  = getMonthTxs(prevDate);
  const prevInc   = prevList.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
  const prevExp   = prevList.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  const prevDays  = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate();

  document.getElementById('st-inc').textContent = fmtShort(inc);
  document.getElementById('st-exp').textContent = fmtShort(exp);
  document.getElementById('st-nb').textContent  = list.length;
  document.getElementById('st-avg').textContent = fmtShort(exp / days);

  _vsDelta(inc, prevInc, 'vs-inc', false);
  _vsDelta(exp, prevExp, 'vs-exp', true);
  _vsDelta(list.length, prevList.length, 'vs-nb', false);
  _vsDelta(exp / days, prevExp / prevDays, 'vs-avg', true);

  // Donut
  const bycat = {};
  list.filter(_isExpense).forEach(t => { bycat[t.cat] = (bycat[t.cat] || 0) + t.amount; });
  const sorted   = Object.entries(bycat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalExp = sorted.reduce((s, [, v]) => s + v, 0);
  document.getElementById('donut-total').textContent = fmtShort(totalExp);

  const svg    = document.getElementById('donut-svg');
  const legend = document.getElementById('donut-legend');
  if (!sorted.length) {
    svg.innerHTML    = '<ellipse cx="100" cy="52" rx="65" ry="29" fill="none" stroke="#e4e6ea" stroke-width="24"/>';
    legend.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:10px 0">Aucune dépense</div>';
  } else {
    svg.innerHTML = _build3DDonut(sorted, totalExp);
    legend.innerHTML = sorted.map(([catId, amt]) => {
      const c   = catById(catId);
      const pct = Math.round(amt / totalExp * 100);
      return `<div class="legend-item" onclick="openCatDetail('${catId}')" style="cursor:pointer;">
        <div class="legend-dot" style="background:${c.color}"></div>
        <div class="legend-name">${c.icon} ${c.label}</div>
        <div class="legend-pct">${pct}%</div>
        <div class="legend-amt">${fmtShort(amt)}</div>
      </div>`;
    }).join('');
  }

  renderBarChart();

  renderBalanceChart();

  // Barres par catégorie
  const allCats = Object.entries(bycat).sort((a, b) => b[1] - a[1]);
  const maxC    = allCats.length ? allCats[0][1] : 1;
  const cb      = document.getElementById('cat-bars');
  if (!allCats.length) {
    cb.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0">Aucune dépense ce mois</div>';
    return;
  }
  cb.innerHTML = allCats.map(([catId, amt]) => {
    const c   = catById(catId);
    const pct = Math.round(amt / maxC * 100);
    return `<div class="cat-row">
      <div class="cat-top"><div class="cat-name">${c.icon} ${c.label}</div><div class="cat-amt">${fmt(amt)}</div></div>
      <div class="track"><div class="fill" style="width:${pct}%;background:${c.color}"></div></div>
    </div>`;
  }).join('');
}

/* ── GRAPHIQUE SOLDE 12 MOIS ── */
function _chartLbl(v) {
  if (Math.abs(v) >= 1000) return (v >= 0 ? '+' : '') + (v / 1000).toFixed(1).replace('.', ',') + 'k';
  return (v >= 0 ? '+' : '') + Math.round(v);
}

function setBarPeriod(n) {
  barChartPeriod = n;
  document.querySelectorAll('.bar-prd-btn').forEach(b =>
    b.classList.toggle('prd-on', b.dataset.p === String(n))
  );
  renderBarChart();
}

function renderBarChart() {
  const el = document.getElementById('bar-chart');
  if (!el) return;
  const n = barChartPeriod;
  const mos = [];
  for (let i = n-1; i >= 0; i--) mos.push(new Date(curDate.getFullYear(), curDate.getMonth()-i, 1));
  const data = mos.map(d => {
    const l = getMonthTxs(d);
    return {
      label: d.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''),
      inc: l.filter(_isIncome).reduce((s,t)=>s+t.amount,0),
      exp: l.filter(_isExpense).reduce((s,t)=>s+t.amount,0)
    };
  });
  const maxV = Math.max(...data.flatMap(d=>[d.inc,d.exp]), 1);

  const W=320, H=130, ml=8, mr=20, mt=10, mb=24, D=8, dY=5;
  const ch = H-mt-mb-dY;
  const f2 = v => +v.toFixed(2);
  const bw = n <= 3 ? 28 : n <= 6 ? 15 : 9;
  const bGap = 2, gGap = n <= 3 ? 24 : n <= 6 ? 12 : 6;
  const gW = 2*bw + bGap;
  const totalG = n*gW + (n-1)*gGap;
  const startX = ml + (W-ml-mr-D-totalG)/2;
  const gx = i => startX + i*(gW+gGap);
  const by = h => f2(mt+dY+ch-h);
  const barH = v => f2(v/maxV*ch);
  const incC='#10b981', expC='#00857a';

  let s = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;
  [0.5,1].forEach(f => {
    const gy = f2(mt+dY+ch*(1-f));
    s += `<line x1="${ml}" y1="${gy}" x2="${W-mr+D}" y2="${gy}" stroke="#e4e6ea" stroke-width="1" pointer-events="none"/>`;
    s += `<text x="${ml-3}" y="${f2(gy+3.5)}" text-anchor="end" font-size="8" fill="#9ca3af">${_chartLbl(maxV*f)}</text>`;
  });
  data.forEach((d,i) => {
    const gLeft = gx(i);
    [[d.inc,incC,0],[d.exp,expC,bw+bGap]].forEach(([val,fc,ox]) => {
      if (!val) return;
      const h=barH(val), x=f2(gLeft+ox), yT=by(h), yB=f2(mt+dY+ch);
      const sc=_hexDarken(fc,0.58), tc=_hexDarken(fc,0.78);
      s += `<rect x="${x}" y="${yT}" width="${bw}" height="${f2(yB-yT)}" fill="${fc}"/>`;
      s += `<polygon points="${f2(x+bw)},${yT} ${f2(x+bw+D)},${f2(yT-dY)} ${f2(x+bw+D)},${f2(yB-dY)} ${f2(x+bw)},${yB}" fill="${sc}"/>`;
      s += `<polygon points="${x},${yT} ${f2(x+bw)},${yT} ${f2(x+bw+D)},${f2(yT-dY)} ${f2(x+D)},${f2(yT-dY)}" fill="${tc}"/>`;
    });
    s += `<text x="${f2(gLeft+gW/2)}" y="${H-4}" text-anchor="middle" font-size="${n>9?8:9}" fill="#9ca3af">${d.label}</text>`;
  });
  s += '</svg>';
  el.innerHTML = s;
}

function setBalPeriod(n) {
  balChartPeriod = n;
  document.querySelectorAll('.prd-btn').forEach(b =>
    b.classList.toggle('prd-on', b.dataset.p === String(n))
  );
  renderBalanceChart();
}

function renderBalanceChart() {
  const el = document.getElementById('balance-chart');
  if (!el) return;

  const n = balChartPeriod;
  const months = [];
  for (let i = n - 1; i >= 0; i--) months.push(new Date(curDate.getFullYear(), curDate.getMonth() - i, 1));

  const data = months.map(d => {
    const l = getMonthTxs(d);
    const inc = l.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
    const exp = l.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
    return { label: d.toLocaleDateString('fr-FR', {month: 'short'}).replace('.',''), balance: inc - exp };
  });

  const vals = data.map(d => d.balance);
  const minVal = Math.min(...vals, 0);
  const maxVal = Math.max(...vals, 0);
  const range  = maxVal - minVal || 1;

  const W=320, H=165, ml=44, mr=16, mt=22, mb=28, D=10, dY=6;
  const cw = W - ml - mr - D;
  const ch = H - mt - mb - dY;
  const gap = n > 6 ? 3 : 5;
  const bw  = (cw - gap * (n - 1)) / n;
  const bx  = i => ml + i * (bw + gap);
  const by  = v => mt + dY + ch - ((v - minVal) / range) * ch;
  const zy  = by(0);

  const posC = '#00857a', negC = '#c8102e';
  const f2   = v => +v.toFixed(2);

  let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;

  // Lignes de référence
  const refs = minVal < 0 && maxVal > 0 ? [minVal, 0, maxVal] : [minVal, minVal + range/2, maxVal];
  refs.forEach(v => {
    const gy = f2(by(v));
    const isZ = v === 0;
    svg += `<line x1="${ml}" y1="${gy}" x2="${W-mr+D}" y2="${gy}" stroke="#e4e6ea" stroke-width="${isZ?1.5:1}" ${isZ?'stroke-dasharray="4,3"':''} pointer-events="none"/>`;
    svg += `<text x="${ml-4}" y="${f2(gy+3.5)}" text-anchor="end" font-size="9" fill="#9ca3af">${_chartLbl(v)}</text>`;
  });

  // Barres 3D
  data.forEach((d, i) => {
    const x    = f2(bx(i));
    const isPos = d.balance >= 0;
    const fc   = isPos ? posC : negC;
    const sc   = _hexDarken(fc, 0.58);
    const tc   = _hexDarken(fc, 0.78);
    const yTop = f2(isPos ? by(d.balance) : zy);
    const yBot = f2(isPos ? zy : by(d.balance));
    const bh   = f2(yBot - yTop);

    // Front face
    svg += `<rect x="${x}" y="${yTop}" width="${f2(bw)}" height="${bh}" fill="${fc}"/>`;
    // Right side face
    svg += `<polygon points="${f2(x+bw)},${yTop} ${f2(x+bw+D)},${f2(yTop-dY)} ${f2(x+bw+D)},${f2(yBot-dY)} ${f2(x+bw)},${yBot}" fill="${sc}"/>`;
    // Top cap (positive) or bottom cap (negative)
    if (isPos) {
      svg += `<polygon points="${x},${yTop} ${f2(x+bw)},${yTop} ${f2(x+bw+D)},${f2(yTop-dY)} ${f2(x+D)},${f2(yTop-dY)}" fill="${tc}"/>`;
    } else {
      svg += `<polygon points="${x},${yBot} ${f2(x+bw)},${yBot} ${f2(x+bw+D)},${f2(yBot-dY)} ${f2(x+D)},${f2(yBot-dY)}" fill="${tc}"/>`;
    }

    // Label mois
    if (n <= 6 || i % 2 === 0 || i === n - 1) {
      svg += `<text x="${f2(x + bw/2)}" y="${H-4}" text-anchor="middle" font-size="${n>9?8:9}" fill="#9ca3af">${d.label}</text>`;
    }
  });

  svg += '</svg>';
  el.innerHTML = svg;
}

/* ── RÉCURRENTS ── */
function renderRecs() {
  const el      = document.getElementById('rec-list');
  if (!el) return;
  if (!recs.length) {
    el.innerHTML = `<div class="empty"><div class="empty-ico">🔄</div><div class="empty-lbl">Aucune dépense récurrente configurée</div></div>`;
    return;
  }
  const pending = getPendingRecs();
  const mk      = monthKey(curDate);
  const isFuture = mk > monthKey(new Date());
  el.innerHTML  = recs.map(r => {
    const c             = catById(r.cat);
    const cls           = r.type === 'income' ? 'inc' : 'exp';
    const sign          = r.type === 'income' ? '+' : '-';
    const isPending     = pending.some(p => p.id === r.id);
    const alreadyApplied = txs.some(t => t.cat === r.cat && t.desc === r.desc && t.date.startsWith(mk) && t.recurring);
    const descSafe      = r.desc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="rec-item">
      <div class="rec-ico" style="background:${c.color}18">${c.icon}</div>
      <div class="rec-body">
        <div class="rec-desc">${descSafe}</div>
        <div class="rec-meta">${c.label}</div>
        ${isPending && isFuture ? `<button class="rec-apply-btn" onclick="applyOneRec(${r.id})">Importer ce mois</button>` : ''}
        ${alreadyApplied ? `<span style="font-size:11px;color:var(--green);font-weight:600;">✓ Importé ce mois</span>` : ''}
      </div>
      <div class="rec-right">
        <div class="rec-amt ${cls}">${sign}${fmt(r.amount)}</div>
        <div class="rec-day">Jour ${r.day}</div>
      </div>
      <button class="rec-edit-btn" onclick="openEditModal(${r.id})" title="Modifier">✏️</button>
      <button class="rec-del" onclick="deleteRec(${r.id})">✕</button>
    </div>`;
  }).join('');
}

/* ── ANALYSE ── */
function renderAnalyse() {
  const list = getMonthTxs();
  const inc  = list.filter(_isIncome).reduce((s, t) => s + t.amount, 0);
  const exp  = list.filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  const savings     = inc - exp;
  const savingsRate = inc > 0 ? Math.round(savings / inc * 100) : 0;
  const days        = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate();

  // KPIs
  const kpisEl = document.getElementById('analyse-kpis');
  if (kpisEl) {
    const rateColor = savingsRate >= 20 ? 'var(--green)' : savingsRate >= 0 ? 'var(--orange)' : '#c8102e';
    kpisEl.innerHTML = `
      <div class="kpi"><div class="kpi-val" style="color:${rateColor}">${savingsRate}%</div><div class="kpi-lbl">Taux d'épargne</div></div>
      <div class="kpi"><div class="kpi-val" style="color:var(--teal)">${fmtShort(exp/days)}</div><div class="kpi-lbl">Dépenses/jour</div></div>
      <div class="kpi"><div class="kpi-val" style="color:var(--green)">${fmtShort(inc)}</div><div class="kpi-lbl">Revenus ce mois</div></div>
      <div class="kpi"><div class="kpi-val" style="color:${savings>=0?'var(--green)':'#c8102e'}">${savings>=0?'+':''}${fmtShort(savings)}</div><div class="kpi-lbl">Bilan mensuel</div></div>
    `;
  }

  // Conseils automatiques
  const bycat   = {};
  list.filter(_isExpense).forEach(t => { bycat[t.cat] = (bycat[t.cat] || 0) + t.amount; });
  const conseils = [];
  if (inc === 0) {
    conseils.push({ico:'📥', bg:'var(--blue-bg)', title:'Aucun revenu ce mois', text:'Ajoutez vos revenus pour obtenir une analyse complète.'});
  } else {
    if (savings < 0)      conseils.push({ico:'🚨', bg:'#fff0f0', title:'Dépenses > Revenus', text:`Vous dépensez ${fmtShort(Math.abs(savings))} de plus que vous ne gagnez. Réduisez vos dépenses variables.`});
    if (savingsRate >= 20) conseils.push({ico:'✅', bg:'var(--green-bg)', title:'Excellent taux d\'épargne', text:`${savingsRate}% de vos revenus sont épargnés. Continuez ainsi !`});
    else if (savingsRate >= 0 && savings >= 0) conseils.push({ico:'⚠️', bg:'var(--orange-bg)', title:'Épargne à améliorer', text:`Taux d'épargne : ${savingsRate}%. L'objectif recommandé est 20% minimum.`});

    const resto = (bycat['restaurant']||0) + (bycat['livraison']||0) + (bycat['cafe']||0);
    if (resto > 200) conseils.push({ico:'🍽️', bg:'var(--orange-bg)', title:'Restauration élevée', text:`${fmtShort(resto)} en restauration ce mois. Cuisiner davantage pourrait économiser ${fmtShort(resto*0.5)}/mois.`});

    const streaming = bycat['streaming'] || 0;
    if (streaming > 50) conseils.push({ico:'📺', bg:'var(--blue-bg)', title:'Abonnements streaming', text:`${fmtShort(streaming)}/mois en streaming. Vérifiez si tous vos abonnements sont utilisés.`});

    const courses = bycat['courses'] || 0;
    if (courses > 0 && courses / exp > 0.3) conseils.push({ico:'🛒', bg:'var(--green-bg)', title:'Courses bien maîtrisées', text:`Les courses représentent ${Math.round(courses/exp*100)}% de vos dépenses — dans la norme.`});
  }
  if (!conseils.length) conseils.push({ico:'👍', bg:'var(--green-bg)', title:'Tout va bien', text:'Aucune anomalie détectée dans vos dépenses ce mois.'});

  const consEl = document.getElementById('conseils-list');
  if (consEl) {
    consEl.innerHTML = conseils.map(c => `
      <div class="conseil-item" style="background:${c.bg}">
        <div class="conseil-ico">${c.ico}</div>
        <div class="conseil-body"><div class="c-title">${c.title}</div><div class="c-text">${c.text}</div></div>
      </div>`).join('');
  }

  // Objectifs + Budget + Catégories + Solde ref
  renderGoals();
  renderBudget();
  renderRule(inc, exp, bycat);
  renderCatManager();
  renderBalRefDisplay();
}

/* ── BUDGET ── */
function saveBudget() {
  const val = parseFloat(document.getElementById('inp-bgt').value);
  if (!val || val <= 0) return toast('⚠ Montant invalide');
  budget = val;
  saveAll();
  renderBudget();
  toast('✓ Budget défini : ' + fmt(budget));
}

function renderBudget() {
  const bgtDisplay = document.getElementById('bgt-display');
  if (!bgtDisplay) return;
  if (budget <= 0) { bgtDisplay.style.display = 'none'; return; }
  const exp = getMonthTxs().filter(_isExpense).reduce((s, t) => s + t.amount, 0);
  const remaining = budget - exp;
  const pct = Math.min(Math.round(exp / budget * 100), 100);
  bgtDisplay.style.display = 'block';
  const remEl = document.getElementById('bgt-rem');
  remEl.textContent = fmt(remaining);
  remEl.style.color = remaining >= 0 ? 'var(--green)' : '#c8102e';
  document.getElementById('bgt-sub').textContent = `${fmt(exp)} dépensé sur ${fmt(budget)}`;
  const bar = document.getElementById('bgt-bar');
  bar.style.width      = pct + '%';
  bar.style.background = pct < 70 ? 'var(--green)' : pct < 90 ? 'var(--orange)' : '#c8102e';
  document.getElementById('bgt-pct').textContent = pct + '%';
}

/* ── RÈGLE 50/30/20 ── */
function renderRule(inc, exp, bycat) {
  const ruleCard = document.getElementById('rule-card');
  if (!ruleCard) return;
  if (inc <= 0) { ruleCard.style.display = 'none'; return; }
  ruleCard.style.display = 'block';
  const fixedCats   = ['loyer','energie','telephone','credit_immo','credit_conso','assurance_hab','assurance_auto','assurance_vie','mutuelle','impots','frais_bancaires','epargne_dep'];
  const loisirCats  = ['streaming','cinema','sport_loisir','livre','jeux','voyage','hotel','restaurant','livraison','cafe','vetements','beaute','high_tech','amazon'];
  const fixed   = fixedCats.reduce((s, id) => s + (bycat[id] || 0), 0);
  const loisirs = loisirCats.reduce((s, id) => s + (bycat[id] || 0), 0);
  const epargne = Math.max(0, inc - exp);
  const rows = [
    {name:'Charges fixes (50%)', val:fixed,   target:inc*0.5, color:'var(--blue)'},
    {name:'Loisirs (30%)',       val:loisirs,  target:inc*0.3, color:'var(--orange)'},
    {name:'Épargne (20%)',       val:epargne,  target:inc*0.2, color:'var(--green)'},
  ];
  document.getElementById('rule-bars').innerHTML = rows.map(r => {
    const p = r.target > 0 ? Math.min(Math.round(r.val / r.target * 100), 100) : 0;
    return `<div class="rule-row">
      <div class="rule-top"><div class="rule-name">${r.name}</div><div class="rule-vals">${fmtShort(r.val)} / ${fmtShort(r.target)}</div></div>
      <div class="track"><div class="fill" style="width:${p}%;background:${r.color}"></div></div>
    </div>`;
  }).join('');
}

/* ── OBJECTIFS ── */
function renderGoals() {
  const el = document.getElementById('goals-list');
  if (!el) return;
  const totalSavings = txs.filter(_isIncome).reduce((s,t)=>s+t.amount,0)
                     - txs.filter(_isExpense).reduce((s,t)=>s+t.amount,0);
  const mInc = getMonthTxs().filter(_isIncome).reduce((s,t)=>s+t.amount,0);
  const mExp = getMonthTxs().filter(_isExpense).reduce((s,t)=>s+t.amount,0);
  const monthly = mInc - mExp;
  if (!goals.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:8px 0">Aucun objectif défini</div>';
    return;
  }
  el.innerHTML = goals.map(g => {
    const saved    = Math.max(0, totalSavings);
    const pct      = Math.min(Math.round(saved / g.amount * 100), 100);
    const remain   = Math.max(0, g.amount - saved);
    const eta      = monthly > 0 && remain > 0 ? Math.ceil(remain / monthly) : null;
    return `<div class="goal-item">
      <div class="goal-top">
        <div><div class="goal-name">${g.name}</div><div class="goal-sub">${fmtShort(saved)} / ${fmtShort(g.amount)}</div></div>
        <button class="goal-del" onclick="deleteGoal(${g.id})">✕</button>
      </div>
      <div class="track"><div class="fill" style="width:${pct}%;background:var(--teal)"></div></div>
      ${eta ? `<div class="goal-eta">Atteint dans ~${eta} mois au rythme actuel</div>` : pct>=100 ? `<div class="goal-eta" style="color:var(--green)">✓ Objectif atteint !</div>` : ''}
    </div>`;
  }).join('');
}

function addGoal() {
  const name   = document.getElementById('goal-name').value.trim();
  const amount = parseFloat(document.getElementById('goal-amt').value);
  if (!name || !amount || amount <= 0) return toast('⚠ Remplissez tous les champs');
  goals.push({id: Date.now(), name, amount});
  saveAll();
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-amt').value  = '';
  renderGoals();
  toast('✓ Objectif ajouté');
}

function deleteGoal(id) {
  if (!confirm('Supprimer cet objectif ?')) return;
  goals = goals.filter(g => g.id !== id);
  saveAll();
  renderGoals();
}

/* ── CATÉGORIES PERSONNALISÉES ── */
function saveCustomCats() {
  localStorage.setItem('mc4_cats', JSON.stringify(customCats));
}

function setNewCatType(type) {
  newCatType = type;
  const btnExp = document.getElementById('newcat-btn-exp');
  const btnInc = document.getElementById('newcat-btn-inc');
  if (!btnExp || !btnInc) return;
  if (type === 'expense') {
    btnExp.style.cssText = 'flex:1;padding:8px;border-radius:8px;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;font-size:12px;font-weight:600;cursor:pointer;';
    btnInc.style.cssText = 'flex:1;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;';
  } else {
    btnInc.style.cssText = 'flex:1;padding:8px;border-radius:8px;border:2px solid var(--green);background:#f0fff4;color:var(--green);font-size:12px;font-weight:600;cursor:pointer;';
    btnExp.style.cssText = 'flex:1;padding:8px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;';
  }
}

function addCustomCat() {
  const icon  = document.getElementById('newcat-icon').value.trim() || '📌';
  const label = document.getElementById('newcat-label').value.trim();
  const color = document.getElementById('newcat-color').value;
  const group = document.getElementById('newcat-group').value.trim() || 'Personnalisé';
  if (!label) return toast('⚠ Nom de catégorie requis');
  customCats.push({id: 'custom_' + Date.now(), type: newCatType, group, label, icon, color, custom: true});
  saveCustomCats();
  document.getElementById('newcat-icon').value  = '';
  document.getElementById('newcat-label').value = '';
  document.getElementById('newcat-group').value = '';
  renderCatManager();
  populateCats();
  toast('✓ Catégorie ajoutée');
}

function deleteCustomCat(id) {
  const inUse = txs.some(t => t.cat === id) || recs.some(r => r.cat === id);
  if (inUse && !confirm('Cette catégorie est utilisée. Supprimer quand même ?')) return;
  customCats = customCats.filter(c => c.id !== id);
  saveCustomCats();
  renderCatManager();
  populateCats();
  toast('✓ Catégorie supprimée');
}

function renderCatManager() {
  const el = document.getElementById('custom-cats-list');
  if (!el) return;
  if (!customCats.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:8px 0">Aucune catégorie personnalisée</div>';
    return;
  }
  el.innerHTML = customCats.map(c => {
    const typeCol = c.type === 'expense' ? '#c8102e' : 'var(--green)';
    const typeLbl = c.type === 'expense' ? 'Dépense' : 'Revenu';
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="width:36px;height:36px;border-radius:10px;background:${c.color}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${c.icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.label}</div>
        <div style="font-size:11px;color:var(--text3)">${c.group} · <span style="color:${typeCol}">${typeLbl}</span></div>
      </div>
      <button onclick="deleteCustomCat('${c.id}')" style="background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;padding:4px 8px;flex-shrink:0;">✕</button>
    </div>`;
  }).join('');
}

/* ── EXPORT ── */
function exportJSON() {
  const data = JSON.stringify({txs, recs, budget, goals, customCats, accounts, balanceRef, exported: new Date().toISOString()}, null, 2);
  _download('moncarnetcompte_export_' + todayStr() + '.json', data, 'application/json');
  toast('✓ Export JSON téléchargé');
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const d = JSON.parse(text);
      if (!d.txs) { toast('Fichier invalide'); return; }
      if (!confirm(`Restaurer ${d.txs.length} transactions et ${(d.recs||[]).length} récurrents ?\n\nLes données actuelles seront remplacées.`)) return;
      txs       = d.txs    || [];
      recs      = d.recs   || [];
      budget    = d.budget || 0;
      goals     = d.goals  || [];
      if (d.customCats)  { customCats  = d.customCats;  localStorage.setItem('mc4_cats',    JSON.stringify(customCats)); }
      if (d.accounts)    { accounts    = d.accounts;    localStorage.setItem('mc4_accounts', JSON.stringify(accounts)); }
      if (d.balanceRef)  { balanceRef  = d.balanceRef;  localStorage.setItem('mc4_balref',   JSON.stringify(balanceRef)); }
      saveAll();
      renderAll();
      toast(`✓ ${txs.length} transactions restaurées`);
    } catch(err) { toast('Erreur lecture fichier'); }
  };
  input.click();
}

function exportCSV() {
  const header = 'Date,Type,Catégorie,Description,Montant\n';
  const rows   = txs.map(t => {
    const c = catById(t.cat);
    const desc = t.desc.replace(/"/g, '""');
    return `${t.date},${t.type==='income'?'Revenu':'Dépense'},"${c.label}","${desc}",${t.type==='income'?'+':'−'}${t.amount.toFixed(2)}`;
  }).join('\n');
  _download('moncarnetcompte_' + todayStr() + '.csv', '\uFEFF' + header + rows, 'text/csv');
  toast('✓ Export CSV téléchargé');
}

function _download(filename, content, type) {
  const blob = new Blob([content], {type});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── CAMEMBERT 3D ── */
function _hexDarken(hex, factor) {
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;
}

function _build3DDonut(sorted, totalExp) {
  const CX = 100, CY = 64;
  const R  = 62,  ri = 36;
  const RY = 0.44;
  const D  = 22;

  const P  = (a, rad, dy=0) => [+(CX+rad*Math.cos(a)).toFixed(2), +(CY+rad*RY*Math.sin(a)+dy).toFixed(2)];
  const f2 = v => +v.toFixed(2);

  let startAngle = -Math.PI / 2;
  const segs = sorted.map(([catId, amt]) => {
    const span = amt / totalExp * 2 * Math.PI;
    const seg  = { catId, c: catById(catId), a0: startAngle, a1: startAngle + span, span };
    startAngle += span;
    return seg;
  });

  let out = '';

  // Ombre portée
  out += `<ellipse cx="${CX}" cy="${f2(CY+R*RY+D+8)}" rx="${f2(R*0.86)}" ry="${f2(R*RY*0.44)}" fill="rgba(0,0,0,0.18)" pointer-events="none"/>`;

  // Parois extérieures — face avant [0, π]
  for (const { catId, c, a0, a1 } of segs) {
    const vA0 = Math.max(a0, 0), vA1 = Math.min(a1, Math.PI);
    if (vA1 <= vA0) continue;
    const [x0,y0]=P(vA0,R,0), [x1,y1]=P(vA1,R,0);
    const [x0b,y0b]=P(vA0,R,D), [x1b,y1b]=P(vA1,R,D);
    const rY=f2(R*RY), lg=(vA1-vA0)>Math.PI?1:0;
    out += `<path d="M${x0},${y0} A${R},${rY} 0 ${lg},1 ${x1},${y1} L${x1b},${y1b} A${R},${rY} 0 ${lg},0 ${x0b},${y0b} Z" fill="${_hexDarken(c.color,0.50)}" onclick="openCatDetail('${catId}')" style="cursor:pointer"/>`;
  }

  // Parois intérieures (trou) — face avant
  for (const { catId, c, a0, a1 } of segs) {
    const vA0 = Math.max(a0, 0), vA1 = Math.min(a1, Math.PI);
    if (vA1 <= vA0) continue;
    const [x0,y0]=P(vA0,ri,0), [x1,y1]=P(vA1,ri,0);
    const [x0b,y0b]=P(vA0,ri,D), [x1b,y1b]=P(vA1,ri,D);
    const riY=f2(ri*RY), lg=(vA1-vA0)>Math.PI?1:0;
    out += `<path d="M${x0},${y0} A${ri},${riY} 0 ${lg},1 ${x1},${y1} L${x1b},${y1b} A${ri},${riY} 0 ${lg},0 ${x0b},${y0b} Z" fill="${_hexDarken(c.color,0.35)}" onclick="openCatDetail('${catId}')" style="cursor:pointer"/>`;
  }

  // Faces supérieures
  for (const { catId, c, a0, a1, span } of segs) {
    const [ox0,oy0]=P(a0,R), [ox1,oy1]=P(a1,R);
    const [ix0,iy0]=P(a0,ri), [ix1,iy1]=P(a1,ri);
    const rY=f2(R*RY), riY=f2(ri*RY), lg=span>Math.PI?1:0;
    out += `<path d="M${ox0},${oy0} A${R},${rY} 0 ${lg},1 ${ox1},${oy1} L${ix1},${iy1} A${ri},${riY} 0 ${lg},0 ${ix0},${iy0} Z" fill="${c.color}" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" onclick="openCatDetail('${catId}')" style="cursor:pointer"/>`;
  }

  // Reflet lumineux (pointer-events:none = ne bloque pas les clics)
  const hR=(R+ri)/2;
  out += `<ellipse cx="${CX}" cy="${CY}" rx="${f2(hR)}" ry="${f2(hR*RY)}" fill="none" stroke="rgba(255,255,255,0.11)" stroke-width="${R-ri-3}" pointer-events="none"/>`;
  out += `<path d="M${f2(CX-R*0.52)},${f2(CY-R*RY*0.82)} A${f2(R*0.72)},${f2(R*RY*0.72)} 0 0,1 ${f2(CX+R*0.28)},${f2(CY-R*RY*0.9)}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="${f2((R-ri)*0.42)}" stroke-linecap="round" pointer-events="none"/>`;

  return out;
}

/* ── RESET ── */
function clearCurrentAccountTxs() {
  const acc = accounts.find(a => a.id === curAccountId) || {name: curAccountId};
  if (!confirm(`Supprimer TOUTES les transactions de "${acc.name}" ?\n\nLes autres comptes ne sont pas touchés.`)) return;
  if (!confirm(`⚠ DERNIÈRE CONFIRMATION\n\nToutes les transactions de "${acc.name}" seront effacées définitivement.\n\nContinuer ?`)) return;
  txs = txs.filter(t => (t.accountId || 'cc') !== curAccountId);
  saveAll();
  renderAll();
  toast(`✓ Transactions "${acc.name}" supprimées`);
}

function resetAll() {
  if (!confirm('⚠ ATTENTION\n\nSuppression DÉFINITIVE de toutes les données.\n\nÊtes-vous sûr ?')) return;
  if (!confirm('⚠ DERNIÈRE CONFIRMATION\n\nTOUTES les données de TOUS les comptes seront effacées.\n\nContinuer ?')) return;
  txs = []; recs = []; budget = 0; goals = [];
  saveAll();
  document.getElementById('inp-bgt').value = '';
  renderAll();
  toast('✓ Données supprimées');
}

/* ── IMPORT CIC ── */
function handleDrop(event) {
  event.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) _parseCicFile(file);
}
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) _parseCicFile(file);
}
function _parseCicFile(file) {
  const reader = new FileReader();
  if (file.name.endsWith('.json')) {
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        // Format export natif MonCarnetCompte : { txs, recs, budget, goals }
        if (data.txs && Array.isArray(data.txs)) {
          const newTxs = data.txs.filter(t => !txs.find(x => x.id === t.id));
          txs = [...txs, ...newTxs];
          if (data.recs && data.recs.length) recs = [...recs, ...data.recs.filter(r => !recs.find(x => x.id === r.id))];
          if (data.budget && !budget) budget = data.budget;
          if (data.goals && data.goals.length) goals = [...goals, ...data.goals.filter(g => !goals.find(x => x.id === g.id))];
          saveAll();
          renderAll();
          toast(`✓ ${newTxs.length} transactions importées`);
        } else {
          toast('⚠ Format JSON non reconnu');
        }
      } catch { toast('⚠ Erreur lecture JSON'); }
    };
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.onload = e => {
      try { cicData = _parseCicCSV(e.target.result); _renderCicResults(); }
      catch { toast('⚠ Erreur lecture fichier'); }
    };
    reader.readAsText(file, 'ISO-8859-1');
  }
}
function _parseCicCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  let hi = lines.findIndex(l => l.toLowerCase().includes('montant'));
  if (hi === -1) hi = 0;
  const sep  = lines[hi].includes(';') ? ';' : ',';
  const hdrs = lines[hi].split(sep).map(h => h.trim().replace(/"/g,'').toLowerCase());
  const di   = hdrs.findIndex(h => h.includes('opérat')||h.includes('operat')||h==='date');
  const ai   = hdrs.findIndex(h => h.includes('montant'));
  const li   = hdrs.findIndex(h => h.includes('libellé')||h.includes('libelle'));
  const result = [];
  for (let i = hi + 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g,''));
    if (cols.length < 3) continue;
    const [d, m, y] = (cols[di]||'').split('/');
    if (!d||!m||!y) continue;
    const amount = parseFloat((cols[ai]||'').replace(',','.').replace(/\s/g,''));
    if (isNaN(amount)) continue;
    result.push({date:`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`, amount, label: cols[li]||cols[2]||''});
  }
  return result;
}
function _renderCicResults() {
  if (!cicData.length) { toast('⚠ Aucune donnée trouvée'); return; }
  cicData = cicData.map(r => {
    const existing = txs.find(t => t.date === r.date && Math.abs(t.amount - Math.abs(r.amount)) < 0.01);
    return {...r, status: existing ? 'ok' : 'new'};
  });
  document.getElementById('cic-results').style.display = 'block';
  document.getElementById('cic-nb').textContent    = cicData.length;
  document.getElementById('cic-diffs').textContent = cicData.filter(r=>r.status==='diff').length;
  _renderCicList();
}
function setCicTab(tab) {
  cicTab = tab;
  ['all','diff','ok','new'].forEach(t => document.getElementById('ctab-'+t).classList.toggle('active', t===tab));
  _renderCicList();
}
function _renderCicList() {
  const rows = cicTab === 'all' ? cicData : cicData.filter(r => r.status === cicTab);
  const el   = document.getElementById('cic-list');
  if (!rows.length) { el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3)">Aucune ligne</div>'; return; }
  el.innerHTML = rows.map((r, i) => {
    const icon = r.status==='ok'?'✓':r.status==='new'?'+':'⚠';
    const bg   = r.status==='ok'?'var(--green-bg)':r.status==='new'?'var(--teal-light)':'var(--orange-bg)';
    const col  = r.status==='ok'?'var(--green)':r.status==='new'?'var(--teal)':'var(--orange)';
    const d    = new Date(r.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const cls  = r.amount >= 0 ? 'pos' : 'neg';
    const lbl  = r.label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="cic-row"><div class="cic-row-main">
      <div class="cic-row-status" style="background:${bg};color:${col}">${icon}</div>
      <div class="cic-row-body"><div class="cic-row-label">${lbl}</div><div class="cic-row-date">${d}</div></div>
      <div class="cic-row-amt ${cls}">${r.amount>=0?'+':''}${fmt(Math.abs(r.amount))}</div>
      ${r.status==='new'?`<button class="cic-import-btn" onclick="importOneRow(${i})">Importer</button>`:''}
    </div></div>`;
  }).join('');
}
function _importType(amount) {
  const isCredit = accounts.find(a => a.id === curAccountId)?.type === 'credit';
  const positive = amount >= 0;
  // Pour un crédit : paiement (+) = dépense, nouveau crédit (-) = revenu
  return (isCredit ? !positive : positive) ? 'income' : 'expense';
}
function importOneRow(idx) {
  const r = cicData.find((_, i) => i === idx);
  if (!r) return;
  const type = _importType(r.amount);
  txs.push({id:Date.now(), type, amount:Math.abs(r.amount), desc:r.label, cat:type==='income'?'autre_rev':'autre_dep', date:r.date, accountId:curAccountId, recurring:false});
  r.status = 'ok';
  saveAll(); _renderCicList(); toast('✓ Transaction importée');
}
function importAllNew() {
  const newRows = cicData.filter(r => r.status === 'new');
  newRows.forEach(r => {
    const type = _importType(r.amount);
    txs.push({id:Date.now()+Math.random(), type, amount:Math.abs(r.amount), desc:r.label, cat:type==='income'?'autre_rev':'autre_dep', date:r.date, accountId:curAccountId, recurring:false});
    r.status = 'ok';
  });
  saveAll(); _renderCicList(); toast(`✓ ${newRows.length} transaction(s) importée(s)`);
}
function clearCicImport() {
  cicData = [];
  document.getElementById('cic-results').style.display = 'none';
  document.getElementById('csv-file').value = '';
}

/* ── MODAL MODIFIER RÉCURRENTE ── */
function openEditModal(id) {
  const r = _findRec(id);
  if (!r) return;
  document.getElementById('edit-id').value   = id;
  document.getElementById('edit-desc').value = r.desc;
  document.getElementById('edit-amt').value  = r.amount;
  document.getElementById('edit-day').value  = r.day;
  const sel    = document.getElementById('edit-cat');
  sel.innerHTML = '';
  const allCats = r.type === 'expense'
    ? [...CATS_EXP, ...customCats.filter(c => c.type === 'expense')]
    : [...CATS_INC, ...customCats.filter(c => c.type === 'income')];
  const groups  = {};
  allCats.forEach(c => { if (!groups[c.group]) groups[c.group]=[]; groups[c.group].push(c); });
  Object.entries(groups).forEach(([g, cats]) => {
    const og = document.createElement('optgroup'); og.label = '── '+g;
    cats.forEach(c => { const o=document.createElement('option'); o.value=c.id; o.textContent=c.icon+' '+c.label; og.appendChild(o); });
    sel.appendChild(og);
  });
  sel.value = r.cat;
  document.getElementById('edit-modal').classList.add('open');
}
function closeEditModal(event) {
  if (!event || event.target === document.getElementById('edit-modal')) {
    document.getElementById('edit-modal').classList.remove('open');
  }
}
function saveEditRec() {
  const id   = document.getElementById('edit-id').value;
  const desc = document.getElementById('edit-desc').value.trim();
  const amt  = parseFloat(document.getElementById('edit-amt').value);
  const day  = Math.min(Math.max(1, parseInt(document.getElementById('edit-day').value)||1), 28);
  const cat  = document.getElementById('edit-cat').value;
  if (!desc || !amt || amt <= 0) return toast('⚠ Données invalides');
  const r = _findRec(id);
  if (!r) return;
  Object.assign(r, {desc, amount:amt, day, cat});
  saveAll(); closeEditModal(); renderRecs(); toast('✓ Récurrente modifiée');
}

/* ── MODAL ÉDITION TRANSACTION ── */
let _txModalType = 'expense';

function setTxModalType(type) {
  _txModalType = type;
  const btnExp = document.getElementById('tx-edit-btn-exp');
  const btnInc = document.getElementById('tx-edit-btn-inc');
  if (type === 'expense') {
    btnExp.style.cssText = 'flex:1;padding:10px;border-radius:8px;border:2px solid #c8102e;background:#fff0f0;color:#c8102e;font-weight:600;cursor:pointer;';
    btnInc.style.cssText = 'flex:1;padding:10px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text2);font-weight:600;cursor:pointer;';
  } else {
    btnInc.style.cssText = 'flex:1;padding:10px;border-radius:8px;border:2px solid var(--green);background:#f0fff4;color:var(--green);font-weight:600;cursor:pointer;';
    btnExp.style.cssText = 'flex:1;padding:10px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text2);font-weight:600;cursor:pointer;';
  }
  _populateTxModalCats();
}

function _populateTxModalCats(currentCat) {
  const sel = document.getElementById('tx-edit-cat');
  const prev = currentCat || sel.value;
  sel.innerHTML = '';
  const cats = _txModalType === 'expense'
    ? [...CATS_EXP, ...customCats.filter(c => c.type === 'expense')]
    : [...CATS_INC, ...customCats.filter(c => c.type === 'income')];
  const groups = {};
  cats.forEach(c => { if (!groups[c.group]) groups[c.group]=[]; groups[c.group].push(c); });
  Object.entries(groups).forEach(([g, cats]) => {
    const og = document.createElement('optgroup'); og.label = '── '+g;
    cats.forEach(c => { const o=document.createElement('option'); o.value=c.id; o.textContent=c.icon+' '+c.label; og.appendChild(o); });
    sel.appendChild(og);
  });
  if (prev) sel.value = prev;
}

function openTxModal(id) {
  const t = _findTx(id);
  if (!t) return;
  _txModalType = t.type;
  setTxModalType(t.type);
  document.getElementById('tx-edit-id').value      = id;
  document.getElementById('tx-edit-desc').value    = t.desc;
  document.getElementById('tx-edit-amt').value     = t.amount;
  document.getElementById('tx-edit-date').value    = t.date;
  document.getElementById('tx-edit-planned').checked  = !!t.planned;
  document.getElementById('tx-edit-transfer').checked = !!t.transfer;
  document.getElementById('tx-edit-rec').checked = !!recs.find(r => r.cat === t.cat && r.desc === t.desc);
  _populateTxModalCats(t.cat);
  document.getElementById('tx-edit-modal').classList.add('open');
}

function closeTxModal(event) {
  if (!event || event.target === document.getElementById('tx-edit-modal')) {
    document.getElementById('tx-edit-modal').classList.remove('open');
  }
}

function saveTxEdit() {
  const id      = document.getElementById('tx-edit-id').value;
  const desc    = document.getElementById('tx-edit-desc').value.trim();
  const amt     = parseFloat(document.getElementById('tx-edit-amt').value);
  const date    = document.getElementById('tx-edit-date').value;
  const cat     = document.getElementById('tx-edit-cat').value;
  const planned    = document.getElementById('tx-edit-planned').checked;
  const isTransfer = document.getElementById('tx-edit-transfer').checked;
  const isRec      = document.getElementById('tx-edit-rec').checked;
  if (!desc || !amt || amt <= 0 || !date) return toast('⚠ Données invalides');
  const t = _findTx(id);
  if (!t) return;
  Object.assign(t, {type: _txModalType, desc, amount: amt, date, cat, planned, transfer: isTransfer || undefined});
  // Gérer l'ajout/retrait des récurrentes
  const recExists = recs.find(r => r.cat === cat && r.desc === desc);
  if (isRec && !recExists) {
    recs.push({id: Date.now(), type: _txModalType, amount: amt, desc, cat, day: parseInt(date.split('-')[2]) || 1, accountId: curAccountId});
    toast('✓ Transaction modifiée + ajoutée aux récurrentes');
  } else if (!isRec && recExists) {
    recs = recs.filter(r => !(r.cat === cat && r.desc === desc));
    toast('✓ Transaction modifiée — retirée des récurrentes');
  }
  saveAll(); closeTxModal(); renderAll(); toast('✓ Transaction modifiée');
}

/* ── TOAST ── */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}
