/* ═══════════════════════════════════════════════════════════════
   main.ts — Point d'entrée de l'application v2
   ═══════════════════════════════════════════════════════════════ */

import { boot } from './ui/app';

// Importer les modules UI pour enregistrer les handlers globaux
import './ui/pin';
import './ui/router';
import './ui/dashboard';
import './ui/txModal';
import './ui/addForm';
import './ui/rec';
import './ui/analyse';
import './ui/toast';

// Services exposés globalement
import { exportJSON, importJSON, exportCSV } from './services/backup';
import { getState, setState } from './ui/app';

(window as any).exportJSON = () => exportJSON(getState());
(window as any).exportCSV  = () => exportCSV(getState());
(window as any).importJSON = () => importJSON(async (data) => {
  await setState(data);
  import('./ui/toast').then(m => m.toast(`✓ ${data.txs.length} transactions restaurées`));
});

// Lancer l'application dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
