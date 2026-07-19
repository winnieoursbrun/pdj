// Un seul interrupteur de notifications pour toute l'appli : les rappels
// (useReminders) et les alertes de présence d'un copain (presenceNotifications)
// partagent la même clé — la clé garde son nom historique pour ne pas perdre
// le réglage des utilisateurs existants.
export const NOTIFICATIONS_ENABLED_KEY = 'pdj26-reminders-enabled'

/** Vrai si la permission est accordée ET que l'interrupteur de l'appli est actif. */
export function notificationsEnabled(): boolean {
  return (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted' &&
    localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'true'
  )
}
