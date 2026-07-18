export const MALAYSIA_TZ = 'Asia/Kuala_Lumpur'

interface ZoneParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function partsInZone(date: Date, timeZone: string): ZoneParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const map: Record<string, string> = {}
  for (const p of dtf.formatToParts(date)) if (p.type !== 'literal') map[p.type] = p.value
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  }
}

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone)
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return (asUTC - date.getTime()) / 60000
}

/** Interpret a YYYY-MM-DD + HH:mm wall-clock time as local to `timeZone` and return the equivalent UTC instant. */
export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm))
  const offsetMin = tzOffsetMinutes(guess, timeZone)
  return new Date(guess.getTime() - offsetMin * 60000)
}

/** Format a UTC instant as YYYY-MM-DD and HH:mm in the given timezone. */
export function formatInZone(utcDate: Date, timeZone: string): { date: string; time: string } {
  const p = partsInZone(utcDate, timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  }
}

export function toMalaysiaTime(utcDate: Date): { date: string; time: string } {
  return formatInZone(utcDate, MALAYSIA_TZ)
}

/** Human label like "GMT+8" for a timezone at a given instant. */
export function zoneOffsetLabel(timeZone: string, at: Date = new Date()): string {
  const offsetMin = tzOffsetMinutes(at, timeZone)
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `GMT${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`
}
