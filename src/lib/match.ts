import type { Airport, WeatherAssessment } from '../types'
import { getFlightOffer } from './flights'
import { getWeatherAssessment } from './weather'
import { getHolidayInfo } from './holidays'

export interface MatchResult {
  destination: Airport
  date: string
  priceMYR: number
  monsoonRisk: WeatherAssessment['monsoonRisk']
  conditions: string
  originHoliday: boolean
  score: number
}

const RISK_SCORE: Record<WeatherAssessment['monsoonRisk'], number> = { none: 3, low: 2, moderate: 1, high: -1 }

/**
 * Ranks destination/date combinations within budget by weather suitability (best),
 * price (cheaper within budget scores higher), with a small bonus when the departure
 * date falls on an origin public holiday (easier to travel without using leave).
 */
export async function findBestMatches(
  origin: Airport,
  destinations: Airport[],
  dates: string[],
  minMYR: number,
  maxMYR: number,
): Promise<MatchResult[]> {
  const originHolidayByDate = new Map<string, boolean>()
  await Promise.all(
    dates.map(async (date) => {
      const h = await getHolidayInfo(origin.countryCode, date)
      originHolidayByDate.set(date, Boolean(h?.isHoliday))
    }),
  )

  const combos = destinations.flatMap((destination) => dates.map((date) => ({ destination, date })))

  const results = await Promise.all(
    combos.map(async ({ destination, date }) => {
      const offer = getFlightOffer(origin, destination, date)
      const weather = await getWeatherAssessment(destination, date)
      const originHoliday = originHolidayByDate.get(date) ?? false
      const score = RISK_SCORE[weather.monsoonRisk] * 100 - offer.priceMYR / 20 + (originHoliday ? 30 : 0)
      return {
        destination,
        date,
        priceMYR: offer.priceMYR,
        monsoonRisk: weather.monsoonRisk,
        conditions: weather.conditions,
        originHoliday,
        score,
      }
    }),
  )

  return results
    .filter((r) => r.monsoonRisk !== 'high' && r.priceMYR >= minMYR && r.priceMYR <= maxMYR)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}
