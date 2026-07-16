import type { Category, Day, FestEvent } from '../types'

export const DAYS: { key: Day; label: string; date: string }[] = [
  { key: 'ven', label: 'Ven', date: '17' },
  { key: 'sam', label: 'Sam', date: '18' },
  { key: 'dim', label: 'Dim', date: '19' },
]

export const DAY_LONG: Record<Day, string> = {
  ven: 'Vendredi 17 juillet',
  sam: 'Samedi 18 juillet',
  dim: 'Dimanche 19 juillet',
}

// Ouverture des portes, vendredi 17 juillet à 16h30 (voir la FAQ "Horaires").
export const FESTIVAL_START = new Date(2026, 6, 17, 16, 30)

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'concert', label: 'Concerts' },
  { key: 'spectacle', label: 'Spectacles' },
  { key: 'conference', label: 'Conférences' },
  { key: 'atelier', label: 'Ateliers' },
  { key: 'bal', label: 'Bals' },
  { key: 'famille', label: 'En famille' },
  { key: 'balade', label: 'Balades' },
  { key: 'radio', label: 'Radio' },
  { key: 'imaginarium', label: 'Imaginarium' },
]

export const CATEGORY_LABEL: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
) as Record<Category, string>

const DAY_INDEX: Record<Day, number> = { ven: 0, sam: 1, dim: 2 }

// Les soirées débordent après minuit (jusqu'à 03:00) : une heure < 05:00
// appartient à la nuit du jour de grille et se trie après 23:59.
export function timeMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h < 5 ? h + 24 : h) * 60 + m
}

export function byTime(a: FestEvent, b: FestEvent): number {
  return (
    DAY_INDEX[a.day] * 10000 +
    timeMinutes(a.start) -
    (DAY_INDEX[b.day] * 10000 + timeMinutes(b.start))
  )
}

export function formatRange(e: FestEvent): string {
  const start = e.start.replace(':', 'h')
  return e.end ? `${start} – ${e.end.replace(':', 'h')}` : start
}

export function eventStartDate(e: FestEvent): Date {
  const dayInfo = DAYS.find((d) => d.key === e.day)
  if (!dayInfo) {
    throw new Error(`Unknown day: ${e.day}`)
  }
  const [hours, minutes] = e.start.split(':').map(Number)
  const date = hours < 5 ? Number(dayInfo.date) + 1 : Number(dayInfo.date)
  return new Date(2026, 6, date, hours, minutes)
}
