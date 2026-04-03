/* ═══════════════════════════════════════════════════════════════
   sync.ts — Synchronisation WiFi PC ↔ Téléphone
   ═══════════════════════════════════════════════════════════════ */

import type { AppData } from '../core/types';
import { migrateV1toV2 } from '../core/migrations';

const STORAGE_KEY       = 'mc_sync_url';
const STORAGE_KEY_TOKEN = 'mc_sync_token';

export function getSyncUrl(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function saveSyncUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/$/, ''));
}

export function getSyncToken(): string {
  return localStorage.getItem(STORAGE_KEY_TOKEN) ?? '';
}

export function saveSyncToken(token: string): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
}

function authHeaders(token: string): Record<string, string> {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/** Télécharge les données depuis le PC et les retourne parsées */
export async function fetchFromPc(baseUrl: string, token: string): Promise<AppData> {
  const url = baseUrl.trim().replace(/\/$/, '');
  const res = await fetch(`${url}/data`, { method: 'GET', headers: authHeaders(token) });
  if (res.status === 401) throw new Error('Token invalide');
  if (!res.ok) throw new Error(`Serveur: ${res.status} ${res.statusText}`);
  const raw = await res.json();
  if (raw.version === 2 && Array.isArray(raw.txs)) return raw as AppData;
  if (Array.isArray(raw.txs)) return migrateV1toV2({ data: raw, balRef: raw.balanceRef, accounts: raw.accounts, customCats: raw.customCats });
  throw new Error('Format de données invalide');
}

/** Envoie les données du téléphone vers le PC */
export async function pushToPc(baseUrl: string, token: string, data: AppData): Promise<void> {
  const url = baseUrl.trim().replace(/\/$/, '');
  const res = await fetch(`${url}/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (res.status === 401) throw new Error('Token invalide');
  if (!res.ok) throw new Error(`Serveur: ${res.status} ${res.statusText}`);
}

/** Vérifie que le serveur répond */
export async function pingServer(baseUrl: string): Promise<boolean> {
  try {
    const url = baseUrl.trim().replace(/\/$/, '');
    const res = await fetch(`${url}/ping`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
