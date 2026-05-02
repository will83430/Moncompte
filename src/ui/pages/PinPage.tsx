import { h } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';
import { Store } from '../../storage/store';
import { appData, isLocked } from '../../store';
import { isBioEnabled, isBioAvailable, authenticateWithBio, getStoredPin, enableBio } from '../../services/biometric';
import type { AppData } from '../../core/types';

type PinMode = 'create' | 'confirm' | 'enter';

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;

function doUnlock(data: AppData) {
  appData.value  = data;
  isLocked.value = false;
}

export function PinPage() {
  const isFirst = Store.isFirstLaunch();
  const [mode,        setMode]        = useState<PinMode>(isFirst ? 'create' : 'enter');
  const [buffer,      setBuffer]      = useState('');
  const [createPin,   setCreatePin]   = useState('');
  const [error,       setError]       = useState('');
  const [shaking,     setShaking]     = useState(false);
  const [attempts,    setAttempts]    = useState(0);
  const [locked,      setLocked]      = useState(false);
  const [lockSecs,    setLockSecs]    = useState(0);
  const [bioAvail,    setBioAvail]    = useState(false);
  const [bioOffer,    setBioOffer]    = useState(false);
  const [pendingPin,  setPendingPin]  = useState('');
  const [pendingData, setPendingData] = useState<AppData | null>(null);

  useEffect(() => {
    if (isFirst) return;
    isBioAvailable().then(avail => {
      setBioAvail(avail);
      if (avail && isBioEnabled()) tryBio();
    });
  }, []);

  const tryBio = useCallback(async () => {
    const ok = await authenticateWithBio();
    if (!ok) return;
    const pin = getStoredPin();
    if (!pin) return;
    const valid = await Store.init(pin);
    if (valid) doUnlock(await Store.load());
  }, []);

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
      if (--secs < 0) { setLocked(false); setAttempts(0); setError(''); setLockSecs(0); }
      else setTimeout(tick, 1000);
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
        shake(); setError('Les PIN ne correspondent pas');
        setMode('create'); setCreatePin('');
        return;
      }
      const ok = await Store.init(pin);
      if (!ok) return;
      const data = await Store.load();
      if (bioAvail && !isBioEnabled()) {
        setPendingPin(pin); setPendingData(data); setBioOffer(true);
      } else {
        doUnlock(data);
      }
      return;
    }

    if (mode === 'enter') {
      if (locked) return;
      const ok = await Store.init(pin);
      if (ok) {
        const data = await Store.load();
        if (bioAvail && !isBioEnabled()) {
          setPendingPin(pin); setPendingData(data); setBioOffer(true);
        } else {
          doUnlock(data);
        }
      } else {
        const n = attempts + 1;
        setAttempts(n); shake();
        if (n >= 5) startLockout();
        else setError(`PIN incorrect (${5 - n} essais restants)`);
      }
    }
  }, [mode, createPin, locked, attempts, shake, startLockout, bioAvail]);

  const press = useCallback((digit: string) => {
    if (locked) return;
    if (digit === '⌫') { setBuffer(b => b.slice(0, -1)); return; }
    if (buffer.length >= 4) return;
    const next = buffer + digit;
    setBuffer(next); setError('');
    if (next.length === 4) setTimeout(() => { submit(next); setBuffer(''); }, 100);
  }, [buffer, locked, submit]);

  if (bioOffer && pendingData) {
    return (
      <div id="pin-screen">
        <div class="pin-header">
          <div class="pin-logo">MonCarnetCompte</div>
          <div class="pin-subtitle">Activer la biométrie ?</div>
        </div>
        <div style="padding:0 32px;text-align:center;">
          <div style="font-size:56px;margin:24px 0;">👆</div>
          <p style="color:var(--text2);font-size:14px;line-height:1.6;margin-bottom:32px;">
            Utilisez votre empreinte digitale pour déverrouiller l'app sans saisir votre PIN à chaque fois.
          </p>
          <button
            onClick={() => { enableBio(pendingPin); doUnlock(pendingData); }}
            style="width:100%;padding:14px;background:var(--teal);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;margin-bottom:12px;">
            Activer l'empreinte
          </button>
          <button
            onClick={() => doUnlock(pendingData)}
            style="width:100%;padding:14px;background:none;color:var(--text2);border:none;font-size:14px;cursor:pointer;font-family:'Inter',sans-serif;">
            Plus tard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="pin-screen">
      <div class="pin-header">
        <div class="pin-logo">MonCarnetCompte</div>
        <div class="pin-subtitle">{error || (mode === 'create' ? 'Créez votre PIN (4 chiffres)' : mode === 'confirm' ? 'Confirmez votre PIN' : 'Entrez votre PIN')}</div>
      </div>

      <div class={`pin-dots ${shaking ? 'shake' : ''}`}>
        {[0,1,2,3].map(i => <div key={i} class={`pin-dot ${i < buffer.length ? 'filled' : ''}`} />)}
      </div>

      {lockSecs > 0 && <div style="text-align:center;font-size:13px;color:var(--text3);margin-bottom:8px;">{lockSecs}s</div>}

      <div class="pin-pad">
        {DIGITS.map((d, i) => (
          d === '' ? (
            bioAvail && isBioEnabled()
              ? <button key={i} class="pin-key" style="font-size:24px;" onClick={tryBio}>👆</button>
              : <div key={i} />
          ) : (
            <button key={i} class="pin-key" onClick={() => press(d)} disabled={locked}>{d}</button>
          )
        ))}
      </div>
    </div>
  );
}
