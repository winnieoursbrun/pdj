import { useState } from 'react'
import type { FestEvent } from '../types'
import { CATEGORY_LABEL, formatRange } from '../lib/schedule'
import { UmbrellaButton } from './Umbrella'

interface EventCardProps {
  event: FestEvent
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}

export function EventCard({ event, isFavorite, onToggleFavorite }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)
  const details = event.description ?? event.subtype

  return (
    <article className={`card cat-${event.category}`}>
      <div className="card-pills">
        <span className="pill pill-time">{formatRange(event)}</span>
        <span className="pill pill-cat">
          {event.subtype ?? CATEGORY_LABEL[event.category]}
        </span>
      </div>
      <div className="card-body">
        <div className="card-text">
          <h3 className="card-title">{event.title}</h3>
          {event.artist && <p className="card-artist">{event.artist}</p>}
          <p className="card-venue">{event.venue}</p>
        </div>
        <UmbrellaButton
          active={isFavorite}
          title={event.title}
          onToggle={() => onToggleFavorite(event.id)}
        />
      </div>
      {event.description && (
        <>
          <button
            type="button"
            className="card-more"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Réduire' : 'En savoir plus'}
          </button>
          {expanded && <p className="card-desc">{details}</p>}
        </>
      )}
    </article>
  )
}
