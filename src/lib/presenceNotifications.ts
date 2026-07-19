import * as Sentry from '@sentry/react'
import eventsData from '../data/events.json'
import type { FestEvent } from '../types'
import type { MemberState } from './group'
import { notificationsEnabled } from './notifications'
import { formatRange, isEventOngoing } from './schedule'

const NOTIFIED_KEY = 'pdj26-presence-notified'

const eventById = new Map((eventsData as FestEvent[]).map((e) => [e.id, e]))

function loadNotified(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

/** Oublie les présences déjà notifiées (au moment de créer/rejoindre/quitter un groupe). */
export function resetNotifiedPresences() {
  localStorage.removeItem(NOTIFIED_KEY)
}

/**
 * Notification locale quand un copain vient de signaler « j'y suis » et que
 * l'appli tourne en arrière-plan — au premier plan la pastille jaune suffit.
 * Une seule notification par (membre, événement), persistée : les relais
 * rejouent le dernier état de chacun à chaque réabonnement.
 */
export function notifyFriendPresence(
  pubkey: string,
  previous: MemberState | undefined,
  next: MemberState,
  now: number = Date.now(),
) {
  if (!next.at || next.left || next.at === previous?.at) {
    return
  }
  if (document.visibilityState !== 'hidden') {
    return
  }
  if (!notificationsEnabled()) {
    return
  }
  const event = eventById.get(next.at)
  if (!event || !isEventOngoing(event, now)) {
    return
  }
  const dedupKey = `${pubkey}:${next.at}`
  const notified = loadNotified()
  if (notified.has(dedupKey)) {
    return
  }
  notified.add(dedupKey)
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified]))

  const notification = new Notification(`📍 ${next.name} est à « ${event.title} »`, {
    body: `${formatRange(event)} · ${event.venue}`,
  })
  notification.onclick = () => window.focus()
  Sentry.metrics.count('group.presence.notified', 1)
}
