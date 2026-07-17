#!/usr/bin/env node
// Fetches real fares from the Amadeus Self-Service API for the routes/date offsets
// listed in scripts/routes.config.json and writes them to src/data/flights.sample.json
// in the shape the frontend (src/lib/flights.ts) expects.
//
// Requires AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in the environment
// (set as GitHub Actions secrets — see .github/workflows/refresh-flights.yml).

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ROUTES_CONFIG_PATH = path.join(ROOT, 'scripts', 'routes.config.json')
const OUTPUT_PATH = path.join(ROOT, 'src', 'data', 'flights.sample.json')

const AMADEUS_BASE = 'https://test.api.amadeus.com'

async function getAccessToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET are not set — sign up for a free key at developers.amadeus.com')
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.access_token
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function isoDurationToMinutes(iso) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso ?? '')
  const hours = Number(match?.[1] ?? 0)
  const minutes = Number(match?.[2] ?? 0)
  return hours * 60 + minutes
}

async function fetchCheapestOffer(token, origin, destination, date) {
  const url = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`)
  url.searchParams.set('originLocationCode', origin)
  url.searchParams.set('destinationLocationCode', destination)
  url.searchParams.set('departureDate', date)
  url.searchParams.set('adults', '1')
  url.searchParams.set('currencyCode', 'MYR')
  url.searchParams.set('max', '5')

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    console.warn(`  ! ${origin}->${destination} ${date}: ${res.status} ${await res.text()}`)
    return null
  }
  const data = await res.json()
  const offers = data.data ?? []
  if (offers.length === 0) return null

  const cheapest = offers.reduce((a, b) => (Number(a.price.total) <= Number(b.price.total) ? a : b))
  const outbound = cheapest.itineraries[0]
  const segments = outbound.segments
  const first = segments[0]
  const last = segments[segments.length - 1]

  const [departDateLocal, departTimeLocal] = first.departure.at.split('T')
  const [arriveDateLocal, arriveTimeLocalFull] = last.arrival.at.split('T')

  return {
    origin,
    destination,
    date,
    airline: first.carrierCode,
    priceMYR: Math.round(Number(cheapest.price.total)),
    departDateLocal,
    departTimeLocal: departTimeLocal.slice(0, 5),
    arriveDateLocal,
    arriveTimeLocal: arriveTimeLocalFull.slice(0, 5),
    durationMinutes: isoDurationToMinutes(outbound.duration),
    stops: segments.length - 1,
    fetchedAt: new Date().toISOString(),
  }
}

async function main() {
  const config = JSON.parse(await readFile(ROUTES_CONFIG_PATH, 'utf-8'))
  const token = await getAccessToken()
  const today = new Date().toISOString().slice(0, 10)

  const offers = []
  for (const { origin, destination } of config.routes) {
    for (const offset of config.daysFromTodayOffsets) {
      const date = addDays(today, offset)
      console.log(`Fetching ${origin} -> ${destination} on ${date}...`)
      const offer = await fetchCheapestOffer(token, origin, destination, date)
      if (offer) offers.push(offer)
      await new Promise((r) => setTimeout(r, 300)) // be polite to the rate limit
    }
  }

  const output = { fetchedAt: new Date().toISOString(), note: 'Fetched from the Amadeus Self-Service API by scripts/fetch-flights.mjs', offers }
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')
  console.log(`Wrote ${offers.length} offers to ${path.relative(ROOT, OUTPUT_PATH)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
