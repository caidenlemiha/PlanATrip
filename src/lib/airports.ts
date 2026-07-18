import airportsData from '../data/airports.json'
import type { Airport } from '../types'
import { haversineKm } from './util'

export const airports: Airport[] = airportsData as Airport[]

/** Resolve free-text input (city, IATA code, or airport name) to matching airports, best match first. */
export function resolveAirports(query: string, limit = 6): Airport[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const scored = airports
    .map((a) => ({ airport: a, score: matchScore(a, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((r) => r.airport)
}

function matchScore(a: Airport, q: string): number {
  if (a.iata.toLowerCase() === q) return 100
  if (a.city.toLowerCase() === q) return 90
  if (a.city.toLowerCase().startsWith(q)) return 70
  if (a.aliases.some((alias) => alias === q)) return 85
  if (a.aliases.some((alias) => alias.startsWith(q))) return 60
  if (a.aliases.some((alias) => alias.includes(q))) return 40
  if (a.name.toLowerCase().includes(q)) return 30
  if (a.country.toLowerCase().includes(q)) return 20
  return 0
}

export function findAirport(iata: string): Airport | undefined {
  return airports.find((a) => a.iata === iata)
}

export function distanceKm(a: Airport, b: Airport): number {
  return haversineKm(a.lat, a.lon, b.lat, b.lon)
}

/** Airports in the same broad region as the given one (for alternate-destination suggestions), excluding itself. */
export function nearbyAirports(a: Airport, withinKm = 2500, limit = 6): Airport[] {
  return airports
    .filter((b) => b.iata !== a.iata)
    .map((b) => ({ airport: b, dist: distanceKm(a, b) }))
    .filter((r) => r.dist <= withinKm)
    .sort((x, y) => x.dist - y.dist)
    .slice(0, limit)
    .map((r) => r.airport)
}
