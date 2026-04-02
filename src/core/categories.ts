/* ═══════════════════════════════════════════════════════════════
   categories.ts — Catalogue des catégories système (identique v1)
   ═══════════════════════════════════════════════════════════════ */

export interface CatDef {
  id:    string;
  label: string;
  icon:  string;
  color: string; // hex couleur de fond de l'icône
  group: string;
}

export const SYSTEM_CATS: CatDef[] = [
  // Logement
  {id:'loyer',           group:'Logement',     label:'Loyer / Charges',              icon:'🏠', color:'#3b82f6'},
  {id:'energie',         group:'Logement',     label:'Électricité / Gaz / Eau',      icon:'💡', color:'#f59e0b'},
  {id:'telephone',       group:'Logement',     label:'Téléphone / Internet',         icon:'📡', color:'#06b6d4'},
  {id:'travaux',         group:'Logement',     label:'Travaux / Entretien',          icon:'🔧', color:'#78716c'},
  {id:'electromenager',  group:'Logement',     label:'Électroménager / Mobilier',    icon:'🛋️', color:'#8b5cf6'},
  // Alimentation
  {id:'courses',         group:'Alimentation', label:'Courses / Supermarché',        icon:'🛒', color:'#10b981'},
  {id:'restaurant',      group:'Alimentation', label:'Restaurant / Fast-food',       icon:'🍽️', color:'#f97316'},
  {id:'livraison',       group:'Alimentation', label:'Livraison repas',              icon:'🛵', color:'#ef4444'},
  {id:'cafe',            group:'Alimentation', label:'Café / Bar',                   icon:'☕', color:'#92400e'},
  // Transports
  {id:'carburant',       group:'Transports',   label:'Carburant',                    icon:'⛽', color:'#dc2626'},
  {id:'assurance_auto',  group:'Transports',   label:'Assurance véhicule',           icon:'🚗', color:'#7c3aed'},
  {id:'transports_com',  group:'Transports',   label:'Transports en commun',         icon:'🚇', color:'#2563eb'},
  {id:'taxi',            group:'Transports',   label:'Taxi / VTC',                   icon:'🚕', color:'#ca8a04'},
  {id:'parking',         group:'Transports',   label:'Parking / Péage',              icon:'🅿️', color:'#4f46e5'},
  {id:'entretien_auto',  group:'Transports',   label:'Entretien véhicule',           icon:'🔩', color:'#9a3412'},
  // Santé
  {id:'medecin',         group:'Santé',        label:'Médecin / Spécialiste',        icon:'🩺', color:'#be123c'},
  {id:'pharmacie',       group:'Santé',        label:'Pharmacie / Médicaments',      icon:'💊', color:'#e11d48'},
  {id:'mutuelle',        group:'Santé',        label:'Mutuelle / Complémentaire',    icon:'🏥', color:'#9f1239'},
  {id:'optique',         group:'Santé',        label:'Optique / Dentaire',           icon:'👓', color:'#881337'},
  {id:'sport_sante',     group:'Santé',        label:'Sport / Bien-être',            icon:'🏋️', color:'#15803d'},
  // Loisirs
  {id:'streaming',       group:'Loisirs',      label:'Streaming / Abonnements',      icon:'📺', color:'#7c3aed'},
  {id:'cinema',          group:'Loisirs',      label:'Cinéma / Spectacles',          icon:'🎭', color:'#be185d'},
  {id:'sport_loisir',    group:'Loisirs',      label:'Sport / Club',                 icon:'⚽', color:'#16a34a'},
  {id:'livre',           group:'Loisirs',      label:'Livres / Presse / Musique',    icon:'📚', color:'#b45309'},
  {id:'jeux',            group:'Loisirs',      label:'Jeux vidéo / Loisirs',         icon:'🎮', color:'#0891b2'},
  {id:'voyage',          group:'Loisirs',      label:'Voyage / Vacances',            icon:'✈️', color:'#0284c7'},
  {id:'hotel',           group:'Loisirs',      label:'Hôtel / Hébergement',          icon:'🏨', color:'#0369a1'},
  // Shopping
  {id:'vetements',       group:'Shopping',     label:'Vêtements / Chaussures',       icon:'👕', color:'#db2777'},
  {id:'beaute',          group:'Shopping',     label:'Beauté / Cosmétiques',         icon:'💅', color:'#ec4899'},
  {id:'high_tech',       group:'Shopping',     label:'High-Tech / Électronique',     icon:'💻', color:'#6d28d9'},
  {id:'amazon',          group:'Shopping',     label:'Achats en ligne',              icon:'📦', color:'#d97706'},
  // Famille
  {id:'ecole',           group:'Famille',      label:'École / Garde enfants',        icon:'🏫', color:'#ca8a04'},
  {id:'jouets',          group:'Famille',      label:'Jouets / Enfants',             icon:'🧸', color:'#ea580c'},
  {id:'animaux',         group:'Famille',      label:'Animaux de compagnie',         icon:'🐾', color:'#92400e'},
  // Finances
  {id:'impots',          group:'Finances',     label:'Impôts / Taxes',               icon:'🏛️', color:'#4338ca'},
  {id:'assurance_hab',   group:'Finances',     label:'Assurance habitation',         icon:'🛡️', color:'#3730a3'},
  {id:'assurance_vie',   group:'Finances',     label:'Assurance vie / Prévoyance',   icon:'📋', color:'#312e81'},
  {id:'credit_immo',     group:'Finances',     label:'Crédit immobilier',            icon:'🏡', color:'#1e40af'},
  {id:'credit_conso',    group:'Finances',     label:'Crédit consommation',          icon:'💳', color:'#1d4ed8'},
  {id:'epargne_dep',     group:'Finances',     label:'Épargne / Livret',             icon:'🏦', color:'#059669'},
  {id:'frais_bancaires', group:'Finances',     label:'Frais bancaires',              icon:'🏧', color:'#6b7280'},
  {id:'don',             group:'Finances',     label:'Dons / Cadeaux',               icon:'🎁', color:'#db2777'},
  {id:'retrait',         group:'Finances',     label:'Retrait espèces',              icon:'💵', color:'#374151'},
  {id:'autre_dep',       group:'Divers',       label:'Autre dépense',                icon:'📌', color:'#9ca3af'},
  // Revenus
  {id:'salaire',         group:'Revenus pro',  label:'Salaire / Traitement',         icon:'💼', color:'#059669'},
  {id:'prime',           group:'Revenus pro',  label:'Prime / Bonus',                icon:'⭐', color:'#10b981'},
  {id:'freelance',       group:'Revenus pro',  label:'Freelance / Auto-entreprise',  icon:'🖥️', color:'#06b6d4'},
  {id:'chomage',         group:'Revenus pro',  label:'Chômage / ARE',                icon:'📄', color:'#3b82f6'},
  {id:'retraite',        group:'Revenus pro',  label:'Retraite / Pension',           icon:'👴', color:'#6366f1'},
  {id:'loyer_percu',     group:'Revenus immo', label:'Loyer perçu',                  icon:'🏡', color:'#2563eb'},
  {id:'plus_value',      group:'Revenus immo', label:'Plus-value / Vente',           icon:'📈', color:'#16a34a'},
  {id:'caf',             group:'Aides',        label:'CAF / APL / Allocations',      icon:'🤝', color:'#0284c7'},
  {id:'cpam',            group:'Aides',        label:'Remboursement CPAM',           icon:'💊', color:'#be123c'},
  {id:'mutuelle_remb',   group:'Aides',        label:'Remboursement mutuelle',       icon:'🏥', color:'#9f1239'},
  {id:'impots_remb',     group:'Aides',        label:'Remboursement impôts',         icon:'🏛️', color:'#4338ca'},
  {id:'aide_logement',   group:'Aides',        label:'Aide logement / MaPrimeRénov', icon:'🏠', color:'#1d4ed8'},
  {id:'dividendes',      group:'Épargne',      label:'Dividendes / Intérêts',        icon:'💹', color:'#059669'},
  {id:'livret',          group:'Épargne',      label:'Retrait livret / épargne',     icon:'🏦', color:'#10b981'},
  {id:'vente',           group:'Divers',       label:'Vente (Leboncoin, etc.)',       icon:'🏷️', color:'#ca8a04'},
  {id:'cadeau_recu',     group:'Divers',       label:'Cadeau / Don reçu',            icon:'🎁', color:'#ec4899'},
  {id:'argent_rendu',    group:'Divers',       label:'Argent rendu / Remboursement', icon:'🤙', color:'#f97316'},
  {id:'gains_jeux',      group:'Divers',       label:'Gains / Loterie',              icon:'🎰', color:'#eab308'},
  {id:'autre_rev',       group:'Divers',       label:'Autre revenu',                 icon:'💰', color:'#6b7280'},
];

