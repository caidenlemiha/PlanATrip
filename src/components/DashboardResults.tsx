import { useEffect, useState } from 'react'
import type { DashboardQuery } from '../pages/Dashboard'
import type { WeatherAssessment, HolidayInfo } from '../types'
import { getFlightOffer } from '../lib/flights'
import { getWeatherAssessment } from '../lib/weather'
import { getHolidayInfo } from '../lib/holidays'
import { suggestAlternateDates, suggestAlternateDestinations, type DateSuggestion, type DestinationSuggestion } from '../lib/suggest'
import { FlightCard } from './FlightCard'
import { WeatherPanel } from './WeatherPanel'
import { HolidayBadge } from './HolidayBadge'
import { PromoList } from './PromoList'
import { AlternateDates, AlternateDestinations } from './AlternateSuggestions'

interface AsyncState<T> {
  data: T | null
  loading: boolean
}

export function DashboardResults({ query }: { query: DashboardQuery }) {
  const { originAirport, destAirport, departDate, returnDate, currency } = query

  const outboundOffer = getFlightOffer(originAirport, destAirport, departDate)
  const returnOffer = returnDate ? getFlightOffer(destAirport, originAirport, returnDate) : null

  const [departWeather, setDepartWeather] = useState<AsyncState<WeatherAssessment>>({ data: null, loading: true })
  const [returnWeather, setReturnWeather] = useState<AsyncState<WeatherAssessment>>({ data: null, loading: Boolean(returnDate) })
  const [originHoliday, setOriginHoliday] = useState<AsyncState<HolidayInfo | null>>({ data: null, loading: true })
  const [destHolidayDepart, setDestHolidayDepart] = useState<AsyncState<HolidayInfo | null>>({ data: null, loading: true })
  const [destHolidayReturn, setDestHolidayReturn] = useState<AsyncState<HolidayInfo | null>>({ data: null, loading: Boolean(returnDate) })
  const [altDates, setAltDates] = useState<DateSuggestion[]>([])
  const [altDatesSearched, setAltDatesSearched] = useState(false)
  const [altDestinations, setAltDestinations] = useState<DestinationSuggestion[]>([])
  const [altDestinationsSearched, setAltDestinationsSearched] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDepartWeather({ data: null, loading: true })
    setOriginHoliday({ data: null, loading: true })
    setDestHolidayDepart({ data: null, loading: true })
    setAltDates([])
    setAltDatesSearched(false)
    setAltDestinations([])
    setAltDestinationsSearched(false)

    getWeatherAssessment(destAirport, departDate).then((w) => {
      if (cancelled) return
      setDepartWeather({ data: w, loading: false })
      if (w.monsoonRisk === 'high') {
        suggestAlternateDates(originAirport, destAirport, departDate, outboundOffer.priceMYR).then((s) => {
          if (!cancelled) {
            setAltDates(s)
            setAltDatesSearched(true)
          }
        })
        suggestAlternateDestinations(originAirport, destAirport, departDate).then((s) => {
          if (!cancelled) {
            setAltDestinations(s)
            setAltDestinationsSearched(true)
          }
        })
      }
    })

    getHolidayInfo(originAirport.countryCode, departDate).then((h) => {
      if (!cancelled) setOriginHoliday({ data: h, loading: false })
    })
    getHolidayInfo(destAirport.countryCode, departDate).then((h) => {
      if (!cancelled) setDestHolidayDepart({ data: h, loading: false })
    })

    if (returnDate) {
      setReturnWeather({ data: null, loading: true })
      setDestHolidayReturn({ data: null, loading: true })
      getWeatherAssessment(destAirport, returnDate).then((w) => {
        if (!cancelled) setReturnWeather({ data: w, loading: false })
      })
      getHolidayInfo(destAirport.countryCode, returnDate).then((h) => {
        if (!cancelled) setDestHolidayReturn({ data: h, loading: false })
      })
    } else {
      setReturnWeather({ data: null, loading: false })
      setDestHolidayReturn({ data: null, loading: false })
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originAirport.iata, destAirport.iata, departDate, returnDate])

  return (
    <div className="results">
      <section>
        <h2>Flights</h2>
        <div className="card-row">
          <FlightCard offer={outboundOffer} origin={originAirport} destination={destAirport} currency={currency} />
          {returnOffer && (
            <FlightCard offer={returnOffer} origin={destAirport} destination={originAirport} currency={currency} />
          )}
        </div>
      </section>

      <section>
        <h2>Weather outlook</h2>
        <div className="card-row">
          <WeatherPanel label={`${destAirport.city} on ${departDate}`} weather={departWeather.data} loading={departWeather.loading} />
          {returnDate && (
            <WeatherPanel label={`${destAirport.city} on ${returnDate}`} weather={returnWeather.data} loading={returnWeather.loading} />
          )}
        </div>
      </section>

      <section>
        <h2>Public holidays</h2>
        <HolidayBadge label={`${originAirport.city} (origin) on ${departDate}`} info={originHoliday.data} loading={originHoliday.loading} />
        <HolidayBadge label={`${destAirport.city} (destination) on ${departDate}`} info={destHolidayDepart.data} loading={destHolidayDepart.loading} />
        {returnDate && (
          <HolidayBadge label={`${destAirport.city} (destination) on ${returnDate}`} info={destHolidayReturn.data} loading={destHolidayReturn.loading} />
        )}
      </section>

      <PromoList origin={originAirport} destination={destAirport} />

      <AlternateDates suggestions={altDates} searched={altDatesSearched} />
      <AlternateDestinations suggestions={altDestinations} searched={altDestinationsSearched} />
    </div>
  )
}
