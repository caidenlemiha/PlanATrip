import priceHistoryData from '../data/priceHistory.json'
import type { Airport, BuyTiming, FlightOffer, PriceHistoryEntry, PricePosition } from '../types'
import { getBaselineFareMYR } from './flights'
import { haversineKm } from './util'

const MIN_SAMPLES_FOR_HISTORY = 8
const MIN_SAMPLES_PER_BUCKET = 3

interface PriceHistoryFile {
  entries: PriceHistoryEntry[]
}

function historyForRoute(origin: string, destination: string): PriceHistoryEntry[] {
  const file = priceHistoryData as unknown as PriceHistoryFile
  return file.entries.filter((e) => e.origin === origin && e.destination === destination)
}

/**
 * Is the quoted/estimated price low, mid, or high compared to what this route usually costs?
 * Prefers this route's own accumulated fare history once there's enough of it; before that,
 * falls back to comparing against this app's own distance-based fare model, clearly labeled.
 */
export function getPricePosition(origin: Airport, destination: Airport, date: string, offer: FlightOffer): PricePosition {
  const history = historyForRoute(origin.iata, destination.iata)

  if (history.length >= MIN_SAMPLES_FOR_HISTORY) {
    const prices = history.map((h) => h.priceMYR).sort((a, b) => a - b)
    const rank = prices.filter((p) => p <= offer.priceMYR).length
    const percentile = (rank / prices.length) * 100
    const median = prices[Math.floor(prices.length / 2)]

    return {
      label: percentile <= 33 ? 'low' : percentile >= 67 ? 'high' : 'mid',
      ratio: offer.priceMYR / median,
      source: 'history',
      sampleSize: prices.length,
    }
  }

  const baseline = getBaselineFareMYR(origin, destination, date)
  const ratio = offer.priceMYR / baseline

  return {
    label: ratio < 0.9 ? 'low' : ratio > 1.15 ? 'high' : 'mid',
    ratio,
    source: 'estimate',
  }
}

interface LeadTimeBucket {
  label: string
  min: number
  max: number
}

const BUCKETS: LeadTimeBucket[] = [
  { label: '0-2 weeks', min: 0, max: 13 },
  { label: '2-4 weeks', min: 14, max: 29 },
  { label: '1-2 months', min: 30, max: 59 },
  { label: '2-3 months', min: 60, max: 89 },
  { label: '3+ months', min: 90, max: Infinity },
]

function heuristicBuyTiming(origin: Airport, destination: Airport): BuyTiming {
  const distKm = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon)
  const window = distKm < 2000 ? '6-8 weeks' : distKm < 6000 ? '8-12 weeks' : '12-20 weeks (3-5 months)'

  return {
    source: 'heuristic',
    recommendation: `Not enough fare history for this route yet — as a general rule of thumb for a route this distance, booking around ${window} before departure tends to be cheapest. This will switch to a recommendation based on this route's own fare history once enough data has been collected.`,
  }
}

/**
 * When has this route historically been cheapest to book, in terms of lead time before
 * departure? Uses this route's own accumulated fare history once there's enough of it in
 * each lead-time bucket; otherwise falls back to a general distance-based rule of thumb.
 */
export function getBestTimeToBuy(origin: Airport, destination: Airport): BuyTiming {
  const history = historyForRoute(origin.iata, destination.iata)

  const bucketStats = BUCKETS.map((bucket) => {
    const samples = history.filter((h) => h.leadTimeDays >= bucket.min && h.leadTimeDays <= bucket.max)
    const avg = samples.length > 0 ? samples.reduce((sum, s) => sum + s.priceMYR, 0) / samples.length : null
    return { bucket, avg, count: samples.length }
  }).filter((b) => b.count >= MIN_SAMPLES_PER_BUCKET && b.avg !== null)

  if (bucketStats.length === 0) {
    return heuristicBuyTiming(origin, destination)
  }

  const best = bucketStats.reduce((a, b) => (b.avg! < a.avg! ? b : a))
  const totalSamples = bucketStats.reduce((sum, b) => sum + b.count, 0)

  return {
    source: 'history',
    sampleSize: totalSamples,
    recommendation: `Based on ${totalSamples} fares observed for this route, prices have typically been lowest when booked ${best.bucket.label} before departure.`,
  }
}