// Lookup rapide par id
const _byId = new Map<string, CatDef>(SYSTEM_CATS.map(c => [c.id, c]));

// Aliases V1 → V2
const CAT_ALIASES: Record<string, string> = {
  'autre':         'autre_dep',
  'other_expense': 'autre_dep',
  'other_income':  'autre_rev',
  'sante':         'medecin',
  'transport':     'transports_com',
  'loisir':        'sport_loisir',
  'assurance':     'assurance_hab',
  'credit':        'credit_conso',
};

export function getCatDef(
  catId: string,
  customCats: import('./types').CustomCategory[] = []
): CatDef {
  // Catégorie système
  const sys = _byId.get(catId) ?? _byId.get(CAT_ALIASES[catId] ?? '');
  if (sys) return sys;
  // Catégorie personnalisée
  const custom = customCats.find(c => c.id === catId);
  if (custom) return {
    id:    custom.id,
    label: custom.label,
    icon:  custom.icon,
    color: '#00857a',
    group: 'Custom',
  };
  // Fallback emoji : si le catId ressemble à un emoji, l'utiliser directement comme icône
  if (catId && !/^[\w_-]+$/.test(catId)) {
    return { id: catId, label: 'Virement', icon: catId, color: '#6b7280', group: 'Virements' };
  }
  return { id: catId, label: catId, icon: '↔️', color: '#9ca3af', group: 'Divers' };
}
