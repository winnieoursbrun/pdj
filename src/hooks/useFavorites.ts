import { useCallback, useState } from 'react'
import * as Sentry from '@sentry/react'

const STORAGE_KEY = 'pdj26-favorites'

function load(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(load)

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      const action = next.has(id) ? 'remove' : 'add'
      if (action === 'remove') {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      Sentry.metrics.count('favorite.toggle', 1, { attributes: { action } })
      return next
    })
  }, [])

  return { favorites, toggle }
}
