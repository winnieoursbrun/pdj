import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MemberState } from './group'
import { notifyFriendPresence, resetNotifiedPresences } from './presenceNotifications'

// Ids réels stables du programme (voir events.json), qui se chevauchent
// le vendredi à 17h30 : LARZAC ! (17:00 – 18:30) et la nocturne (17:00 – 21:30).
const LARZAC = 'larzac-ven-1700'
const NOCTURNE = 'nocturne-exposantes-ven-1700'
const DURING_BOTH = new Date(2026, 6, 17, 17, 30).getTime()
const AFTER_FESTIVAL = new Date(2026, 6, 21, 12, 0).getTime()

class MockNotification {
  static permission: NotificationPermission = 'granted'
  static instances: MockNotification[] = []
  onclick: (() => void) | null = null
  title: string
  options?: NotificationOptions

  constructor(title: string, options?: NotificationOptions) {
    this.title = title
    this.options = options
    MockNotification.instances.push(this)
  }
}

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    value,
    configurable: true,
  })
}

function makeState(overrides: Partial<MemberState> = {}): MemberState {
  return {
    name: 'Max',
    favorites: [],
    updatedAt: 1000,
    at: LARZAC,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('pdj26-reminders-enabled', 'true')
  MockNotification.permission = 'granted'
  MockNotification.instances = []
  vi.stubGlobal('Notification', MockNotification)
  setVisibilityState('hidden')
})

afterEach(() => {
  vi.unstubAllGlobals()
  setVisibilityState('visible')
})

describe('notifyFriendPresence', () => {
  it('notifie quand un copain signale « j’y suis » et que l’appli est en arrière-plan', () => {
    notifyFriendPresence('friend-pk', undefined, makeState(), DURING_BOTH)

    expect(MockNotification.instances).toHaveLength(1)
    expect(MockNotification.instances[0].title).toContain('Max')
    expect(MockNotification.instances[0].title).toContain('LARZAC')
  })

  it('ne notifie pas quand l’appli est au premier plan (la pastille suffit)', () => {
    setVisibilityState('visible')
    notifyFriendPresence('friend-pk', undefined, makeState(), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne notifie pas si les notifications sont désactivées dans l’appli', () => {
    localStorage.setItem('pdj26-reminders-enabled', 'false')
    notifyFriendPresence('friend-pk', undefined, makeState(), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne notifie pas sans permission de notification', () => {
    MockNotification.permission = 'default'
    notifyFriendPresence('friend-pk', undefined, makeState(), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne notifie pas si la présence n’a pas changé', () => {
    notifyFriendPresence('friend-pk', makeState({ updatedAt: 500 }), makeState(), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne notifie pas un état sans présence ni un tombstone', () => {
    notifyFriendPresence('friend-pk', undefined, makeState({ at: undefined }), DURING_BOTH)
    notifyFriendPresence('friend-pk', undefined, makeState({ left: true }), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne notifie pas une présence sur un événement terminé ou inconnu', () => {
    notifyFriendPresence('friend-pk', undefined, makeState(), AFTER_FESTIVAL)
    notifyFriendPresence('friend-pk', undefined, makeState({ at: 'id-inconnu' }), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne notifie qu’une fois par (membre, événement), même après réabonnement', () => {
    notifyFriendPresence('friend-pk', undefined, makeState({ updatedAt: 1000 }), DURING_BOTH)
    // Le relais rejoue le même état (ou une mise à jour sans changement de lieu).
    notifyFriendPresence('friend-pk', undefined, makeState({ updatedAt: 2000 }), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(1)
  })

  it('notifie à nouveau pour un autre événement ou un autre membre', () => {
    notifyFriendPresence('friend-pk', undefined, makeState(), DURING_BOTH)
    notifyFriendPresence(
      'friend-pk',
      makeState(),
      makeState({ at: NOCTURNE, updatedAt: 2000 }),
      DURING_BOTH,
    )
    notifyFriendPresence('other-pk', undefined, makeState({ name: 'Léa' }), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(3)
  })

  it('resetNotifiedPresences() oublie le dédoublonnage', () => {
    notifyFriendPresence('friend-pk', undefined, makeState(), DURING_BOTH)
    resetNotifiedPresences()
    notifyFriendPresence('friend-pk', undefined, makeState({ updatedAt: 2000 }), DURING_BOTH)
    expect(MockNotification.instances).toHaveLength(2)
  })
})
