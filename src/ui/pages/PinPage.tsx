import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { Store } from '../../storage/store';
import { appData, isLocked } from '../../store';

type PinMode = 'create' | 'confirm' | 'enter';

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;

export function PinPage() {
  const isFirst = Store.isFirstLaunch();
  const [mode,      setMode]      = useState<PinMode>(isFirst ? 'create' : 'enter');
  const [buffer,    setBuffer]    = useState('');
  const [createPin, setCreatePin] = useState('');
  const [error,     setError]     = useState('');
  const [shaking,   setShaking]   = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const [locked,    setLocked]    = useState(false);
  const [lockSecs,  setLockSecs]  = useState(0);

  const subtitle = mode === 'create'  ? 'Créez votre PIN (4 chiffres)'
                 : mode === 'confirm' ? 'Confirmez votre PIN'
                 :                      'Entrez votre PIN';

  const shake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  const startLockout = useCallback(() => {
    setLocked(true);
    let secs = 30;
    const tick = () => {
      setLockSecs(secs);
      setError(`Trop de tentatives. Réessayez dans ${secs}s`);
      if (--secs < 0) {
        setLocked(false);
        setAttempts(0);
        setError('');
        setLockSecs(0);
      } else {
        setTimeout(tick, 1000);
      }
    };
    tick();
  }, []);

  const submit = useCallback(async (pin: string) => {
    if (mode === 'create') {
      if (pin.length < 4) { setError('PIN trop court'); return; }
      setCreatePin(pin);
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      if (pin !== createPin) {
        shake();
        setError('Les PIN ne correspondent pas');
        setMode('create');
        setCreatePin('');
        return;
      }
      const ok = await Store.init(pin);
      if (ok) {
        const data = await Store.load();
        appData.value  = data;
        isLocked.value = false;
      }
      return;
    }

    if (mode === 'enter') {
      if (locked) return;
      const ok = await Store.init(pin);
      if (ok) {
        const data = await Store.load();
        appData.value  = data;
        isLocked.value = false;
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        shake();
        if (newAttempts >= 5) {
          startLockout();
        } else {
          setError(`PIN incorrect (${5 - newAttempts} essais restants)`);
        }
      }
    }
  }, [mode, createPin, locked, attempts, shake, startLockout]);

  const press = useCallback((digit: string) => {
    if (locked) return;
    if (digit === '⌫') {
      setBuffer(b => b.slice(0, -1));
      return;
    }
    if (buffer.length >= 4) return;
    const next = buffer + digit;
    setBuffer(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => {
        submit(next);
        setBuffer('');
      }, 100);
    }
  }, [buffer, locked, submit]);

  return (
    <div id="pin-screen">
      <div class="pin-header">
        <div class="pin-logo">MonCarnetCompte</div>
        <div class="pin-subtitle">{subtitle}</div>
      </div>

      <div class={`pin-dots ${shaking ? 'shake' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i} class={`pin-dot ${i < buffer.length ? 'filled' : ''}`} />
        ))}
      </div>

      {error && <div class="pin-error visible">{error}</div>}

      <div class="pin-pad">
        {DIGITS.map((d, i) => (
          d === '' ? <div key={i} /> :
          <button
            key={i}
            class="pin-key"
            onClick={() => press(d)}
            disabled={locked}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

