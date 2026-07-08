import { useState } from 'react'
import type { Category, Day, FestEvent } from '../types'
import { byTime, CATEGORIES, DAYS } from '../lib/schedule'
import { EventCard } from '../components/EventCard'
import eventsData from '../data/events.json'

const events = eventsData as FestEvent[]

interface ProgramTabProps {
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
  friendsByEvent: Map<string, string[]>
}

export function ProgramTab({ favorites, onToggleFavorite, friendsByEvent }: ProgramTabProps) {
  const [day, setDay] = useState<Day>('ven')
  const [category, setCategory] = useState<Category | 'all'>('all')

  const list = events
    .filter((e) => e.day === day && (category === 'all' || e.category === category))
    .sort(byTime)

  return (
    <section aria-label="Programme">
      <div className="day-picker" role="tablist" aria-label="Jour">
        {DAYS.map((d) => (
          <button
            key={d.key}
            type="button"
            role="tab"
            aria-selected={day === d.key}
            className={`day-btn day-${d.key}${day === d.key ? ' is-active' : ''}`}
            onClick={() => setDay(d.key)}
          >
            <span className="day-name">{d.label}</span>
            <span className="day-date">{d.date}</span>
          </button>
        ))}
      </div>

      <div className="chip-row" aria-label="Filtrer par type">
        <button
          type="button"
          className={`chip${category === 'all' ? ' is-active' : ''}`}
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
        >
          Tout
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip chip-${c.key}${category === c.key ? ' is-active' : ''}`}
            aria-pressed={category === c.key}
            onClick={() => setCategory(category === c.key ? 'all' : c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="list-count">
        {list.length === 0
          ? 'Rien dans cette catégorie ce jour-là'
          : `${list.length} événement${list.length > 1 ? 's' : ''}`}
      </p>

      <div className="card-list">
        {list.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            isFavorite={favorites.has(e.id)}
            onToggleFavorite={onToggleFavorite}
            friends={friendsByEvent.get(e.id)}
          />
        ))}
      </div>
    </section>
  )
}
