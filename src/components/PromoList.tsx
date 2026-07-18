import promosData from '../data/promos.json'
import type { Airport, Promo } from '../types'

interface Props {
  origin?: Airport
  destination?: Airport
}

export function PromoList({ origin, destination }: Props) {
  const promos = promosData as Promo[]
  const relevant = promos.filter(
    (p) =>
      (origin && p.regions.includes(origin.countryCode)) ||
      (destination && p.regions.includes(destination.countryCode)),
  )

  if (relevant.length === 0) return null

  return (
    <div className="card promo-card">
      <h3>Recurring sales worth watching for this route</h3>
      <p className="muted small">
        Curated list of known recurring promotions &mdash; not live-scraped yet, so treat timing as approximate and check the airline's site closer to the window.
      </p>
      <ul className="promo-list">
        {relevant.map((p) => (
          <li key={p.title}>
            <div>
              <strong>{p.airline}</strong> &mdash; {p.title}
            </div>
            <div className="muted small">Typically: {p.typicalWindow}</div>
            <div className="muted small">{p.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
