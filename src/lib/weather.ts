import type { Airport, WeatherAssessment } from '../types'
import monsoonSeasons from '../data/monsoonSeasons.json'

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
}

function daysFromToday(dateStr: string): number {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const a = new Date(todayStr + 'T00:00:00Z').getTime()
  const b = new Date(dateStr + 'T00:00:00Z').getTime()
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function monsoonForAirport(airport: Airport, dateStr: string): { risk: WeatherAssessment['monsoonRisk']; note?: string } {
  const month = Number(dateStr.slice(5, 7))
  const entry = (monsoonSeasons as { countryCodes: string[]; months: number[]; risk: string; note: string }[]).find(
    (m) => m.countryCodes.includes(airport.countryCode) && m.months.includes(month),
  )
  if (!entry) return { risk: 'none' }
  return { risk: entry.risk as WeatherAssessment['monsoonRisk'], note: entry.note }
}

async function fetchForecast(airport: Airport, dateStr: string): Promise<WeatherAssessment> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(airport.lat))
  url.searchParams.set('longitude', String(airport.lon))
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('start_date', dateStr)
  url.searchParams.set('end_date', dateStr)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
  const data = await res.json()
  const i = 0
  const monsoon = monsoonForAirport(airport, dateStr)
  const precipPct = data.daily?.precipitation_probability_mean?.[i] ?? 0

  return {
    date: dateStr,
    source: 'forecast',
    tempMinC: Math.round(data.daily?.temperature_2m_min?.[i] ?? NaN),
    tempMaxC: Math.round(data.daily?.temperature_2m_max?.[i] ?? NaN),
    conditions: WMO_DESCRIPTIONS[data.daily?.weathercode?.[i]] ?? 'Unknown',
    precipitationChancePct: Math.round(precipPct),
    monsoonRisk: precipPct >= 60 && monsoon.risk === 'none' ? 'low' : monsoon.risk,
    monsoonNote: monsoon.note,
  }
}

async function fetchClimatologyYear(airport: Airport, dateStr: string, year: number): Promise<{ tMax: number; tMin: number; rained: boolean } | null> {
  const target = new Date(dateStr + 'T00:00:00Z')
  target.setUTCFullYear(year)
  const iso = target.toISOString().slice(0, 10)

  const url = new URL('https://archive-api.open-meteo.com/v1/archive')
  url.searchParams.set('latitude', String(airport.lat))
  url.searchParams.set('longitude', String(airport.lon))
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('start_date', iso)
  url.searchParams.set('end_date', iso)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = await res.json()
    const tMax = data.daily?.temperature_2m_max?.[0]
    const tMin = data.daily?.temperature_2m_min?.[0]
    const precip = data.daily?.precipitation_sum?.[0]
    if (tMax == null || tMin == null) return null
    return { tMax, tMin, rained: (precip ?? 0) > 1 }
  } catch {
    return null
  }
}

async function fetchClimatology(airport: Airport, dateStr: string): Promise<WeatherAssessment> {
  const thisYear = new Date().getUTCFullYear()
  const years = [thisYear - 1, thisYear - 2, thisYear - 3]
  const samples = (await Promise.all(years.map((y) => fetchClimatologyYear(airport, dateStr, y)))).filter(
    (s): s is { tMax: number; tMin: number; rained: boolean } => s !== null,
  )

  const monsoon = monsoonForAirport(airport, dateStr)

  if (samples.length === 0) {
    return {
      date: dateStr,
      source: 'climatology',
      tempMinC: NaN,
      tempMaxC: NaN,
      conditions: 'Historical data unavailable',
      precipitationChancePct: 0,
      monsoonRisk: monsoon.risk,
      monsoonNote: monsoon.note,
    }
  }

  const avg = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length
  const rainFraction = samples.filter((s) => s.rained).length / samples.length

  return {
    date: dateStr,
    source: 'climatology',
    tempMinC: Math.round(avg(samples.map((s) => s.tMin))),
    tempMaxC: Math.round(avg(samples.map((s) => s.tMax))),
    conditions: `${Math.round(rainFraction * 100)}% of the last ${samples.length} years saw rain on this date`,
    precipitationChancePct: Math.round(rainFraction * 100),
    monsoonRisk: rainFraction >= 0.6 && monsoon.risk === 'none' ? 'low' : monsoon.risk,
    monsoonNote: monsoon.note,
  }
}

function unavailableAssessment(airport: Airport, dateStr: string): WeatherAssessment {
  const monsoon = monsoonForAirport(airport, dateStr)
  return {
    date: dateStr,
    source: 'climatology',
    tempMinC: NaN,
    tempMaxC: NaN,
    conditions: 'Weather data unavailable right now',
    precipitationChancePct: 0,
    monsoonRisk: monsoon.risk,
    monsoonNote: monsoon.note,
  }
}

/** Real forecast within ~15 days out; historical-average (climatology) estimate beyond that. Never throws. */
export async function getWeatherAssessment(airport: Airport, dateStr: string): Promise<WeatherAssessment> {
  const daysOut = daysFromToday(dateStr)
  try {
    if (daysOut >= -1 && daysOut <= 15) {
      try {
        return await fetchForecast(airport, dateStr)
      } catch {
        return await fetchClimatology(airport, dateStr)
      }
    }
    return await fetchClimatology(airport, dateStr)
  } catch {
    return unavailableAssessment(airport, dateStr)
  }
}
