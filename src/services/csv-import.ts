/* ═══════════════════════════════════════════════════════════════
   csv-import.ts — Import multi-banques
   Banques supportées : CIC/CM, Boursorama, Crédit Agricole,
   BNP Paribas, La Banque Postale, Société Générale, LCL, Caisse d'Épargne
   ═══════════════════════════════════════════════════════════════ */

import { AppData, Transaction, AccountId, IsoDate, mkTxId } from '../core/types';

// ── Types ─────────────────────────────────────────────────────

export type RowStatus = 'new' | 'duplicate';

export interface CsvRow {
  date:        IsoDate;
  amountCents: number;   // positif = crédit, négatif = débit
  label:       string;
  cat:         string;   // auto-catégorisée
  status:      RowStatus;
}

// ── Auto-catégorisation ───────────────────────────────────────

const KEYWORD_CATS: [RegExp, string][] = [
  [/carrefour|leclerc|lidl|aldi|intermarch|casino|monoprix|franprix|supermarche|super u|biocoop|picard|grand frais/i, 'courses'],
  [/uber eats|deliveroo|just eat|domino|pizza/i, 'livraison'],
  [/restaurant|brasserie|bistro|kebab|mcdonald|burger king|kfc|quick|subway|sushi/i, 'restaurant'],
  [/café|cafe|starbucks|bar |bar$/i, 'cafe'],
  [/netflix|spotify|disney|amazon prime|canal\+|deezer|youtube premium|apple tv|hulu/i, 'streaming'],
  [/sncf|ratp|navigo|transdev|keolis|bus |tram |metro/i, 'transports_com'],
  [/edf|engie|total energie|direct energie|gaz|electricit/i, 'energie'],
  [/orange|sfr|bouygues|free mobile|numéricable|sosh|b&you/i, 'telephone'],
  [/loyer|charges locatives|syndic|copropri/i, 'loyer'],
  [/pharmacie|pharmacien|medecin|docteur|infirmier|hopital|clinique|cpam|secu/i, 'pharmacie'],
  [/mutuelle|prevoyance|assurance sante/i, 'mutuelle'],
  [/assurance auto|assurance habitation|assurance maison|maif|macif|matmut|axa|generali|mma/i, 'assurance_hab'],
  [/salaire|traitement|paie |paye /i, 'salaire'],
  [/virement caf|caf |allocation|rsa |prime activite/i, 'caf'],
  [/remboursement cpam|securite sociale|ameli/i, 'cpam'],
  [/impot|dgfip|tresor public|taxe fonciere|taxe habitation/i, 'impots'],
  [/carburant|station service|total access|bp |shell |esso /i, 'carburant'],
  [/amazon(?! prime)|cdiscount|fnac|darty|boulanger|la redoute|vinted|leboncoin/i, 'amazon'],
  [/cinema|cine |ugc|pathe|mk2|fnac spectacles/i, 'cinema'],
  [/salle de sport|fitness|sport|gym|piscine|natation/i, 'sport_loisir'],
  [/ecole|cantine|garderie|nounou|creche|periscolaire/i, 'ecole'],
  [/credit immobilier|pret immo|credit immo|hypotheque/i, 'credit_immo'],
  [/credit conso|pret conso|cetelem|sofinco|cofidis/i, 'credit_conso'],
  [/livret|epargne|pel |cel |assurance vie/i, 'epargne_dep'],
  [/retrait|dab |distributeur/i, 'retrait'],
  [/frais bancaires|cotisation carte|commission/i, 'frais_bancaires'],
  [/virement recu|virement entrant|salaire/i, 'salaire'],
];

function autoCat(label: string, isIncome: boolean): string {
  const upper = label.toUpperCase();
  for (const [re, cat] of KEYWORD_CATS) {
    if (re.test(upper)) return cat;
  }
  return isIncome ? 'autre_rev' : 'autre_dep';
}

// ── Parsers par banque ────────────────────────────────────────

