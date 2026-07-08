import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  decryptState,
  deriveGroupKeys,
  encryptState,
  generateGroupCode,
  normalizeCode,
  type MemberState,
} from '../lib/group'
import {
  generateSecretKey,
  getPublicKey,
  publishState,
  skFromHex,
  skToHex,
  subscribeGroup,
} from '../lib/nostr'

const GROUP_KEY = 'pdj26-group'
const SK_KEY = 'pdj26-group-sk'
const MEMBERS_KEY = 'pdj26-group-members'
const PUBLISH_DEBOUNCE_MS = 2000

// Identité stable de l'appareil : réutilisée quand on quitte/rejoint un
// groupe, pour que notre événement remplaçable écrase l'ancien au lieu de
// laisser un membre fantôme sur les relais.
function deviceSk(): string {
  const existing = localStorage.getItem(SK_KEY)
  if (existing) {
    return existing
  }
  const sk = skToHex(generateSecretKey())
  localStorage.setItem(SK_KEY, sk)
  return sk
}

interface StoredGroup {
  code: string
  name: string
  sk: string
}

function loadStored(): StoredGroup | null {
  try {
    const raw = localStorage.getItem(GROUP_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as StoredGroup
    if (
      typeof parsed.code === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.sk === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function loadMembers(): Record<string, MemberState> {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) ?? '{}') as Record<
      string,
      MemberState
    >
  } catch {
    return {}
  }
}

export function useGroup(favorites: Set<string>) {
  const [stored, setStored] = useState<StoredGroup | null>(loadStored)
  const [members, setMembers] = useState<Record<string, MemberState>>(loadMembers)
  const [syncTick, setSyncTick] = useState(0)

  const myPubkey = useMemo(
    () => (stored ? getPublicKey(skFromHex(stored.sk)) : null),
    [stored],
  )

  // Réveil : retour du réseau ou de l'app au premier plan → réabonnement
  // (les WebSockets sont coupés en arrière-plan sur mobile) + republication.
  useEffect(() => {
    if (!stored) {
      return
    }
    const bump = () => setSyncTick((t) => t + 1)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        bump()
      }
    }
    window.addEventListener('online', bump)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', bump)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [stored])

  // Abonnement aux états des membres du groupe.
  useEffect(() => {
    if (!stored) {
      return
    }
    let cancelled = false
    let unsubscribe: (() => void) | null = null
    void deriveGroupKeys(stored.code).then(({ key, tag }) => {
      if (cancelled) {
        return
      }
      unsubscribe = subscribeGroup(tag, (pubkey, content) => {
        void decryptState(key, content).then((state) => {
          if (!state || cancelled) {
            return
          }
          setMembers((prev) => {
            const existing = prev[pubkey]
            if (existing && existing.updatedAt >= state.updatedAt) {
              return prev
            }
            const next = { ...prev }
            if (state.left) {
              delete next[pubkey]
            } else {
              next[pubkey] = state
            }
            localStorage.setItem(MEMBERS_KEY, JSON.stringify(next))
            return next
          })
        })
      })
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [stored, syncTick])

  // Publication débouncée de mon propre état.
  useEffect(() => {
    if (!stored) {
      return
    }
    const timer = setTimeout(() => {
      void deriveGroupKeys(stored.code).then(async ({ key, tag }) => {
        const state: MemberState = {
          name: stored.name,
          favorites: [...favorites],
          updatedAt: Date.now(),
        }
        const payload = await encryptState(key, state)
        await publishState(skFromHex(stored.sk), tag, payload)
      })
    }, PUBLISH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [stored, favorites, syncTick])

  const enter = useCallback((code: string, name: string) => {
    const next: StoredGroup = { code, name, sk: deviceSk() }
    localStorage.setItem(GROUP_KEY, JSON.stringify(next))
    localStorage.removeItem(MEMBERS_KEY)
    setMembers({})
    setStored(next)
  }, [])

  const create = useCallback(
    (name: string): string => {
      const code = generateGroupCode()
      enter(code, name)
      return code
    },
    [enter],
  )

  const join = useCallback(
    (codeInput: string, name: string) => {
      enter(normalizeCode(codeInput), name)
    },
    [enter],
  )

  const leave = useCallback(() => {
    if (stored) {
      // Tombstone best-effort : si un relais est joignable, les autres
      // membres purgent immédiatement mes favoris de leur timeline.
      const leaving = stored
      void deriveGroupKeys(leaving.code).then(async ({ key, tag }) => {
        const payload = await encryptState(key, {
          name: leaving.name,
          favorites: [],
          updatedAt: Date.now(),
          left: true,
        })
        await publishState(skFromHex(leaving.sk), tag, payload)
      })
    }
    localStorage.removeItem(GROUP_KEY)
    localStorage.removeItem(MEMBERS_KEY)
    setStored(null)
    setMembers({})
  }, [stored])

  // Les copains = tous les états reçus sauf le mien.
  const others = useMemo(
    () =>
      Object.entries(members)
        .filter(([pubkey]) => pubkey !== myPubkey)
        .map(([, state]) => state),
    [members, myPubkey],
  )

  const friendsByEvent = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const member of others) {
      for (const id of member.favorites) {
        map.set(id, [...(map.get(id) ?? []), member.name])
      }
    }
    return map
  }, [others])

  return {
    group: stored ? { code: stored.code, name: stored.name } : null,
    others,
    create,
    join,
    leave,
    friendsByEvent,
  }
}

export type GroupApi = ReturnType<typeof useGroup>
