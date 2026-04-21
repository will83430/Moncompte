import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useSignal } from '../hooks/useSignal';
import { appData, currentAccountId, currentRoute } from '../../store';
import { renderStats } from '../stats';
import { currentMonthKey } from '../../core/balance';
import { useState } from 'preact/hooks';
import type { MonthKey, AccountId } from '../../core/types';

function changeMonth(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` as MonthKey;
}

function monthLabel(month: MonthKey): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function StatsPage() {
  const data      = useSignal(appData)!;
  const accountId = useSignal(currentAccountId) as AccountId;
  const ref       = useRef<HTMLDivElement>(null);

  const [month, setMonth] = useState<MonthKey>(currentMonthKey);
  const [mode,  setMode]  = useState<'reel'|'previsionnel'>('reel');

  useEffect(() => {
    if (!data || !ref.current) return;
    const el = document.getElementById('sec-stats');
    if (el) renderStats(data, month, accountId, mode);
  }, [data, month, accountId, mode]);

  return (
    <div class="section active" id="sec-stats" ref={ref}>
      <div class="month-nav">
        <button class="mn-arrow" onClick={() => setMonth(m => changeMonth(m, -1))}>‹</button>
        <span class="mn-lbl-stats">{monthLabel(month)}</span>
        <button class="mn-arrow" onClick={() => setMonth(m => changeMonth(m, 1))}>›</button>
      </div>
      <div class="mode-toggle">
        <button class={`mode-btn${mode === 'reel' ? ' mode-on' : ''}`} onClick={() => setMode('reel')}>Réel</button>
        <button class={`mode-btn${mode === 'previsionnel' ? ' mode-on' : ''}`} onClick={() => setMode('previsionnel')}>Prévisionnel</button>
      </div>
    </div>
  );
}
