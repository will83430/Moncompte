/* ═══════════════════════════════════════════════════════════════
   backup.ts — Export/Import JSON + sauvegarde auto Filesystem Capacitor
   ═══════════════════════════════════════════════════════════════ */

import { AppData } from '../core/types';
import { migrateV1toV2 } from '../core/migrations';

const BACKUP_FILE = 'moncarnetcompte_backup.json';
const BACKUP_DIR  = 'EXTERNAL';

// ── Sauvegarde auto Capacitor (fire-and-forget) ───────────────

let _backupTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoBackup(data: AppData): void {
  if (_backupTimer) clearTimeout(_backupTimer);
  _backupTimer = setTimeout(() => _doAutoBackup(data), 4000);
}

async function _doAutoBackup(data: AppData): Promise<void> {
  try {
    if (!isNative()) return;
    if (data.txs.length === 0) return; // protection anti-reset accidentel

    const Filesystem = getFilesystem();
    if (!Filesystem) return;

    const payload = JSON.stringify(toExportPayload(data));
    await Filesystem.writeFile({
      path:      BACKUP_FILE,
      data:      payload,
      directory: BACKUP_DIR,
      encoding:  'utf8',
      recursive: true,
    });
  } catch (e) {
    console.warn('Auto-backup échoué:', e);
  }
}

// ── Restauration depuis Filesystem au démarrage ───────────────

export async function restoreFromFilesystem(): Promise<AppData | null> {
  try {
    if (!isNative()) return null;
    const Filesystem = getFilesystem();
    if (!Filesystem) return null;

    const result = await Filesystem.readFile({
      path:      BACKUP_FILE,
      directory: BACKUP_DIR,
      encoding:  'utf8',
    });

    const raw = JSON.parse(result.data as string);
    return parseBackupPayload(raw);
  } catch {
    return null;
  }
}

// ── Export JSON (téléchargement navigateur) ───────────────────

export function exportJSON(data: AppData): void {
  const payload = JSON.stringify(toExportPayload(data), null, 2);
  const date    = new Date().toISOString().slice(0, 10);
  download(`moncarnetcompte_export_${date}.json`, payload, 'application/json');
}

// ── Import JSON (sélecteur de fichier) ────────────────────────

export function importJSON(onSuccess: (data: AppData) => void): void {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';

  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const raw  = JSON.parse(text);

      if (!raw.txs) { alert('Fichier invalide (pas de transactions)'); return; }

      const count = raw.txs.length;
      if (!confirm(`Restaurer ${count} transactions ?\nLes données actuelles seront remplacées.`)) return;

      const parsed = parseBackupPayload(raw);
      if (parsed) onSuccess(parsed);
    } catch {
      alert('Erreur lecture fichier JSON');
    }
  };

  input.click();
}

// ── Export CSV ────────────────────────────────────────────────

export function exportCSV(data: AppData): void {
  const header = 'Date,Type,Catégorie,Description,Montant\n';
  const rows = data.txs.map(t => {
    const type = t.kind === 'income' ? 'Revenu' : 'Dépense';
    const amt  = (t.amountCents / 100).toFixed(2);
    const sign = t.kind === 'income' ? '+' : '-';
    const desc = t.desc.replace(/"/g, '""');
    return `${t.date},${type},${t.cat},"${desc}",${sign}${amt}`;
  }).join('\n');

  const date = new Date().toISOString().slice(0, 10);
  download(`moncarnetcompte_${date}.csv`, '\uFEFF' + header + rows, 'text/csv');
}

// ── Payload serialization ─────────────────────────────────────

function toExportPayload(data: AppData): Record<string, unknown> {
  return {
    version:    data.version,
    txs:        data.txs,
    recs:       data.recs,
    accounts:   data.accounts,
    anchors:    data.anchors,
    customCats: data.customCats,
    budget:     data.budget,
    goals:      data.goals,
    exported:   new Date().toISOString(),
  };
}

function parseBackupPayload(raw: Record<string, unknown>): AppData | null {
  // Format v2 natif
  if (raw['version'] === 2 && Array.isArray(raw['txs'])) {
    return raw as unknown as AppData;
  }

  // Format v1 (champ txs mais pas version:2)
  if (Array.isArray(raw['txs'])) {
    return migrateV1toV2({
      data: raw as any,
      balRef:    raw['balanceRef']  as any,
      accounts:  raw['accounts']   as any,
      customCats: raw['customCats'] as any,
    });
  }

  return null;
}

// ── Helpers ───────────────────────────────────────────────────

function isNative(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

function getFilesystem(): any {
  return (window as any).Capacitor?.Plugins?.Filesystem ?? null;
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Exposer globalement pour les onclick HTML
(window as any).exportJSON = (data: AppData) => exportJSON(data);
(window as any).exportCSV  = (data: AppData) => exportCSV(data);
