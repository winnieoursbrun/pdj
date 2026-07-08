import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReminders } from './useReminders'

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
    const { result } = renderHook(() => useReminders())
    expect(result.current.status).toBe('unsupported')
  })
})
