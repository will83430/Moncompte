/* ═══════════════════════════════════════════════════════════════
   store.ts — Accès au stockage chiffré (clé en mémoire seulement)

   Clés localStorage :
   - mc5_salt   : sel PBKDF2 (hex)
   - mc5_data   : blob chiffré AppData (v2)
   - mc4_salt   : sel v1 (pour migration)
   - mc4_data   : blob chiffré v1 (pour migration)
   ═══════════════════════════════════════════════════════════════ */

import { AppData } from '../core/types';
import { deriveKey, encrypt, decrypt, generateSalt, saltToHex, saltFromHex } from './crypto';

const KEY_SALT = 'mc5_salt';
const KEY_DATA = 'mc5_data';

// Clé en mémoire — jamais persistée
let _key: CryptoKey | null = null;

// ── API publique ──────────────────────────────────────────────

export const Store = {

  /** Vrai si c'est la toute première utilisation (v2) */
  isFirstLaunch(): boolean {
    return !localStorage.getItem(KEY_SALT);
  },

  /** Vrai si des données v1 existent (migration possible) */
  hasV1Data(): boolean {
    return !!(localStorage.getItem('mc4_salt') && localStorage.getItem('mc4_data'));
  },

  /**
   * Initialise le Store avec le PIN.
   * - Premier lancement : crée un sel, chiffre l'AppData initiale
   * - Lancement suivant : dérive la clé, vérifie le PIN en déchiffrant
   * @returns true si PIN correct, false sinon
   */
  async init(pin: string, initialData?: AppData): Promise<boolean> {
    try {
      const saltHex = localStorage.getItem(KEY_SALT);
      const isNew   = !saltHex;

      const salt = isNew ? generateSalt() : saltFromHex(saltHex!);
      _key = await deriveKey(pin, salt);

      if (isNew) {
        localStorage.setItem(KEY_SALT, saltToHex(salt));
        const data = initialData ?? emptyAppData();
        await this.save(data);
      } else {
        // Vérification du PIN : on tente de déchiffrer
        const stored = localStorage.getItem(KEY_DATA);
        if (stored) await decrypt(_key, stored);
      }

      return true;
    } catch {
      _key = null;
      return false;
    }
  },

  /** Charge et déchiffre AppData */
  async load(): Promise<AppData> {
    if (!_key) throw new Error('Store non initialisé');
    const stored = localStorage.getItem(KEY_DATA);
    if (!stored) return emptyAppData();
    return await decrypt<AppData>(_key, stored);
  },

  /** Chiffre et sauvegarde AppData */
  async save(data: AppData): Promise<void> {
    if (!_key) throw new Error('Store non initialisé');
    const encrypted = await encrypt(_key, data);
    localStorage.setItem(KEY_DATA, encrypted);
  },

  /**
   * Charge et déchiffre les données v1 (avec la clé v1 dérivée du même PIN).
   * Utilisé pendant la migration.
   */
  async loadV1Raw(pin: string): Promise<{ txs: unknown[]; recs: unknown[]; budget: number; goals: unknown[] } | null> {
    try {
      const saltHex = localStorage.getItem('mc4_salt');
      const stored  = localStorage.getItem('mc4_data');
      if (!saltHex || !stored) return null;

      const salt = saltFromHex(saltHex);
      const key  = await deriveKey(pin, salt);
      return await decrypt(key, stored) as any;
    } catch {
      return null;
    }
  },

  /** Supprime les clés v1 après migration réussie */
  cleanupV1(): void {
    ['mc4_salt', 'mc4_data', 'mc4_balref', 'mc4_accounts', 'mc4_cats', 'mc4_curaccount']
      .forEach(k => localStorage.removeItem(k));
  },

  /** Déconnecte — efface la clé en mémoire */
  lock(): void {
    _key = null;
  },

  get isUnlocked(): boolean {
    return _key !== null;
  },
};

// ── AppData vide ──────────────────────────────────────────────

function emptyAppData(): AppData {
  return {
    version:    2,
    txs:        [],
    recs:       [],
    accounts:   [],
    anchors:    [],
    customCats: [],
    budget:     0,
    goals:      [],
  };
}
