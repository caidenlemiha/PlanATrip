import staticData from '../data/flights.sample.json'
import type { Airport, FlightOffer } from '../types'
import { haversineKm, seededRandom, dayOfWeek } from './util'
import { zonedWallTimeToUtc, formatInZone } from './timezone'

const AIRLINE_POOL = [
  'Malaysia Airlines', 'AirAsia', 'Singapore Airlines', 'Cathay Pacific', 'ANA',
  'Japan Airlines', 'Korean Air', 'Emirates', 'Qatar Airways', 'Turkish Airlines',
  'Thai Airways', 'Vietnam Airlines', 'Philippine Airlines', 'Qantas',
  'Air France', 'British Airways', 'Lufthansa', 'KLM',
]

const TIME_SLOTS = ['06:15', '08:40', '10:20', '13:05', '16:30', '19:45', '22:10', '23:55']

interface StaticFlightsFile {
  fetchedAt: string | null
  offers: FlightOffer[]
}

function findStaticOffer(origin: string, destination: string, date: string): FlightOffer | undefined {
  const file = staticData as unknown as StaticFlightsFile
  return file.offers.find((o) => o.origin === origin && o.destination === destination && o.date === date)
}

function estimateBasePrice(distanceKm: number, stops: number, seed: string): number {
  const perKm = 0.42 // rough MYR/km international-economy heuristic
  const base = Math.max(180, distanceKm * perKm)
  const stopDiscount = stops === 0 ? 1 : 0.88
  const variance = 0.8 + seededRandom(seed) * 0.4 // +/-20%
  return Math.round((base * stopDiscount * variance) / 5) * 5
}

function estimateDurationMinutes(distanceKm: number, stops: number): number {
  const cruiseSpeedKmH = 830
  const flightMinutes = (distanceKm / cruiseSpeedKmH) * 60
  const taxiAndClimb = 45
  const layover = stops * 90
  return Math.round(flightMinutes + taxiAndClimb + layover)
}

function pickTimeSlot(seed: string): string {
  const idx = Math.floor(seededRandom(seed) * TIME_SLOTS.length)
  return TIME_SLOTS[idx]
}

/** Deterministic distance-based fare estimate, used whenever no real fetched fare is available for this route+date. */
function estimateFlightOffer(origin: Airport, destination: Airport, date: string): FlightOffer {
  const distKm = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon)
  const seedBase = `${origin.iata}-${destination.iata}-${date}`
  const stops = distKm > 6000 && seededRandom(seedBase + 'stops') > 0.4 ? 1 : 0
  const dow = dayOfWeek(date)
  const weekendSurcharge = dow === 5 || dow === 0 ? 1.08 : 1
  const airlineIdx = Math.floor(seededRandom(seedBase + 'airline') * AIRLINE_POOL.length)
  const priceMYR = Math.round(estimateBasePrice(distKm, stops, seedBase + 'price') * weekendSurcharge)
  const durationMinutes = estimateDurationMinutes(distKm, stops)
  const departTimeLocal = pickTimeSlot(seedBase + 'depart')

  const departUtc = zonedWallTimeToUtc(date, departTimeLocal, origin.timezone)
  const arriveUtc = new Date(departUtc.getTime() + durationMinutes * 60000)
  const arrival = formatInZone(arriveUtc, destination.timezone)

  return {
    origin: origin.iata,
    destination: destination.iata,
    date,
    airline: AIRLINE_POOL[airlineIdx],
    priceMYR,
    departDateLocal: date,
    departTimeLocal,
    arriveDateLocal: arrival.date,
    arriveTimeLocal: arrival.time,
    durationMinutes,
    stops,
    fetchedAt: 'estimate',
  }
}

/**
 * Look up a flight offer for the given route and date. Prefers real fetched data
 * (written by .github/workflows/refresh-flights.yml) and falls back to a distance-based
 * estimate so the app is usable for any route before that pipeline is configured.
 */
export function getFlightOffer(origin: Airport, destination: Airport, date: string): FlightOffer {
  return findStaticOffer(origin.iata, destination.iata, date) ?? estimateFlightOffer(origin, destination, date)
}

export function getFlightOffersForRange(origin: Airport, destination: Airport, dates: string[]): FlightOffer[] {
  return dates.map((d) => getFlightOffer(origin, destination, d))
}

export function isEstimated(offer: FlightOffer): boolean {
  return offer.fetchedAt === 'estimate'
}
