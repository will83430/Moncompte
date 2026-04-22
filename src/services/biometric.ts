/* ═══════════════════════════════════════════════════════════════
   biometric.ts — Authentification biométrique (empreinte / face)
   Après succès biométrique, récupère le PIN stocké pour déverrouiller.
   ═══════════════════════════════════════════════════════════════ */

const BIO_KEY     = 'mc5_bio_enabled';
const BIO_PIN_KEY = 'mc5_bio_pin';

// ── Activation / désactivation ────────────────────────────────

export function isBioEnabled(): boolean {
  return localStorage.getItem(BIO_KEY) === '1';
}

export function enableBio(pin: string): void {
  // Stockage du PIN obfusqué — la vraie sécurité vient de la biométrie OS
  localStorage.setItem(BIO_PIN_KEY, btoa(unescape(encodeURIComponent(pin))));
  localStorage.setItem(BIO_KEY, '1');
}

export function disableBio(): void {
  localStorage.removeItem(BIO_PIN_KEY);
  localStorage.removeItem(BIO_KEY);
}

export function getStoredPin(): string | null {
  const raw = localStorage.getItem(BIO_PIN_KEY);
  if (!raw) return null;
  try { return decodeURIComponent(escape(atob(raw))); } catch { return null; }
}

// ── Vérification disponibilité ────────────────────────────────

export async function isBioAvailable(): Promise<boolean> {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable;
  } catch {
    return false;
  }
}

// ── Authentification ──────────────────────────────────────────

export async function authenticateWithBio(): Promise<boolean> {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason:                    'Déverrouillez MonCarnetCompte',
      cancelTitle:               'Utiliser le PIN',
      allowDeviceCredential:     false,
      iosFallbackTitle:          'Utiliser le PIN',
      androidTitle:              'MonCarnetCompte',
      androidSubtitle:           'Authentification biométrique',
      androidConfirmationRequired: false,
    });
    return true;
  } catch {
    return false;
  }
}
