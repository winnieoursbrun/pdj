import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReminders } from './useReminders'
import type { FestEvent } from '../types'

class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn()
  static instances: MockNotification[] = []
  onclick: (() => void) | null = null
  constructor(
    public title: string,
    public options?: NotificationOptions,
  ) {
    MockNotification.instances.push(this)
  }
}

beforeEach(() => {
  localStorage.clear()
  MockNotification.permission = 'default'
  MockNotification.requestPermission = vi.fn()
  MockNotification.instances = []
  vi.stubGlobal('Notification', MockNotification)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useReminders status', () => {
  it('démarre à "default" quand la permission n\'a jamais été demandée', () => {
    const { result } = renderHook(() => useReminders())
    expect(result.current.status).toBe('default')
  })

  it('passe à "enabled" quand enable() obtient la permission', async () => {
    MockNotification.requestPermission.mockResolvedValue('granted' as NotificationPermission)
    const { result } = renderHook(() => useReminders())

    await act(async () => {
      result.current.enable()
    })

    expect(result.current.status).toBe('enabled')
    expect(localStorage.getItem('pdj26-reminders-enabled')).toBe('true')
  })

  it('passe à "denied" quand le navigateur refuse la permission', async () => {
    MockNotification.requestPermission.mockResolvedValue('denied' as NotificationPermission)
    const { result } = renderHook(() => useReminders())

    await act(async () => {
      result.current.enable()
    })

    expect(result.current.status).toBe('denied')
  })

  it('ne redemande pas la permission si elle est déjà refusée', () => {
    MockNotification.permission = 'denied'
    const { result } = renderHook(() => useReminders())

    act(() => {
      result.current.enable()
    })

    expect(MockNotification.requestPermission).not.toHaveBeenCalled()
    expect(result.current.status).toBe('denied')
  })

  it('passe de "enabled" à "disabled" via disable()', () => {
    MockNotification.permission = 'granted'
    localStorage.setItem('pdj26-reminders-enabled', 'true')
    const { result } = renderHook(() => useReminders())
    expect(result.current.status).toBe('enabled')

    act(() => {
      result.current.disable()
    })

    expect(result.current.status).toBe('disabled')
    expect(localStorage.getItem('pdj26-reminders-enabled')).toBe('false')
  })

  it('vaut "unsupported" quand l\'API Notification est absente', () => {
    vi.unstubAllGlobals()
    const { result } = renderHook(() => useReminders([]))
    expect(result.current.status).toBe('unsupported')
  })
})

describe('useReminders scheduling', () => {
  function makeEvent(overrides: Partial<FestEvent> = {}): FestEvent {
    return {
      id: 'evt-1',
      title: 'Concert test',
      artist: null,
      day: 'sam',
      start: '21:00',
      end: '22:00',
      venue: 'Scène test',
      category: 'concert',
      subtype: null,
      description: null,
      ...overrides,
    }
  }

  beforeEach(() => {
    MockNotification.permission = 'granted'
    localStorage.setItem('pdj26-reminders-enabled', 'true')
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('déclenche une notification 15 minutes avant le début d\'un favori', () => {
    vi.setSystemTime(new Date(2026, 6, 18, 20, 44))
    renderHook(({ events }) => useReminders(events), {
      initialProps: { events: [makeEvent()] },
    })

    expect(MockNotification.instances).toHaveLength(0)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(MockNotification.instances).toHaveLength(1)
    expect(MockNotification.instances[0].title).toBe('Concert test')
  })

  it('rattrape immédiatement si la fenêtre de rappel est déjà entamée', () => {
    vi.setSystemTime(new Date(2026, 6, 18, 20, 50)) // 10 min avant, fenêtre déjà ouverte
    renderHook(({ events }) => useReminders(events), {
      initialProps: { events: [makeEvent()] },
    })

    expect(MockNotification.instances).toHaveLength(1)
  })

  it('ne déclenche rien si l\'événement a déjà commencé', () => {
    vi.setSystemTime(new Date(2026, 6, 18, 21, 30))
    renderHook(({ events }) => useReminders(events), {
      initialProps: { events: [makeEvent()] },
    })

    act(() => {
      vi.advanceTimersByTime(10 * 60_000)
    })
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne redéclenche pas le même événement lors d\'un nouveau visibilitychange', () => {
    vi.setSystemTime(new Date(2026, 6, 18, 20, 50))
    renderHook(({ events }) => useReminders(events), {
      initialProps: { events: [makeEvent()] },
    })
    expect(MockNotification.instances).toHaveLength(1)

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(MockNotification.instances).toHaveLength(1)
  })

  it('annule le rappel en attente si le favori est retiré', () => {
    vi.setSystemTime(new Date(2026, 6, 18, 20, 44))
    const { rerender } = renderHook(({ events }) => useReminders(events), {
      initialProps: { events: [makeEvent()] },
    })

    rerender({ events: [] })
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(MockNotification.instances).toHaveLength(0)
  })

  it('ne programme rien tant que le statut n\'est pas "enabled"', () => {
    MockNotification.permission = 'default'
    localStorage.removeItem('pdj26-reminders-enabled')
    vi.setSystemTime(new Date(2026, 6, 18, 20, 59))
    renderHook(({ events }) => useReminders(events), {
      initialProps: { events: [makeEvent()] },
    })

    act(() => {
      vi.advanceTimersByTime(5 * 60_000)
    })
    expect(MockNotification.instances).toHaveLength(0)
  })
})
