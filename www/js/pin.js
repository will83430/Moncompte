/* ═══════════════════════════════════════════════════════════════
   PinManager — Écran PIN, création, vérification, verrouillage
   ═══════════════════════════════════════════════════════════════ */

const PinManager = (() => {
  let _buffer = '';
  let _mode = 'enter'; // 'create' | 'confirm' | 'enter'
  let _createPin = '';
  let _attempts = 0;
  let _locked = false;
  let _lockTimer = null;

  function _el(id) { return document.getElementById(id); }

  function _show(screenId) {
    _el('pin-screen').style.display = 'flex';
    _el('app').style.display = 'none';
  }

  function _hide() {
    _el('pin-screen').style.display = 'none';
    _el('app').style.display = 'block';
  }

  function _updateDots() {
    for (let i = 0; i < 4; i++) {
      _el('dot-' + i).classList.toggle('filled', i < _buffer.length);
    }
  }

  function _setSubtitle(text) {
    _el('pin-subtitle').textContent = text;
  }

  function _setError(text) {
    const el = _el('pin-error');
    el.textContent = text;
    if (text) {
      el.classList.add('visible');
      setTimeout(() => el.classList.remove('visible'), 3000);
    } else {
      el.classList.remove('visible');
    }
  }

  function _shake() {
    const dots = _el('pin-dots');
    dots.classList.add('shake');
    setTimeout(() => dots.classList.remove('shake'), 500);
  }

  function _clear() {
    _buffer = '';
    _updateDots();
    _setError('');
  }

  async function _submit() {
    const pin = _buffer;
    _clear();

    if (_mode === 'create') {
      if (pin.length < 4) { _setError('PIN trop court'); return; }
      _createPin = pin;
      _mode = 'confirm';
      _setSubtitle('Confirmez votre PIN');
      return;
    }

    if (_mode === 'confirm') {
      if (pin !== _createPin) {
        _shake();
        _setError('Les PIN ne correspondent pas');
        _mode = 'create';
        _createPin = '';
        _setSubtitle('Créez votre PIN (4 chiffres)');
        return;
      }
      // PIN confirmé — initialiser le stockage
      const ok = await StorageManager.init(pin);
      if (ok) {
        await _launchApp();
      } else {
        _setError('Erreur lors de la création');
      }
      return;
    }

    if (_mode === 'enter') {
      if (_locked) return;
      const ok = await StorageManager.init(pin);
      if (ok) {
        _attempts = 0;
        await _launchApp();
      } else {
        _attempts++;
        _shake();
        const remaining = 5 - _attempts;
        if (_attempts >= 5) {
          _startLockout();
        } else {
          _setError(`PIN incorrect — ${remaining} essai${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`);
        }
      }
    }
  }

  function _startLockout() {
    _locked = true;
    let seconds = 30;
    _setSubtitle(`Trop d'essais — réessayez dans ${seconds}s`);
    _setError('');
    _lockTimer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(_lockTimer);
        _locked = false;
        _attempts = 0;
        _setSubtitle('Entrez votre PIN');
      } else {
        _setSubtitle(`Trop d'essais — réessayez dans ${seconds}s`);
      }
    }, 1000);
  }

  async function _launchApp() {
    try {
      const data = await StorageManager.load();
      _hide();
      // Déclencher l'initialisation de l'app avec les données
      if (typeof appInit === 'function') {
        await appInit(data);
      }
    } catch (e) {
      _setError('Erreur de chargement des données');
    }
  }

  /* ── API publique ── */
  return {
    async start() {
      _show();
      if (StorageManager.isFirstLaunch()) {
        _mode = StorageManager.hasLegacyData() ? 'create' : 'create';
        _setSubtitle('Créez votre PIN (4 chiffres)');
        if (StorageManager.hasLegacyData()) {
          _el('pin-migrate-msg').style.display = 'block';
        }
      } else {
        _mode = 'enter';
        _setSubtitle('Entrez votre PIN');
      }
      _clear();
    },

    lock() {
      StorageManager.lock();
      this.start();
    },

    press(digit) {
      if (_locked || _buffer.length >= 4) return;
      _buffer += digit;
      _updateDots();
      if (_buffer.length === 4) {
        setTimeout(_submit, 100); // petit délai pour voir le 4ème point
      }
    },

    del() {
      if (_locked) return;
      _buffer = _buffer.slice(0, -1);
      _updateDots();
      _setError('');
    }
  };
})();

/* ── Verrouillage automatique avec période de grâce ── */
const LOCK_GRACE_MS = 5 * 60 * 1000; // 5 minutes
let _hiddenAt = null;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    _hiddenAt = Date.now();
  } else {
    const elapsed = _hiddenAt ? Date.now() - _hiddenAt : Infinity;
    if (elapsed >= LOCK_GRACE_MS) {
      PinManager.lock();
    }
    _hiddenAt = null;
  }
});
