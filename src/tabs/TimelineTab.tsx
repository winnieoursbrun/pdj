import type { Day, FestEvent } from '../types'
import { byTime, DAY_LONG, DAYS, formatRange } from '../lib/schedule'
import { UmbrellaButton } from '../components/Umbrella'
import eventsData from '../data/events.json'

const events = eventsData as FestEvent[]

interface TimelineTabProps {
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}

export function TimelineTab({ favorites, onToggleFavorite }: TimelineTabProps) {
  const mine = events.filter((e) => favorites.has(e.id)).sort(byTime)

  if (mine.length === 0) {
    return (
      <section className="timeline-empty" aria-label="Ma timeline">
        <svg viewBox="0 0 24 24" className="empty-umbrella" aria-hidden="true">
          <path d="M12 2.5c-5.5 0-9.5 4-9.8 8.7 0 .3.3.55.6.4 1-.5 2.4-.8 3.4-.1.4.3.9.3 1.3 0 1.2-.9 2.6-.9 3.8 0 .4.3.9.3 1.3 0 1.2-.9 2.6-.9 3.8 0 .4.3.9.3 1.3 0 1-.7 2.4-.4 3.4.1.3.15.6-.1.6-.4C21.5 6.5 17.5 2.5 12 2.5Z" />
          <path
            d="M12 12v6.5a1.6 1.6 0 0 1-3.2 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <h2>Ta timeline est vide</h2>
        <p>
          Ouvre le parapluie d'un concert, d'un atelier ou d'une conférence dans le
          Programme pour le retrouver ici, dans l'ordre du week-end.
        </p>
      </section>
    )
  }

  const byDay = DAYS.map((d) => ({
    day: d.key as Day,
    items: mine.filter((e) => e.day === d.key),
  })).filter((g) => g.items.length > 0)

  return (
    <section aria-label="Ma timeline">
      {byDay.map((group) => (
        <div key={group.day} className="tl-day">
          <h2 className={`tl-day-title day-${group.day}`}>{DAY_LONG[group.day]}</h2>
          <ol className="tl-list">
            {group.items.map((e) => (
              <li key={e.id} className={`tl-item cat-${e.category}`}>
                <span className="tl-dot" aria-hidden="true" />
                <div className="tl-content">
                  <span className="pill pill-time">{formatRange(e)}</span>
                  <h3 className="card-title">{e.title}</h3>
                  {e.artist && <p className="card-artist">{e.artist}</p>}
                  <p className="card-venue">{e.venue}</p>
                </div>
                <UmbrellaButton
                  active
                  title={e.title}
                  onToggle={() => onToggleFavorite(e.id)}
                />
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  )
}
