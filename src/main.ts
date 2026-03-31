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
import './ui/toast';

// Lancer l'application dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
