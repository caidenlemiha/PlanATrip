import { useState } from 'react'
import type { Airport } from '../types'
import { AirportAutocomplete } from '../components/AirportAutocomplete'
import { CurrencySelector } from '../components/CurrencySelector'
import { DashboardResults } from '../components/DashboardResults'
import { addDays, todayStr } from '../lib/util'
import { findAirport } from '../lib/airports'

export interface DashboardQuery {
  originQuery: string
  originAirport: Airport
  destQuery: string
  destAirport: Airport
  departDate: string
  returnDate: string
  currency: string
}

export function Dashboard() {
  const [originQuery, setOriginQuery] = useState('Kuala Lumpur (KUL)')
  const [originAirport, setOriginAirport] = useState<Airport | undefined>(findAirport('KUL'))
  const [destQuery, setDestQuery] = useState('')
  const [destAirport, setDestAirport] = useState<Airport | undefined>(undefined)
  const [departDate, setDepartDate] = useState(addDays(todayStr(), 30))
  const [returnDate, setReturnDate] = useState(addDays(todayStr(), 37))
  const [currency, setCurrency] = useState('MYR')
  const [query, setQuery] = useState<DashboardQuery | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!originAirport) {
      setFormError('Pick an origin from the suggestions so it can be matched to an airport.')
      return
    }
    if (!destAirport) {
      setFormError('Pick a destination from the suggestions so it can be matched to an airport.')
      return
    }
    if (!departDate) {
      setFormError('Pick a departure date.')
      return
    }
    setFormError(null)
    setQuery({ originQuery, originAirport, destQuery, destAirport, departDate, returnDate, currency })
  }

  return (
    <div className="page">
      <h1>Trip Dashboard</h1>
      <p className="muted">Check flight price, weather outlook, holidays, and timezones for a route and date range.</p>

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
        <AirportAutocomplete
          label="Destination"
          placeholder="Type a city, airport, or country"
          value={destQuery}
          onChange={(q, a) => {
            setDestQuery(q)
            setDestAirport(a)
          }}
        />
        <div className="field">
          <label htmlFor="departDate">Depart</label>
          <input id="departDate" type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="returnDate">Return (optional)</label>
          <input id="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <CurrencySelector value={currency} onChange={setCurrency} />
        <button type="submit" className="primary">Search</button>
      </form>
      {formError && <p className="error">{formError}</p>}

      {query && <DashboardResults query={query} />}
    </div>
  )
}
