import { useReducer, useEffect } from 'preact/hooks';
import type { Signal } from '../../store';

export function useSignal<T>(signal: Signal<T>): T {
  const [, rerender] = useReducer(x => x + 1, 0);
  useEffect(() => signal.subscribe(() => rerender(undefined)), [signal]);
  return signal.value;
}
