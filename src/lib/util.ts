/** Great-circle distance between two lat/lon points, in kilometres. */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLon = ((bLon - aLon) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Deterministic pseudo-random number in [0, 1) derived from a string seed. */
export function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  // xorshift-ish mix to spread bits, then normalize to [0, 1)
  hash = hash ^ (hash >>> 13)
  hash = Math.imul(hash, 0x5bd1e995)
  hash = hash ^ (hash >>> 15)
  return (hash >>> 0) / 4294967296
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function dayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay() // 0 = Sunday
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Evenly-spaced sample of dates between start and end (inclusive), capped at maxCount. */
export function sampleDateRange(start: string, end: string, maxCount: number): string[] {
  const startMs = new Date(start + 'T00:00:00Z').getTime()
  const endMs = new Date(end + 'T00:00:00Z').getTime()
  const totalDays = Math.max(0, Math.round((endMs - startMs) / 86400000))
  const count = Math.min(maxCount, totalDays + 1)
  if (count <= 1) return [start]

  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const offset = Math.round((i * totalDays) / (count - 1))
    dates.push(addDays(start, offset))
  }
  return [...new Set(dates)]
}
