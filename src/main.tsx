/* ═══════════════════════════════════════════════════════════════
   main.tsx — Point d'entrée v5 (Preact)
   ═══════════════════════════════════════════════════════════════ */

import { h, render } from 'preact';
import { App } from './ui/App';
import './main.css';
import { appData, setAppData } from './store';
import { exportJSON, exportCSV, importJSON, restoreFromFilesystem } from './services/backup';
import { addGoalUI, deleteGoalUI, updateSavedUI, toggleGoalForm } from './ui/analyse';
import { getSyncUrl, saveSyncUrl, getSyncToken, saveSyncToken, fetchFromPc, pushToPc } from './services/sync';
import { toast } from './ui/toast';

render(<App />, document.getElementById('app')!);

// ── Fonctions globales pour onclick HTML (Analyse page) ─────────

(window as any).addGoalUI      = addGoalUI;
(window as any).deleteGoalUI   = deleteGoalUI;
(window as any).updateSavedUI  = updateSavedUI;
(window as any).toggleGoalForm = toggleGoalForm;

(window as any).exportJSON = () => exportJSON(appData.value!);
(window as any).exportCSV  = () => exportCSV(appData.value!);

(window as any).importJSON = () => importJSON(async (data) => {
  await setAppData(data);
  toast('✓ Données importées');
});

(window as any).restoreBackup = async () => {
  const data = await restoreFromFilesystem();
  if (data) { await setAppData(data); toast('✓ Sauvegarde restaurée'); }
  else toast('Aucune sauvegarde trouvée');
};

function _syncStatus(msg: string) {
  const el = document.getElementById('sync-status');
  if (el) el.textContent = msg;
}
function _getInput(id: string) { return (document.getElementById(id) as HTMLInputElement | null)?.value.trim() || ''; }

(window as any).syncFromPc = async () => {
  const url   = _getInput('sync-url')   || getSyncUrl();
  const token = _getInput('sync-token') || getSyncToken();
  if (!url) { _syncStatus('⚠ Entrez l\'adresse du serveur PC'); return; }
  saveSyncUrl(url); saveSyncToken(token);
  _syncStatus('Connexion au serveur…');
  try {
    const data = await fetchFromPc(url, token);
    await setAppData(data);
    _syncStatus(`✓ ${data.txs.length} transactions importées`);
    toast(`✓ Sync PC → Tél (${data.txs.length} tx)`);
  } catch (e: any) { _syncStatus('Erreur : ' + (e?.message ?? String(e))); }
};

(window as any).syncToPc = async () => {
  const url   = _getInput('sync-url')   || getSyncUrl();
  const token = _getInput('sync-token') || getSyncToken();
  if (!url) { _syncStatus('⚠ Entrez l\'adresse du serveur PC'); return; }
  saveSyncUrl(url); saveSyncToken(token);
  _syncStatus('Envoi vers le PC…');
  try {
    await pushToPc(url, token, appData.value!);
    _syncStatus('✓ Données envoyées'); toast('✓ Sync Tél → PC');
  } catch (e: any) { _syncStatus('Erreur : ' + (e?.message ?? String(e))); }
};

(window as any).syncScanQr = async () => {
  try {
    const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
    const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
    const scanned = result.ScanResult?.trim();
    if (!scanned) return;
    const urlInput = document.getElementById('sync-url') as HTMLInputElement | null;
    if (urlInput) urlInput.value = scanned;
    saveSyncUrl(scanned);
    _syncStatus('QR scanné — entre le token');
  } catch {
    const current = getSyncUrl();
    const entered = window.prompt('Adresse du serveur PC', current || 'http://');
    if (!entered) return;
    const urlInput = document.getElementById('sync-url') as HTMLInputElement | null;
    if (urlInput) urlInput.value = entered;
    saveSyncUrl(entered);
    _syncStatus('Adresse enregistrée');
  }
};
