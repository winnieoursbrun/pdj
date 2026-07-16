import { byTime, CATEGORY_LABEL } from './schedule'
import type { FestEvent } from '../types'

// Lundi 20 juillet 2026, 9h — le lendemain de la fin du festival (dimanche 19 juillet).
export const RECAP_READY_AT = new Date(2026, 6, 20, 9, 0)

export function isRecapReady(now: Date = new Date()): boolean {
  return now.getTime() >= RECAP_READY_AT.getTime()
}

export type RecapCategoryCount = {
  category: string
  label: string
  count: number
}

export type RecapStats = {
  total: number
  daysAttended: number
  byCategory: RecapCategoryCount[]
  topVenue: { venue: string; count: number } | null
  first: FestEvent | null
  last: FestEvent | null
}

export function computeRecapStats(favoriteEvents: FestEvent[]): RecapStats {
  const sorted = [...favoriteEvents].sort(byTime)

  const categoryCounts = new Map<string, number>()
  const venueCounts = new Map<string, number>()
  const days = new Set<string>()

  for (const e of sorted) {
    categoryCounts.set(e.category, (categoryCounts.get(e.category) ?? 0) + 1)
    venueCounts.set(e.venue, (venueCounts.get(e.venue) ?? 0) + 1)
    days.add(e.day)
  }

  const byCategory = [...categoryCounts.entries()]
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] ?? category,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const topVenueEntry = [...venueCounts.entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    total: sorted.length,
    daysAttended: days.size,
    byCategory,
    topVenue: topVenueEntry ? { venue: topVenueEntry[0], count: topVenueEntry[1] } : null,
    first: sorted[0] ?? null,
    last: sorted[sorted.length - 1] ?? null,
  }
}
