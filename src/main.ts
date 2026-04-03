/* ═══════════════════════════════════════════════════════════════
   main.ts — Point d'entrée de l'application v2
   ═══════════════════════════════════════════════════════════════ */

import { boot } from './ui/app';

// Importer les modules UI pour enregistrer les handlers globaux
import './ui/pin';
import './ui/router';
import './ui/dashboard';
import './ui/txModal';
import './ui/addForm';
import './ui/rec';
import './ui/analyse';
import './ui/toast';

// Services exposés globalement
import { exportJSON, importJSON, exportCSV } from './services/backup';
import { getState, setState } from './ui/app';
import { getSyncUrl, saveSyncUrl, getSyncToken, saveSyncToken, fetchFromPc, pushToPc } from './services/sync';

(window as any).exportJSON = () => exportJSON(getState());
(window as any).exportCSV  = () => exportCSV(getState());
(window as any).importJSON = () => importJSON(async (data) => {
  await setState(data);
  import('./ui/toast').then(m => m.toast(`✓ ${data.txs.length} transactions restaurées`));
});
(window as any).restoreBackup = async () => {
  const { toast } = await import('./ui/toast');
  try {
    const Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
    if (!Filesystem) { toast('Plugin Filesystem non disponible'); return; }

    const result = await Filesystem.readFile({
      path:      'moncarnetcompte_backup.json',
      directory: 'EXTERNAL',
      encoding:  'utf8',
    });

    const raw = JSON.parse(result.data as string);
    const { migrateV1toV2 } = await import('./core/migrations');

    let data = null;
    if (raw.version === 2 && Array.isArray(raw.txs)) {
      data = raw;
    } else if (Array.isArray(raw.txs)) {
      data = migrateV1toV2({ data: raw, balRef: raw.balanceRef, accounts: raw.accounts, customCats: raw.customCats });
    }

    if (!data) { toast('Format de sauvegarde invalide'); return; }
    await setState(data);
    toast(`✓ ${data.txs.length} transactions restaurées`);
  } catch (e: any) {
    toast('Erreur : ' + (e?.message ?? String(e)));
  }
};

// ── Sync WiFi ─────────────────────────────────────────────────

function _syncStatus(msg: string) {
  const el = document.getElementById('sync-status');
  if (el) el.textContent = msg;
}

function _syncGetUrl(): string {
  const input = document.getElementById('sync-url') as HTMLInputElement | null;
  const url = input?.value.trim() || getSyncUrl();
  if (!url) { _syncStatus('⚠ Entrez l\'adresse du serveur PC'); return ''; }
  if (input && url) { saveSyncUrl(url); input.value = url; }
  return url;
}

function _syncGetToken(): string {
  const input = document.getElementById('sync-token') as HTMLInputElement | null;
  const token = input?.value.trim() || getSyncToken();
  if (input && token) { saveSyncToken(token); input.value = token; }
  return token;
}

(window as any).syncFromPc = async () => {
  const { toast } = await import('./ui/toast');
  const url = _syncGetUrl();
  if (!url) return;
  const token = _syncGetToken();
  _syncStatus('Connexion au serveur…');
  try {
    const data = await fetchFromPc(url, token);
    await setState(data);
    _syncStatus(`✓ ${data.txs.length} transactions importées depuis le PC`);
    toast(`✓ Sync PC → Tél réussie (${data.txs.length} tx)`);
  } catch (e: any) {
    _syncStatus('Erreur : ' + (e?.message ?? String(e)));
    toast('Erreur sync : ' + (e?.message ?? String(e)));
  }
};

(window as any).syncToPc = async () => {
  const { toast } = await import('./ui/toast');
  const url = _syncGetUrl();
  if (!url) return;
  const token = _syncGetToken();
  _syncStatus('Envoi vers le PC…');
  try {
    await pushToPc(url, token, getState());
    _syncStatus('✓ Données envoyées vers le PC');
    toast('✓ Sync Tél → PC réussie');
  } catch (e: any) {
    _syncStatus('Erreur : ' + (e?.message ?? String(e)));
    toast('Erreur sync : ' + (e?.message ?? String(e)));
  }
};

(window as any).syncScanQr = async () => {
  // Sur Android, on ouvre un prompt simple (pas de scanner natif sans plugin dédié)
  const current = getSyncUrl();
  const url = window.prompt('Adresse du serveur PC (ex: http://192.168.1.x:7789)', current || 'http://');
  if (!url) return;
  saveSyncUrl(url);
  const input = document.getElementById('sync-url') as HTMLInputElement | null;
  if (input) input.value = url;
  _syncStatus('Adresse enregistrée');
};

// Restaurer l'URL de sync sauvegardée au démarrage
document.addEventListener('DOMContentLoaded', () => {
  const savedUrl = getSyncUrl();
  if (savedUrl) {
    const input = document.getElementById('sync-url') as HTMLInputElement | null;
    if (input) input.value = savedUrl;
  }
  const savedToken = getSyncToken();
  if (savedToken) {
    const input = document.getElementById('sync-token') as HTMLInputElement | null;
    if (input) input.value = savedToken;
  }
});

// Lancer l'application dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
