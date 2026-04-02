/* ═══════════════════════════════════════════════════════════════
   pin.ts — Écran PIN (création + vérification + lockout)
   ═══════════════════════════════════════════════════════════════ */

import { Store } from '../storage/store';

type PinMode = 'create' | 'confirm' | 'enter';

let _resolve: ((pin: string) => void) | null = null;
let _mode: PinMode = 'enter';
let _buffer = '';
let _createPin = '';
let _attempts = 0;
let _locked = false;
let _lockTimer: ReturnType<typeof setTimeout> | null = null;

// ── DOM helpers ───────────────────────────────────────────────

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function setSubtitle(text: string) {
  el('pin-subtitle').textContent = text;
}

function setError(text: string) {
  const e = el('pin-error');
  e.textContent = text;
  e.classList.toggle('visible', !!text);
  if (text) setTimeout(() => e.classList.remove('visible'), 3000);
}

function updateDots() {
  for (let i = 0; i < 4; i++) {
    el(`dot-${i}`).classList.toggle('filled', i < _buffer.length);
  }
}

function shake() {
  const dots = el('pin-dots');
  dots.classList.add('shake');
  setTimeout(() => dots.classList.remove('shake'), 500);
}

function clear() {
  _buffer = '';
  updateDots();
  setError('');
}

// ── Lockout ───────────────────────────────────────────────────

function startLockout() {
  _locked = true;
  let secs = 30;
  const tick = () => {
    setError(`Trop de tentatives. Réessayez dans ${secs}s`);
    if (--secs < 0) {
      _locked = false;
      _attempts = 0;
      setError('');
    } else {
      _lockTimer = setTimeout(tick, 1000);
    }
  };
  tick();
}

// ── Soumission du PIN ─────────────────────────────────────────

async function submit() {
  const pin = _buffer;
  clear();

  if (_mode === 'create') {
    if (pin.length < 4) { setError('PIN trop court'); return; }
    _createPin = pin;
    _mode = 'confirm';
    setSubtitle('Confirmez votre PIN');
    return;
  }

  if (_mode === 'confirm') {
    if (pin !== _createPin) {
      shake();
      setError('Les PIN ne correspondent pas');
      _mode = 'create';
      _createPin = '';
      setSubtitle('Créez votre PIN (4 chiffres)');
      return;
    }
    // PIN confirmé — on résout la promesse
    _resolve?.(pin);
    _resolve = null;
    return;
  }

  if (_mode === 'enter') {
    if (_locked) return;
    // Vérification rapide : on tente de dériver la clé
    const ok = await Store.init(pin);
    if (ok) {
      _attempts = 0;
      _resolve?.(pin);
      _resolve = null;
    } else {
      _attempts++;
      shake();
      if (_attempts >= 5) {
        startLockout();
      } else {
        setError(`PIN incorrect (${5 - _attempts} essais restants)`);
      }
    }
    return;
  }
}

// ── API publique ──────────────────────────────────────────────

export const PinUI = {

  /**
   * Affiche l'écran PIN et retourne le PIN saisi quand validé.
   * En premier lancement, passe en mode création.
   */
  prompt(): Promise<string> {
    const isFirst = Store.isFirstLaunch();
    _mode = isFirst ? 'create' : 'enter';
    setSubtitle(isFirst ? 'Créez votre PIN (4 chiffres)' : 'Entrez votre PIN');
    setError('');
    clear();
    el('pin-screen').style.display = 'flex';
    el('app').style.display = 'none';

    return new Promise(resolve => { _resolve = resolve; });
  },

  hide() {
    el('pin-screen').style.display = 'none';
    el('app').style.display = 'block';
  },

  showError(msg: string) {
    setError(msg);
  },

  press(digit: string) {
    if (_locked || _buffer.length >= 4) return;
    _buffer += digit;
    updateDots();
    if (_buffer.length === 4) setTimeout(submit, 100);
  },

  del() {
    _buffer = _buffer.slice(0, -1);
    updateDots();
  },
};

// Exposer globalement pour les onclick HTML
(window as any).pinPress = PinUI.press.bind(PinUI);
(window as any).pinDel   = PinUI.del.bind(PinUI);
