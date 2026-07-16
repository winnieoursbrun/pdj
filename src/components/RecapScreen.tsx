import { computeRecapStats } from '../lib/recap'
import { DAY_LONG, formatRange } from '../lib/schedule'
import type { FestEvent } from '../types'

interface RecapScreenProps {
  favoriteEvents: FestEvent[]
  onClose: () => void
}

export function RecapScreen({ favoriteEvents, onClose }: RecapScreenProps) {
  const stats = computeRecapStats(favoriteEvents)

  return (
    <div className="recap-backdrop" role="dialog" aria-modal="true" aria-label="Récap de ton festival">
      <div className="recap-content">
        <button type="button" className="recap-close" aria-label="Fermer le récap" onClick={onClose}>
          ✕
        </button>
        <h2 className="recap-title">Ton festival en un coup d'œil</h2>

        {stats.total === 0 ? (
          <p className="recap-empty">
            Tu n'as mis aucun événement en favori cette année — à l'année prochaine !
          </p>
        ) : (
          <>
            <p className="recap-count">
              {stats.total} événement{stats.total > 1 ? 's' : ''} vu{stats.total > 1 ? 's' : ''} sur{' '}
              {stats.daysAttended} jour{stats.daysAttended > 1 ? 's' : ''}
            </p>

            <ul className="recap-stat-list">
              {stats.topVenue && (
                <li className="recap-stat-row">
                  <span className="recap-stat-label">Lieu préféré</span>
                  <span className="recap-stat-value">{stats.topVenue.venue}</span>
                </li>
              )}
              {stats.first && (
                <li className="recap-stat-row">
                  <span className="recap-stat-label">Premier favori</span>
                  <span className="recap-stat-value">
                    {stats.first.title} · {DAY_LONG[stats.first.day]} {formatRange(stats.first)}
                  </span>
                </li>
              )}
              {stats.last && stats.last.id !== stats.first?.id && (
                <li className="recap-stat-row">
                  <span className="recap-stat-label">Dernier favori</span>
                  <span className="recap-stat-value">
                    {stats.last.title} · {DAY_LONG[stats.last.day]} {formatRange(stats.last)}
                  </span>
                </li>
              )}
            </ul>

            <h3 className="recap-subtitle">Par catégorie</h3>
            <ul className="recap-category-list">
              {stats.byCategory.map((c) => (
                <li key={c.category} className="recap-category-row">
                  <span className="recap-category-label">{c.label}</span>
                  <span className="recap-category-count">{c.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
