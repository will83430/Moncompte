/* ═══════════════════════════════════════════════════════════════
   notifications.ts — Notifications push récurrentes en attente
   ═══════════════════════════════════════════════════════════════ */

import { LocalNotifications } from '@capacitor/local-notifications';
import type { AppData } from '../core/types';
import { currentMonthKey } from '../core/balance';

const NOTIF_ID_RECURRING = 1001;

/**
 * Demande la permission si nécessaire, puis programme une notification
 * quotidienne à 9h si des récurrentes sont en attente pour ce mois.
 */
export async function scheduleRecurringReminder(data: AppData, accountId: string): Promise<void> {
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
  if (!isCapacitor) return; // uniquement sur Android

  // Vérifier permission
  let { display } = await LocalNotifications.checkPermissions();
  if (display !== 'granted') {
    const res = await LocalNotifications.requestPermissions();
    if (res.display !== 'granted') return;
  }

  // Compter les récurrentes en attente ce mois
  const month = currentMonthKey();
  const pending = data.recs.filter(r =>
    r.accountId === accountId &&
    r.active &&
    !data.txs.some(t => t.recId === r.id && t.date.startsWith(month))
  );

  // Annuler toute notification existante
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID_RECURRING }] });

  if (pending.length === 0) return;

  // Programmer pour aujourd'hui à 9h (ou dans 5s si déjà passé 9h, pour test immédiat)
  const now = new Date();
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  if (at <= now) at.setDate(at.getDate() + 1); // demain 9h si déjà passé

  const mLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long' });

  await LocalNotifications.schedule({
    notifications: [{
      id:    NOTIF_ID_RECURRING,
      title: 'MonCompte — Récurrentes en attente',
      body:  `${pending.length} récurrente${pending.length > 1 ? 's' : ''} à importer pour ${mLabel}`,
      at,
      sound: undefined,
      smallIcon: 'ic_stat_icon_config_sample',
    }],
  });
}

/**
 * Annule le rappel récurrentes (ex: quand toutes importées).
 */
export async function cancelRecurringReminder(): Promise<void> {
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
  if (!isCapacitor) return;
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID_RECURRING }] });
}
