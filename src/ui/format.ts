/* ═══════════════════════════════════════════════════════════════
   format.ts — Formatage des montants et dates
   ═══════════════════════════════════════════════════════════════ */

/** Formate des centimes en euros avec 2 décimales (ex: 1050 → "10,50 €") */
export function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2
  });
}

/** Formate des centimes en format compact (ex: 1050 → "+10,50 €" ou "-10,50 €") */
export function fmtCompact(cents: number): string {
  const abs = Math.abs(cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  const sign = cents >= 0 ? '+' : '-';
  return `${sign}${abs} €`;
}

/** Formate une date ISO en label court (ex: "2025-03-15" → "15 mars") */
export function fmtDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Formate une date ISO en label long (ex: "2025-03-15" → "samedi 15 mars 2025") */
export function fmtDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/** Centimes → string sans signe ni € (pour inputs) */
export function centsToInput(cents: number): string {
  return (Math.abs(cents) / 100).toFixed(2).replace('.', ',');
}

/** String saisie utilisateur → centimes (supporte virgule et point) */
export function inputToCents(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  if (isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}
