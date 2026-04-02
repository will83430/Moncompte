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
(window as any).restoreBackup = async () => {
  const { toast } = await import('./ui/toast');
  try {
    const Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
    if (!Filesystem) { toast('Plugin Filesystem non disponible'); return; }

    const result = await Filesystem.readFile({
      path:      'moncarnetcompte_backup.json',
      directory: 'EXTERNAL',
      encoding:  'utf8',
    });

    const raw = JSON.parse(result.data as string);
    const { migrateV1toV2 } = await import('./core/migrations');

    let data = null;
    if (raw.version === 2 && Array.isArray(raw.txs)) {
      data = raw;
    } else if (Array.isArray(raw.txs)) {
      data = migrateV1toV2({ data: raw, balRef: raw.balanceRef, accounts: raw.accounts, customCats: raw.customCats });
    }

    if (!data) { toast('Format de sauvegarde invalide'); return; }
    await setState(data);
    toast(`✓ ${data.txs.length} transactions restaurées`);
  } catch (e: any) {
    toast('Erreur : ' + (e?.message ?? String(e)));
  }
};

// Lancer l'application dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
