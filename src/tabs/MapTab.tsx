import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import type { Venue, VenueGroup } from '../types'
import venuesData from '../data/venues.json'

const venues = venuesData as Venue[]

const GROUPS: { key: VenueGroup; label: string }[] = [
  { key: 'programmation', label: 'Programmation' },
  { key: 'accueil', label: 'Accueil public' },
  { key: 'bienetre', label: 'Bien-être' },
  { key: 'vente', label: 'Boutique, bar & restauration' },
]

const ADDRESS = '290 Route des Diligences, 50800 Champrepus'
const MAPS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

export function MapTab() {
  return (
    <section aria-label="Carte du site">
      <div className="map-frame">
        <TransformWrapper minScale={1} maxScale={6} doubleClick={{ mode: 'zoomIn' }}>
          <TransformComponent
            wrapperClass="map-wrapper"
            contentClass="map-content"
          >
            <img
              src={`${import.meta.env.BASE_URL}map.png`}
              alt="Plan du site du festival avec 23 points numérotés, détaillés dans la légende ci-dessous"
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>
        <p className="map-hint">Pince ou double-tape pour zoomer</p>
      </div>

      <a className="address-card" href={MAPS_HREF} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="address-pin">
          <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span className="address-text">{ADDRESS}</span>
        <span className="address-cta">Ouvrir dans Plans</span>
      </a>

      <div className="legend">
        {GROUPS.map((g) => (
          <details key={g.key} className={`legend-group legend-${g.key}`} open={g.key === 'programmation'}>
            <summary>{g.label}</summary>
            <ol className="legend-list">
              {venues
                .filter((v) => v.group === g.key)
                .map((v) => (
                  <li key={v.num}>
                    <span className="legend-num">{v.num}</span>
                    {v.name}
                  </li>
                ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  )
}
