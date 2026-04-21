/* ═══════════════════════════════════════════════════════════════
   store/index.ts — Store réactif v5
   Signals légers : signal() + computed() + effect()
   ═══════════════════════════════════════════════════════════════ */

import type { AppData } from '../core/types';
import { Store as CryptoStore } from '../storage/store';
import { scheduleAutoBackup } from '../services/backup';
import { scheduleAutoSync } from '../services/sync';

// ── Signals ──────────────────────────────────────────────────

type Listener<T> = (value: T) => void;

export class Signal<T> {
  private _value: T;
  private _listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    return this._value;
  }

  set value(next: T) {
    this._value = next;
    this._listeners.forEach(fn => fn(next));
  }

  subscribe(fn: Listener<T>): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  peek(): T {
    return this._value;
  }
}

export function signal<T>(initial: T): Signal<T> {
  return new Signal(initial);
}

export function computed<T>(fn: () => T, deps: Signal<unknown>[]): Signal<T> {
  const s = new Signal(fn());
  deps.forEach(dep => dep.subscribe(() => { s.value = fn(); }));
  return s;
}

export function effect(fn: () => void, deps: Signal<unknown>[]): () => void {
  const unsubs = deps.map(dep => dep.subscribe(() => fn()));
  return () => unsubs.forEach(u => u());
}

// ── État global ───────────────────────────────────────────────

export const appData   = signal<AppData | null>(null);
export const currentRoute = signal<string>('dash');
export const currentAccountId = signal<string>('cc');
export const isLocked  = signal<boolean>(true);

// ── Actions ───────────────────────────────────────────────────

export async function setAppData(next: AppData): Promise<void> {
  appData.value = next;
  await CryptoStore.save(next);
  scheduleAutoBackup(next);
  scheduleAutoSync(next);
}

export function getAppData(): AppData {
  const d = appData.value;
  if (!d) throw new Error('App non initialisée');
  return d;
}

export function navigate(route: string, accountId?: string): void {
  if (accountId) currentAccountId.value = accountId;
  currentRoute.value = route;
}
