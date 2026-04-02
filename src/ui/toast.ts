/* ═══════════════════════════════════════════════════════════════
   toast.ts — Notifications temporaires
   ═══════════════════════════════════════════════════════════════ */

let _timer: ReturnType<typeof setTimeout> | null = null;

export function toast(msg: string, duration = 2500) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('visible');
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(() => el!.classList.remove('visible'), duration);
}

// Exposer globalement
(window as any).toast = toast;
