import type { HolidayInfo } from '../types'

interface NagerHoliday {
  date: string
  localName: string
  name: string
}

const cache = new Map<string, NagerHoliday[] | null>()

async function getHolidaysForYear(countryCode: string, year: number): Promise<NagerHoliday[] | null> {
  const key = `${countryCode}-${year}`
  if (cache.has(key)) return cache.get(key) ?? null

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
    if (!res.ok) {
      cache.set(key, null)
      return null
    }
    const data: NagerHoliday[] = await res.json()
    cache.set(key, data)
    return data
  } catch {
    cache.set(key, null)
    return null
  }
}

/** Returns null if holiday data isn't available for this country (Nager.Date covers ~100 countries). */
export async function getHolidayInfo(countryCode: string, dateStr: string): Promise<HolidayInfo | null> {
  const year = Number(dateStr.slice(0, 4))
  const holidays = await getHolidaysForYear(countryCode, year)
  if (holidays === null) return null

  const match = holidays.find((h) => h.date === dateStr)
  return {
    date: dateStr,
    isHoliday: Boolean(match),
    name: match?.localName ?? match?.name,
  }
}
