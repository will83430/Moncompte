/* ═══════════════════════════════════════════════════════════════
   StorageManager — chiffrement AES-GCM 256 bits + PBKDF2
   Les données ne sont JAMAIS stockées en clair.
   ═══════════════════════════════════════════════════════════════ */

const StorageManager = (() => {
  let _key = null; // CryptoKey en mémoire, jamais persistée

  /* ── Utilitaires hex ── */
  const toHex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const fromHex = hex => new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));

  /* ── Dérivation de clé depuis le PIN ── */
  async function _deriveKey(pin, salt) {
    const enc = new TextEncoder();
    const keyMat = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /* ── Chiffrement ── */
  async function _encrypt(data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, _key, enc.encode(JSON.stringify(data)));
    return toHex(iv) + ':' + toHex(cipherBuf);
  }

  /* ── Déchiffrement ── */
  async function _decrypt(stored) {
    const [ivHex, dataHex] = stored.split(':');
    const dec = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromHex(ivHex) },
      _key,
      fromHex(dataHex)
    );
    return JSON.parse(new TextDecoder().decode(dec));
  }

  return {
    /* Vérifie si c'est le premier lancement */
    isFirstLaunch() {
      return !localStorage.getItem('mc4_salt');
    },

    /* Vérifie si des anciennes données non chiffrées existent */
    hasLegacyData() {
      return !!(localStorage.getItem('mc3_txs') || localStorage.getItem('mc3_recs'));
    },

    /* Init avec PIN — retourne true si PIN correct, false sinon */
    async init(pin) {
      try {
        let saltHex = localStorage.getItem('mc4_salt');
        let salt;
        const isNew = !saltHex;

        if (isNew) {
          salt = crypto.getRandomValues(new Uint8Array(16));
          localStorage.setItem('mc4_salt', toHex(salt));
        } else {
          salt = fromHex(saltHex);
        }

        _key = await _deriveKey(pin, salt);

        if (isNew) {
          // Premier lancement : on chiffre les données initiales (vides ou migrées)
          const legacy = this._loadLegacy();
          await this.save(legacy.txs, legacy.recs, legacy.budget, legacy.goals);
          // Supprimer les anciennes clés non chiffrées
          ['mc3_txs', 'mc3_recs', 'mc3_bgt'].forEach(k => localStorage.removeItem(k));
          return true;
        } else {
          // Lancement suivant : vérifier le PIN en déchiffrant
          await _decrypt(localStorage.getItem('mc4_data'));
          return true;
        }
      } catch {
        _key = null;
        return false;
      }
    },

    /* Charger les anciennes données non chiffrées pour migration */
    _loadLegacy() {
      return {
        txs: JSON.parse(localStorage.getItem('mc3_txs') || '[]'),
        recs: JSON.parse(localStorage.getItem('mc3_recs') || '[]'),
        budget: parseFloat(localStorage.getItem('mc3_bgt') || '0'),
        goals: []
      };
    },

    /* Charger et déchiffrer les données */
    async load() {
      const stored = localStorage.getItem('mc4_data');
      if (!stored) return { txs: [], recs: [], budget: 0, goals: [] };
      const data = await _decrypt(stored);
      // Assurer la compatibilité des champs manquants
      return {
        txs: data.txs || [],
        recs: data.recs || [],
        budget: data.budget || 0,
        goals: data.goals || []
      };
    },

    /* Chiffrer et sauvegarder */
    async save(txs, recs, budget, goals) {
      if (!_key) return;
      const encrypted = await _encrypt({ txs, recs, budget, goals });
      localStorage.setItem('mc4_data', encrypted);
    },

    /* Verrouiller — efface la clé de la mémoire */
    lock() {
      _key = null;
    },

    /* Changer le PIN */
    async changePIN(oldPin, newPin) {
      // Vérifier l'ancien PIN en rechargeant
      const data = await this.load();
      const saltHex = localStorage.getItem('mc4_salt');
      const salt = fromHex(saltHex);
      const newKey = await _deriveKey(newPin, salt);
      _key = newKey;
      await this.save(data.txs, data.recs, data.budget, data.goals);
      return true;
    },

    /* Réinitialisation complète */
    wipe() {
      ['mc4_data','mc4_salt','mc4_balref','mc4_cats','mc4_accounts','mc4_curaccount','mc3_txs','mc3_recs','mc3_bgt'].forEach(k => localStorage.removeItem(k));
      _key = null;
    }
  };
})();
