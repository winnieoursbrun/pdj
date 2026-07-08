import { useCallback, useState } from 'react'

export type ReminderStatus = 'unsupported' | 'default' | 'denied' | 'enabled' | 'disabled'

const ENABLED_KEY = 'pdj26-reminders-enabled'

function isEnabledInStorage(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true'
}

function setEnabledInStorage(value: boolean) {
  localStorage.setItem(ENABLED_KEY, value ? 'true' : 'false')
}

function computeStatus(): ReminderStatus {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }
  if (Notification.permission === 'default') {
    return 'default'
  }
  return isEnabledInStorage() ? 'enabled' : 'disabled'
}

export function useReminders() {
  const [status, setStatus] = useState<ReminderStatus>(computeStatus)

  const enable = useCallback(() => {
    if (typeof Notification === 'undefined') {
      return
    }
    if (Notification.permission === 'granted') {
      setEnabledInStorage(true)
      setStatus('enabled')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    void Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        setEnabledInStorage(true)
        setStatus('enabled')
      } else {
        setStatus(permission === 'denied' ? 'denied' : 'default')
      }
    })
  }, [])

  const disable = useCallback(() => {
    setEnabledInStorage(false)
    setStatus('disabled')
  }, [])

  return { status, enable, disable }
}
