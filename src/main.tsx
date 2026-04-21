/* ═══════════════════════════════════════════════════════════════
   main.tsx — Point d'entrée v5 (Preact)
   ═══════════════════════════════════════════════════════════════ */

import { h, render } from 'preact';
import { App } from './ui/App';
import './main.css';

render(<App />, document.getElementById('app')!);
