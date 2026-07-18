import { useEffect, useState } from 'react'
import type { Airport } from '../types'
import { AirportAutocomplete } from '../components/AirportAutocomplete'
import { CurrencySelector } from '../components/CurrencySelector'
import { findAirport } from '../lib/airports'
import { addDays, sampleDateRange, todayStr } from '../lib/util'
import { convertFromMYR, convertToMYR, formatMoney } from '../lib/currency'
import { findBestMatches, type MatchResult } from '../lib/match'

const DEFAULT_DESTINATION_CODES = ['NRT', 'BKK', 'SIN', 'ICN', 'DPS', 'CDG']

export function BudgetMatcher() {
  const [originQuery, setOriginQuery] = useState('Kuala Lumpur (KUL)')
  const [originAirport, setOriginAirport] = useState<Airport | undefined>(findAirport('KUL'))
  const [destQuery, setDestQuery] = useState('')
  const [destinations, setDestinations] = useState<Airport[]>([])
  const [minBudget, setMinBudget] = useState('0')
  const [maxBudget, setMaxBudget] = useState('2000')
  const [currency, setCurrency] = useState('MYR')
  const [startDate, setStartDate] = useState(addDays(todayStr(), 21))
  const [endDate, setEndDate] = useState(addDays(todayStr(), 60))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MatchResult[] | null>(null)

  function addDestination(airport: Airport | undefined) {
    if (!airport) return
    setDestinations((prev) => (prev.some((a) => a.iata === airport.iata) ? prev : [...prev, airport]))
    setDestQuery('')
  }

  function removeDestination(iata: string) {
    setDestinations((prev) => prev.filter((a) => a.iata !== iata))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!originAirport) {
      setError('Pick an origin from the suggestions so it can be matched to an airport.')
      return
    }
    setError(null)
    setLoading(true)
    setResults(null)

    const candidateDestinations =
      destinations.length > 0
        ? destinations
        : DEFAULT_DESTINATION_CODES.map((code) => findAirport(code)).filter(
            (a): a is Airport => Boolean(a) && a!.iata !== originAirport.iata,
          )

    const dates = sampleDateRange(startDate, endDate, 3)
    const [minMYR, maxMYR] = await Promise.all([
      convertToMYR(Number(minBudget) || 0, currency),
      convertToMYR(Number(maxBudget) || Infinity, currency),
    ])

    const matches = await findBestMatches(originAirport, candidateDestinations, dates, minMYR, maxMYR)
    setResults(matches)
    setLoading(false)
  }

  return (
    <div className="page">
      <h1>Budget Matcher</h1>
      <p className="muted">
        Set a budget, pick destinations (or leave blank to search popular ones) and a date window &mdash; get ranked
        options by price and weather suitability.
      </p>

      <form className="search-form" onSubmit={handleSubmit}>
        <AirportAutocomplete
          label="Origin"
          placeholder="Type a city, airport, or country"
          value={originQuery}
          onChange={(q, a) => {
            setOriginQuery(q)
            setOriginAirport(a)
          }}
        />

        <div className="field">
          <label>Destinations (optional)</label>
          <AirportAutocomplete
            label=""
            placeholder="Add a destination, or leave blank to search popular ones"
            value={destQuery}
            onChange={(q, a) => {
              setDestQuery(q)
              if (a) addDestination(a)
            }}
          />
          {destinations.length > 0 && (
            <div className="chip-row">
              {destinations.map((a) => (
                <span className="chip" key={a.iata}>
                  {a.city} ({a.iata})
                  <button type="button" onClick={() => removeDestination(a.iata)} aria-label={`Remove ${a.city}`}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="minBudget">Min budget</label>
          <input id="minBudget" type="number" min="0" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="maxBudget">Max budget</label>
          <input id="maxBudget" type="number" min="0" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
        </div>
        <CurrencySelector value={currency} onChange={setCurrency} />

        <div className="field">
          <label htmlFor="startDate">Earliest date</label>
          <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="endDate">Latest date</label>
          <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Searching…' : 'Find matches'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      {results && <MatchResults results={results} currency={currency} />}
    </div>
  )
}

function MatchResults({ results, currency }: { results: MatchResult[]; currency: string }) {
  if (results.length === 0) {
    return <p className="muted">No destination/date combination in this budget and window cleared the weather-risk bar. Try widening the budget or date range.</p>
  }
  return (
    <div className="results">
      <h2>Best matches</h2>
      <div className="card-row">
        {results.map((r) => (
          <MatchCard key={`${r.destination.iata}-${r.date}`} result={r} currency={currency} />
        ))}
      </div>
    </div>
  )
}

function MatchCard({ result, currency }: { result: MatchResult; currency: string }) {
  const [displayPrice, setDisplayPrice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    convertFromMYR(result.priceMYR, currency).then((amount) => {
      if (!cancelled) setDisplayPrice(formatMoney(amount, currency))
    })
    return () => {
      cancelled = true
    }
  }, [result.priceMYR, currency])

  return (
    <div className={`card match-card risk-${result.monsoonRisk}`}>
      <div className="price">{displayPrice ?? `MYR ${result.priceMYR}`}</div>
      <div>
        <strong>{result.destination.city} ({result.destination.iata})</strong>
      </div>
      <div className="muted small">{result.date}</div>
      <div className="muted small">{result.conditions}</div>
      <span className={`badge badge-${result.monsoonRisk}`}>{result.monsoonRisk === 'none' ? 'clear outlook' : `${result.monsoonRisk} weather risk`}</span>
      {result.originHoliday && <span className="badge badge-holiday">origin public holiday</span>}
    </div>
  )
}
