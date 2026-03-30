/* ═══════════════════════════════════════════════════════════════
   crypto.ts — Chiffrement AES-GCM 256 bits + PBKDF2
   Compatible avec le format v1 (mc4_data)
   ═══════════════════════════════════════════════════════════════ */

// ── Utilitaires hex ──────────────────────────────────────────

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g);
  if (!pairs) throw new Error('Invalid hex string');
  return new Uint8Array(pairs.map(b => parseInt(b, 16)));
}

// ── Dérivation de clé PBKDF2 ─────────────────────────────────

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey(
    'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Chiffrement ───────────────────────────────────────────────

export async function encrypt(key: CryptoKey, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  return toHex(iv) + ':' + toHex(cipherBuf);
}

// ── Déchiffrement ─────────────────────────────────────────────

export async function decrypt<T = unknown>(key: CryptoKey, stored: string): Promise<T> {
  const colonIdx = stored.indexOf(':');
  if (colonIdx === -1) throw new Error('Invalid ciphertext format');
  const ivHex   = stored.slice(0, colonIdx);
  const dataHex = stored.slice(colonIdx + 1);
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromHex(ivHex) },
    key,
    fromHex(dataHex)
  );
  return JSON.parse(new TextDecoder().decode(dec)) as T;
}

// ── Salt ──────────────────────────────────────────────────────

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function saltToHex(salt: Uint8Array): string {
  return toHex(salt);
}

export function saltFromHex(hex: string): Uint8Array {
  return fromHex(hex);
}
