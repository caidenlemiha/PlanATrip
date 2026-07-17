import type { DateSuggestion, DestinationSuggestion } from '../lib/suggest'

export function AlternateDates({ suggestions, searched }: { suggestions: DateSuggestion[]; searched: boolean }) {
  if (suggestions.length === 0) {
    if (!searched) return null
    return (
      <div className="card suggestions-card">
        <h3>These dates might work better</h3>
        <p className="muted small">Nearby dates carry similar weather risk this time of year &mdash; try a different month.</p>
      </div>
    )
  }
  return (
    <div className="card suggestions-card">
      <h3>These dates might work better</h3>
      <ul className="suggestion-list">
        {suggestions.map((s) => (
          <li key={s.date}>
            <strong>{s.date}</strong>
            <span className="muted small"> &mdash; MYR {s.priceMYR} &middot; {s.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AlternateDestinations({ suggestions, searched }: { suggestions: DestinationSuggestion[]; searched: boolean }) {
  if (suggestions.length === 0) {
    if (!searched) return null
    return (
      <div className="card suggestions-card">
        <h3>Or consider these nearby destinations instead</h3>
        <p className="muted small">Nearby destinations carry similar weather risk this time of year &mdash; try a different region.</p>
      </div>
    )
  }
  return (
    <div className="card suggestions-card">
      <h3>Or consider these nearby destinations instead</h3>
      <ul className="suggestion-list">
        {suggestions.map((s) => (
          <li key={s.airport.iata}>
            <strong>{s.airport.city} ({s.airport.iata})</strong>
            <span className="muted small"> &mdash; MYR {s.priceMYR} &middot; {s.monsoonRisk === 'none' ? 'clear weather outlook' : `${s.monsoonRisk} weather risk`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
