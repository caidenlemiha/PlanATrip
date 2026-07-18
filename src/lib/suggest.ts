import type { Airport, WeatherAssessment } from '../types'
import { addDays } from './util'
import { getFlightOffer } from './flights'
import { getWeatherAssessment } from './weather'
import { nearbyAirports } from './airports'

export interface DateSuggestion {
  date: string
  priceMYR: number
  monsoonRisk: WeatherAssessment['monsoonRisk']
  reason: string
}

export interface DestinationSuggestion {
  airport: Airport
  priceMYR: number
  monsoonRisk: WeatherAssessment['monsoonRisk']
}

/** Sparse sample of dates within +/- windowDays of aroundDate, checked for price + weather risk. */
export async function suggestAlternateDates(
  origin: Airport,
  destination: Airport,
  aroundDate: string,
  currentPriceMYR: number,
  windowDays = 12,
): Promise<DateSuggestion[]> {
  const offsets: number[] = []
  for (let d = -windowDays; d <= windowDays; d += 3) {
    if (d !== 0) offsets.push(d)
  }
  const candidateDates = offsets.map((d) => addDays(aroundDate, d))

  const results = await Promise.all(
    candidateDates.map(async (date) => {
      const offer = getFlightOffer(origin, destination, date)
      const weather = await getWeatherAssessment(destination, date)
      return { date, priceMYR: offer.priceMYR, monsoonRisk: weather.monsoonRisk }
    }),
  )

  return results
    .filter((r) => r.monsoonRisk !== 'high')
    .sort((a, b) => a.priceMYR - b.priceMYR)
    .slice(0, 3)
    .map((r) => ({
      ...r,
      reason:
        r.monsoonRisk === 'none' || r.monsoonRisk === 'low'
          ? r.priceMYR < currentPriceMYR
            ? 'Cheaper fare and lower weather risk'
            : 'Lower weather risk'
          : 'Cheaper fare',
    }))
}

/** Nearby airports as alternate destinations, filtered to those without high monsoon/storm risk on this date. */
export async function suggestAlternateDestinations(
  origin: Airport,
  destination: Airport,
  date: string,
): Promise<DestinationSuggestion[]> {
  const candidates = nearbyAirports(destination, 3500, 8)

  const results = await Promise.all(
    candidates.map(async (airport) => {
      const offer = getFlightOffer(origin, airport, date)
      const weather = await getWeatherAssessment(airport, date)
      return { airport, priceMYR: offer.priceMYR, monsoonRisk: weather.monsoonRisk }
    }),
  )

  return results
    .filter((r) => r.monsoonRisk !== 'high')
    .sort((a, b) => a.priceMYR - b.priceMYR)
    .slice(0, 3)
}
