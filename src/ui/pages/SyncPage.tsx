import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, setAppData } from '../../store';
import {
  getSyncUrl, saveSyncUrl, getSyncToken, saveSyncToken,
  fetchFromPc, pushToPc,
} from '../../services/sync';
import { toast } from '../toast';

export function SyncPage() {
  const data = useSignal(appData)!;

  const [url,    setUrl]    = useState(() => getSyncUrl());
  const [token,  setToken]  = useState(() => getSyncToken());
  const [status, setStatus] = useState('');
  const [busy,   setBusy]   = useState(false);

  const saveSettings = useCallback(() => {
    saveSyncUrl(url);
    saveSyncToken(token);
  }, [url, token]);

  const syncFrom = useCallback(async () => {
    saveSettings();
    if (!url) { setStatus('⚠ Entrez l\'adresse du serveur PC'); return; }
    setBusy(true);
    setStatus('Connexion au serveur…');
    try {
      const received = await fetchFromPc(url, token);
      await setAppData(received);
      setStatus(`✓ ${received.txs.length} transactions importées depuis le PC`);
      toast(`✓ ${received.txs.length} transactions importées`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setStatus('Erreur : ' + msg);
      toast('Erreur sync : ' + msg);
    } finally {
      setBusy(false);
    }
  }, [url, token, data, saveSettings]);

  const syncTo = useCallback(async () => {
    saveSettings();
    if (!url) { setStatus('⚠ Entrez l\'adresse du serveur PC'); return; }
    setBusy(true);
    setStatus('Envoi vers le PC…');
    try {
      await pushToPc(url, token, data);
      setStatus('✓ Données envoyées vers le PC');
      toast('✓ Envoi réussi');
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setStatus('Erreur : ' + msg);
      toast('Erreur sync : ' + msg);
    } finally {
      setBusy(false);
    }
  }, [url, token, data, saveSettings]);

  const scanQr = useCallback(async () => {
    try {
      const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import('@capacitor/barcode-scanner');
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      });
      const scanned = result.ScanResult?.trim();
      if (!scanned) return;
      saveSyncUrl(scanned);
      setUrl(scanned);
      setStatus('QR scanné — entre le token affiché sur la page /qr du PC');
      toast('URL enregistrée — entre le token manuellement');
    } catch {
      const current = getSyncUrl();
      const entered = window.prompt('Adresse du serveur PC (ex: http://192.168.1.x:7789)', current || 'http://');
      if (!entered) return;
      saveSyncUrl(entered);
      setUrl(entered);
      setStatus('Adresse enregistrée');
    }
  }, []);

  return (
    <div class="section active" id="sec-sync">
      <div class="form-card">
        <div class="card-title" style="margin-bottom:16px;">Synchronisation WiFi</div>

        <div class="form-field">
          <label class="form-label">ADRESSE DU SERVEUR PC</label>
          <div style="display:flex;gap:8px;">
            <input
              type="url"
              class="form-input"
              placeholder="http://192.168.1.x:7789"
              value={url}
              onInput={e => setUrl((e.target as HTMLInputElement).value)}
              style="flex:1;"
            />
            <button class="btn-secondary" onClick={scanQr} title="Scanner QR" style="padding:0 14px;font-size:18px;">📷</button>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">TOKEN</label>
          <input
            type="text"
            class="form-input"
            placeholder="Token affiché sur le serveur"
            value={token}
            onInput={e => setToken((e.target as HTMLInputElement).value)}
          />
        </div>

        {status && (
          <div class="sync-status" id="sync-status" style="margin:8px 0;padding:10px;border-radius:8px;background:var(--bg2);font-size:13px;color:var(--text2);">
            {status}
          </div>
        )}

        <div style="display:flex;gap:10px;margin-top:8px;">
          <button class="btn-secondary" onClick={syncFrom} disabled={busy} style="flex:1;">
            ⬇ Recevoir
          </button>
          <button class="btn-primary" onClick={syncTo} disabled={busy} style="flex:1;">
            ⬆ Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