function parseDate(str: string): IsoDate | null {
  // DD/MM/YYYY
  const m1 = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}` as IsoDate;
  // YYYY-MM-DD
  const m2 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return str as IsoDate;
  // DD-MM-YYYY
  const m3 = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}` as IsoDate;
  return null;
}

function parseMontant(str: string): number {
  return parseFloat(str.replace(/\s/g, '').replace(',', '.')) || 0;
}

function splitLine(line: string, sep: string): string[] {
  return line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
}

type ParsedRow = { date: IsoDate; amountCents: number; label: string } | null;

function detectSep(header: string): string {
  return header.includes(';') ? ';' : ',';
}

// Détection du format banque
type BankFormat = 'cic' | 'boursorama' | 'ca' | 'bnp' | 'postale' | 'sg' | 'lcl' | 'generic';

function detectFormat(headers: string[]): BankFormat {
  const h = headers.join('|').toLowerCase();
  if (h.includes('opérations') || h.includes('operations') || (h.includes('débit') && h.includes('crédit') && !h.includes('solde'))) return 'sg';
  if (h.includes('débit') && h.includes('crédit') && h.includes('solde')) return 'lcl';
  if (h.includes('libellé simplifié') || h.includes('libelle simplifie')) return 'boursorama';
  if (h.includes('libellé débit') || h.includes('libelle debit')) return 'ca';
  if (h.includes('date opération') || h.includes('date operation')) return 'cic';
  // Format CIC/Filbanque : Date;Date de valeur;Montant;Libellé;Solde
  if (h.includes('date de valeur') || h.includes('valeur')) return 'cic';
  return 'generic';
}

function parseRows(lines: string[], sep: string): ParsedRow[] {
  const rawHeader = lines[0] ?? '';
  const headers   = splitLine(rawHeader, sep).map(h => h.toLowerCase());
  const format    = detectFormat(headers);
  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]!, sep);
    if (cols.length < 2) continue;
    let row: ParsedRow = null;

    if (format === 'lcl') {
      // Date opération;Date valeur;Libellé;Débit;Crédit
      const date   = parseDate(cols[0] ?? '');
      const label  = cols[2] ?? '';
      const debit  = parseMontant(cols[3] ?? '0');
      const credit = parseMontant(cols[4] ?? '0');
      if (!date || !label) continue;
      const amount = credit > 0 ? credit : -Math.abs(debit);
      row = { date, amountCents: Math.round(amount * 100), label };

    } else if (format === 'sg') {
      // Date;Libellé;Débit;Crédit
      const dateIdx  = headers.findIndex(h => h.includes('date'));
      const labelIdx = headers.findIndex(h => h.includes('libellé') || h.includes('libelle') || h.includes('opérations') || h.includes('operations'));
      const debitIdx = headers.findIndex(h => h.includes('débit') || h.includes('debit'));
      const credIdx  = headers.findIndex(h => h.includes('crédit') || h.includes('credit'));
      const date     = parseDate(cols[dateIdx >= 0 ? dateIdx : 0] ?? '');
      const label    = cols[labelIdx >= 0 ? labelIdx : 1] ?? '';
      if (!date) continue;
      const debit  = debitIdx >= 0 ? parseMontant(cols[debitIdx] ?? '0') : 0;
      const credit = credIdx  >= 0 ? parseMontant(cols[credIdx]  ?? '0') : 0;
      const amount = credit > 0 ? credit : -Math.abs(debit);
      row = { date, amountCents: Math.round(amount * 100), label };

    } else if (format === 'ca') {
      // Date;Libellé débit;Libellé crédit;Montant;Devise
      const date   = parseDate(cols[0] ?? '');
      const label  = (cols[1] ?? cols[2] ?? '').trim() || (cols[2] ?? '').trim();
      const amount = parseMontant(cols[3] ?? '0');
      if (!date) continue;
      row = { date, amountCents: Math.round(amount * 100), label };

    } else if (format === 'cic') {
      // Date;Date de valeur;Montant;Libellé;Solde  (CIC/Filbanque)
      // ou Date opération;Date valeur;Libellé;Montant;...
      const dateIdx   = 0;
      const amountIdx = headers.findIndex(h => h.includes('montant') || h.includes('amount'));
      // Libellé = colonne entre date(s) et montant, ou après montant
      const labelIdx  = headers.findIndex(h =>
        h.includes('libel') || h.includes('label') || h.includes('opérat') || h.includes('operat')
      );
      const date   = parseDate(cols[dateIdx] ?? '');
      const amount = parseMontant(cols[amountIdx >= 0 ? amountIdx : 2] ?? '0');
      // Fallback : si aucun header libellé trouvé, prendre la colonne 3 (après date, val, montant)
      const label  = cols[labelIdx >= 0 ? labelIdx : 3] ?? cols[1] ?? '';
      if (!date) continue;
      row = { date, amountCents: Math.round(amount * 100), label };

    } else {
      // Boursorama, Postale, generic : Date;Libellé;Montant
      const dateIdx   = headers.findIndex(h => h.includes('date'));
      const labelIdx  = headers.findIndex(h => h.includes('libel') || h.includes('label'));
      const amountIdx = headers.findIndex(h => h.includes('montant') || h.includes('amount'));
      const date      = parseDate(cols[dateIdx >= 0 ? dateIdx : 0] ?? '');
      const label     = cols[labelIdx >= 0 ? labelIdx : 1] ?? '';
      const amount    = parseMontant(cols[amountIdx >= 0 ? amountIdx : 2] ?? '0');
      if (!date) continue;
      row = { date, amountCents: Math.round(amount * 100), label };
    }

    if (row && row.label) results.push(row);
  }
  return results;
}

