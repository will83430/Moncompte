/* ═══════════════════════════════════════════════════════════════
   MonCompte — Logique applicative complète
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

/* ── ÉTAT ── */
let txs       = [];
let recs      = [];
let budget    = 0;
let goals     = [];
let customCats  = [];
let balanceRef  = null; // {amount, month: 'YYYY-MM'}
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

/* ── HELPERS ── */
function todayStr() { return new Date().toISOString().slice(0, 10); }
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
function getMonthTxs(d) { const mk = monthKey(d || curDate); return txs.filter(t => t.date.startsWith(mk)); }
function todayISO() { return todayStr(); }
function _findTx(id)  { return txs.find(t  => String(t.id)  === String(id)); }
function _findRec(id) { return recs.find(r => String(r.id)  === String(id)); }
function confirmTx(id) {
  const t = _findTx(id);
  if (!t) return;
  t.planned = false;
  saveAll();
  renderAll();
  toast('✓ Transaction confirmée');
}

/* ── SAUVEGARDE (async, fire-and-forget OK car état en mémoire sync) ── */
function saveAll() {
  StorageManager.save(txs, recs, budget, goals).catch(e => console.error('Erreur sauvegarde:', e));
  _updateWidget();
}

function _updateWidget() {
  try {
    if (!window.Capacitor?.isNativePlatform()) return;
    const list = getMonthTxs();
    const inc  = list.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp  = list.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
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
  customCats = JSON.parse(localStorage.getItem('mc4_cats') || '[]');
  balanceRef = JSON.parse(localStorage.getItem('mc4_balref') || 'null');

  document.getElementById('hdr-date').textContent =
    new Date().toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'long'}).toUpperCase();
  document.getElementById('inp-date').value = todayStr();
  if (budget) document.getElementById('inp-bgt').value = budget;

  populateCats();

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
  const isPlanned = document.getElementById('chk-planned').checked;

  if (!amt || amt <= 0) return toast('⚠ Montant invalide');
  if (!desc)            return toast('⚠ Description manquante');
  if (!date)            return toast('⚠ Date manquante');

  txs.push({id: Date.now(), type: curType, amount: amt, desc, cat, date, recurring: isRec, planned: isPlanned});

  if (isRec) {
    const exists = recs.find(r => r.desc === desc && r.cat === cat && r.type === curType);
    if (!exists) {
      recs.push({id: Date.now() + 1, type: curType, amount: amt, desc, cat, day: recDay});
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
  document.getElementById('chk-planned').checked = false;
  document.getElementById('inp-recday').value = '';
  renderAll();
  showSection('dash');
}

/* ── RÉCURRENTS ── */
function getPendingRecs() {
  const mk = monthKey(curDate);
  return recs.filter(r => !txs.some(t => t.cat === r.cat && t.date.startsWith(mk)));
}

function applyAllRec() {
  const pending = getPendingRecs();
  const mk = monthKey(curDate);
  const [y, m] = mk.split('-');
  pending.forEach(r => {
    const day  = Math.min(r.day, new Date(y, m, 0).getDate());
    const date = `${y}-${m}-${String(day).padStart(2, '0')}`;
    txs.push({id: Date.now() + Math.random(), type: r.type, amount: r.amount, desc: r.desc, cat: r.cat, date, recurring: true, planned: true});
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
  txs.push({id: Date.now(), type: r.type, amount: r.amount, desc: r.desc, cat: r.cat, date, recurring: true, planned: true});
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
function renderAll() {
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
function getBankBalance(targetMk) {
  if (!balanceRef) return null;
  const refMk = balanceRef.month;
  let balance  = balanceRef.amount;
  if (targetMk === refMk) return balance;
  const toNum  = mk => { const [y, m] = mk.split('-').map(Number); return y * 12 + m; };
  const refN   = toNum(refMk), tgtN = toNum(targetMk);
  const step   = tgtN > refN ? 1 : -1;
  for (let n = refN + step; step > 0 ? n <= tgtN : n >= tgtN; n += step) {
    const y = Math.floor((n - 1) / 12), m = ((n - 1) % 12) + 1;
    const l = getMonthTxs(new Date(y, m - 1, 1));
    const bilan = l.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
                - l.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    balance += step > 0 ? bilan : -bilan;
  }
  return balance;
}

function saveBalRef() {
  const val = parseFloat(document.getElementById('inp-balref').value);
  if (isNaN(val)) return toast('⚠ Montant invalide');
  balanceRef = {amount: val, month: monthKey(curDate)};
  localStorage.setItem('mc4_balref', JSON.stringify(balanceRef));
  renderHeader();
  renderBalRefDisplay();
  toast('✓ Solde de référence défini pour ' + monthLabel(curDate));
}

function renderBalRefDisplay() {
  const el = document.getElementById('balref-display');
  if (!el) return;
  if (!balanceRef) { el.style.display = 'none'; return; }
  const bankBal  = getBankBalance(monthKey(curDate));
  const refLabel = new Date(balanceRef.month + '-15').toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'});
  el.style.display = 'block';
  el.innerHTML = `Référence : <strong>${fmt(balanceRef.amount)}</strong> (${refLabel})<br>
    Solde estimé ce mois : <strong style="color:${bankBal >= 0 ? 'var(--green)' : '#c8102e'}">${fmt(bankBal)}</strong>
    <button onclick="balanceRef=null;localStorage.removeItem('mc4_balref');renderHeader();renderBalRefDisplay();"
      style="margin-left:10px;background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;text-decoration:underline;">Effacer</button>`;
}

/* ── HEADER ── */
function renderHeader() {
  const mList = getMonthTxs();
  const mInc  = mList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const mExp  = mList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const mBal  = mInc - mExp;
  // Valeur principale = bilan du mois
  const el = document.getElementById('bal-main');
  el.textContent = (mBal >= 0 ? '+' : '') + fmt(mBal);
  el.className   = 'bal-amount' + (mBal < 0 ? ' neg' : '');
  // Mini-cartes = revenus/dépenses du mois
  document.getElementById('bal-inc').textContent = fmtShort(mInc);
  document.getElementById('bal-exp').textContent = fmtShort(mExp);
  // CE MOIS / SOLDE BANCAIRE
  const me  = document.getElementById('bal-month');
  const lbl = document.getElementById('bal-month-lbl');
  const bankBal = getBankBalance(monthKey(curDate));
  if (bankBal !== null) {
    if (lbl) lbl.textContent = 'Solde banque';
    me.textContent = fmt(bankBal);
    me.className   = 'bal-mini-val' + (bankBal >= 0 ? ' pos' : ' neg');
  } else {
    if (lbl) lbl.textContent = 'Ce mois';
    me.textContent = (mBal >= 0 ? '+' : '') + fmtShort(mBal);
    me.className   = 'bal-mini-val' + (mBal >= 0 ? ' pos' : ' neg');
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
  const inc  = monthList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp  = monthList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const bal  = inc - exp;
  document.getElementById('qs-inc').textContent = fmtShort(inc);
  document.getElementById('qs-exp').textContent = fmtShort(exp);
  const qb = document.getElementById('qs-bal');
  qb.textContent = (bal >= 0 ? '+' : '') + fmtShort(bal);
  qb.style.color = bal >= 0 ? 'var(--green)' : '#c8102e';

  const pending = getPendingRecs();
  const alertEl = document.getElementById('rec-alert');
  if (searchQuery) { alertEl.style.display = 'none'; }
  const isFuture = monthKey(curDate) > monthKey(new Date());
  if (pending.length > 0 && isFuture) {
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
  el.innerHTML = sorted.map(t => {
    const c    = catById(t.cat);
    const d    = new Date(t.date + 'T12:00').toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
    const sign = t.type === 'income' ? '+' : '-';
    const cls  = t.type === 'income' ? 'inc' : 'exp';
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
  const inc  = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp  = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const days = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate();

  // Mois précédent pour comparaison
  const prevDate  = new Date(curDate.getFullYear(), curDate.getMonth() - 1, 1);
  const prevList  = getMonthTxs(prevDate);
  const prevInc   = prevList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExp   = prevList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
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
  list.filter(t => t.type === 'expense').forEach(t => { bycat[t.cat] = (bycat[t.cat] || 0) + t.amount; });
  const sorted   = Object.entries(bycat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalExp = sorted.reduce((s, [, v]) => s + v, 0);
  document.getElementById('donut-total').textContent = fmtShort(totalExp);

  const svg    = document.getElementById('donut-svg');
  const legend = document.getElementById('donut-legend');
  if (!sorted.length) {
    svg.innerHTML    = '<circle cx="90" cy="90" r="60" fill="none" stroke="#e4e6ea" stroke-width="24"/>';
    legend.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:10px 0">Aucune dépense</div>';
  } else {
    const circ = 2 * Math.PI * 60;
    let offset = 0, svgStr = '';
    sorted.forEach(([catId, amt]) => {
      const c    = catById(catId);
      const dash = amt / totalExp * circ;
      svgStr += `<circle cx="90" cy="90" r="60" fill="none" stroke="${c.color}" stroke-width="24" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}" stroke-linecap="butt" onclick="openCatDetail('${catId}')" style="cursor:pointer;"/>`;
      offset += dash;
    });
    svg.innerHTML = svgStr;
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

  // Bar chart 6 mois
  const months = [];
  for (let i = 5; i >= 0; i--) months.push(new Date(curDate.getFullYear(), curDate.getMonth() - i, 1));
  const maxVal = months.reduce((mx, d) => {
    const l = getMonthTxs(d);
    return Math.max(mx, l.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0), l.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  }, 1);
  document.getElementById('bar-chart').innerHTML = months.map(d => {
    const l   = getMonthTxs(d);
    const inc2 = l.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp2 = l.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const mn  = d.toLocaleDateString('fr-FR', {month: 'short'}).replace('.', '');
    return `<div class="bc-col">
      <div class="bc-bars">
        <div class="bc-bar inc-bar" style="height:${Math.round(inc2/maxVal*80)}px" title="${fmtShort(inc2)}"></div>
        <div class="bc-bar exp-bar" style="height:${Math.round(exp2/maxVal*80)}px" title="${fmtShort(exp2)}"></div>
      </div>
      <div class="bc-month">${mn}</div>
    </div>`;
  }).join('');

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

function renderBalanceChart() {
  const el = document.getElementById('balance-chart');
  if (!el) return;

  const months = [];
  for (let i = 11; i >= 0; i--) months.push(new Date(curDate.getFullYear(), curDate.getMonth() - i, 1));

  const data = months.map(d => {
    const l = getMonthTxs(d);
    const inc = l.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = l.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {label: d.toLocaleDateString('fr-FR', {month: 'short'}).replace('.', ''), balance: inc - exp};
  });

  const values = data.map(d => d.balance);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range  = maxVal - minVal || 1;

  const W = 320, H = 150, ml = 44, mr = 8, mt = 16, mb = 28;
  const cw = W - ml - mr, ch = H - mt - mb;
  const n  = data.length;

  const px = i => ml + (i / (n - 1)) * cw;
  const py = v => mt + ch - ((v - minVal) / range) * ch;
  const zeroY = py(0);

  const points = data.map((d, i) => `${px(i).toFixed(1)},${py(d.balance).toFixed(1)}`);
  const pathD  = 'M ' + points.join(' L ');
  const areaD  = `M ${px(0).toFixed(1)},${zeroY.toFixed(1)} L ${points.join(' L ')} L ${px(n-1).toFixed(1)},${zeroY.toFixed(1)} Z`;

  let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block;">`;

  // Lignes horizontales de référence
  const refs = minVal < 0 && maxVal > 0
    ? [minVal, 0, maxVal]
    : [minVal, minVal + range / 2, maxVal];
  refs.forEach(v => {
    const gy = py(v);
    const isDash = (minVal < 0 && maxVal > 0 && v === 0);
    svg += `<line x1="${ml}" y1="${gy.toFixed(1)}" x2="${W - mr}" y2="${gy.toFixed(1)}" stroke="#e4e6ea" stroke-width="${isDash ? 1.5 : 1}" ${isDash ? 'stroke-dasharray="4,3"' : ''}/>`;
    svg += `<text x="${ml - 4}" y="${(gy + 3.5).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af">${_chartLbl(v)}</text>`;
  });

  // Aire + courbe
  svg += `<path d="${areaD}" fill="var(--teal)" opacity="0.1"/>`;
  svg += `<path d="${pathD}" fill="none" stroke="var(--teal)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

  // Points + labels mois
  data.forEach((d, i) => {
    const x = px(i), y = py(d.balance);
    const col = d.balance >= 0 ? 'var(--green)' : '#c8102e';
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${col}" stroke="#fff" stroke-width="2"/>`;
    if (i % 2 === 0 || i === n - 1) {
      svg += `<text x="${x.toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" fill="#9ca3af">${d.label}</text>`;
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
  const inc  = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp  = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
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
  list.filter(t => t.type === 'expense').forEach(t => { bycat[t.cat] = (bycat[t.cat] || 0) + t.amount; });
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
  const exp = getMonthTxs().filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
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
  const totalSavings = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
                     - txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const mInc = getMonthTxs().filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const mExp = getMonthTxs().filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
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
  const data = JSON.stringify({txs, recs, budget, goals, customCats, exported: new Date().toISOString()}, null, 2);
  _download('moncompte_export_' + todayStr() + '.json', data, 'application/json');
  toast('✓ Export JSON téléchargé');
}

function exportCSV() {
  const header = 'Date,Type,Catégorie,Description,Montant\n';
  const rows   = txs.map(t => {
    const c = catById(t.cat);
    const desc = t.desc.replace(/"/g, '""');
    return `${t.date},${t.type==='income'?'Revenu':'Dépense'},"${c.label}","${desc}",${t.type==='income'?'+':'−'}${t.amount.toFixed(2)}`;
  }).join('\n');
  _download('moncompte_' + todayStr() + '.csv', '\uFEFF' + header + rows, 'text/csv');
  toast('✓ Export CSV téléchargé');
}

function _download(filename, content, type) {
  const blob = new Blob([content], {type});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── RESET ── */
function resetAll() {
  if (!confirm('⚠ ATTENTION\n\nSuppression DÉFINITIVE de toutes les données.\n\nÊtes-vous sûr ?')) return;
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
        // Format export natif MonCompte : { txs, recs, budget, goals }
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
function importOneRow(idx) {
  const r = cicData.find((_, i) => i === idx);
  if (!r) return;
  txs.push({id:Date.now(), type:r.amount>=0?'income':'expense', amount:Math.abs(r.amount), desc:r.label, cat:r.amount>=0?'autre_rev':'autre_dep', date:r.date, recurring:false});
  r.status = 'ok';
  saveAll(); _renderCicList(); toast('✓ Transaction importée');
}
function importAllNew() {
  const newRows = cicData.filter(r => r.status === 'new');
  newRows.forEach(r => {
    txs.push({id:Date.now()+Math.random(), type:r.amount>=0?'income':'expense', amount:Math.abs(r.amount), desc:r.label, cat:r.amount>=0?'autre_rev':'autre_dep', date:r.date, recurring:false});
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
  document.getElementById('tx-edit-planned').checked = !!t.planned;
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
  const planned   = document.getElementById('tx-edit-planned').checked;
  const isRec     = document.getElementById('tx-edit-rec').checked;
  if (!desc || !amt || amt <= 0 || !date) return toast('⚠ Données invalides');
  const t = _findTx(id);
  if (!t) return;
  Object.assign(t, {type: _txModalType, desc, amount: amt, date, cat, planned});
  // Gérer l'ajout/retrait des récurrentes
  const recExists = recs.find(r => r.cat === cat && r.desc === desc);
  if (isRec && !recExists) {
    recs.push({id: Date.now(), type: _txModalType, amount: amt, desc, cat, day: parseInt(date.split('-')[2]) || 1});
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