// ── Point d'entrée principal ──────────────────────────────────

export function parseCSV(text: string): CsvRow[] | null {
  // Décoder ISO-8859-1 si nécessaire (déjà fait par FileReader)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // Trouver la ligne d'en-tête (contient date ou libellé)
  let headerIdx = lines.findIndex(l =>
    /date|libellé|libelle|montant|débit|credit/i.test(l)
  );
  if (headerIdx === -1) headerIdx = 0;

  const sep  = detectSep(lines[headerIdx]!);
  const rows = parseRows(lines.slice(headerIdx), sep);

  if (rows.length === 0) return null;

  return rows.map(r => {
    if (!r) return null!;
    const isIncome = r.amountCents > 0;
    return {
      date:        r.date,
      amountCents: r.amountCents,
      label:       r.label,
      cat:         autoCat(r.label, isIncome),
      status:      'new' as RowStatus,
    };
  }).filter(Boolean);
}

// ── Détection des doublons ────────────────────────────────────

export function markDuplicates(rows: CsvRow[], data: AppData, accountId: AccountId): CsvRow[] {
  return rows.map(row => {
    const isDuplicate = data.txs.some(t =>
      t.accountId === accountId &&
      t.date      === row.date &&
      Math.abs(t.amountCents - Math.abs(row.amountCents)) <= 1
    );
    return { ...row, status: isDuplicate ? 'duplicate' : 'new' };
  });
}

// ── Import ────────────────────────────────────────────────────

export function importCsvRows(
  data:      AppData,
  rows:      CsvRow[],
  accountId: AccountId,
  isCredit:  boolean
): { data: AppData; count: number } {
  const newRows = rows.filter(r => r.status === 'new');
  const newTxs: Transaction[] = newRows.map(r => {
    const positive = r.amountCents >= 0;
    const kind     = (isCredit ? !positive : positive) ? 'income' : 'expense';
    return {
      id:          mkTxId(),
      accountId,
      date:        r.date,
      amountCents: Math.abs(r.amountCents),
      kind,
      cat:         r.cat,
      desc:        r.label,
      planned:     false,
      recurring:   false,
    };
  });

  const sorted = [...data.txs, ...newTxs].sort((a, b) => b.date.localeCompare(a.date));
  return { data: { ...data, txs: sorted }, count: newTxs.length };
}
