export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  countryCode: string
  lat: number
  lon: number
  timezone: string // IANA timezone, e.g. "Asia/Tokyo"
  /** lowercase search terms this airport should match on free-text input */
  aliases: string[]
}

export interface FlightOffer {
  origin: string // IATA
  destination: string // IATA
  date: string // YYYY-MM-DD (departure)
  returnDate?: string
  airline: string
  priceMYR: number
  departDateLocal: string // YYYY-MM-DD in origin airport local time
  departTimeLocal: string // HH:mm in origin airport local time
  arriveDateLocal: string // YYYY-MM-DD in destination airport local time
  arriveTimeLocal: string // HH:mm in destination airport local time
  durationMinutes: number
  stops: number
  fetchedAt: string // ISO timestamp of when the source data was captured, or "estimate"
}

export interface WeatherAssessment {
  date: string
  source: 'forecast' | 'climatology'
  tempMinC: number
  tempMaxC: number
  conditions: string
  precipitationChancePct: number
  monsoonRisk: 'none' | 'low' | 'moderate' | 'high'
  monsoonNote?: string
}

export interface HolidayInfo {
  date: string
  isHoliday: boolean
  name?: string
}

export interface PriceHistoryEntry {
  origin: string // IATA
  destination: string // IATA
  targetDate: string // YYYY-MM-DD, the departure date this fare was for
  fetchedAt: string // ISO timestamp of when this fare was observed
  leadTimeDays: number // targetDate - fetchedAt, in days
  priceMYR: number
}

export interface PricePosition {
  label: 'low' | 'mid' | 'high'
  ratio: number // observed price / baseline price
  source: 'history' | 'estimate'
  sampleSize?: number // number of historical fares this was judged against, when source is 'history'
}

export interface BuyTiming {
  source: 'history' | 'heuristic'
  recommendation: string
  sampleSize?: number
}

export interface Promo {
  airline: string
  title: string
  typicalWindow: string
  regions: string[]
  notes: string
  url?: string
}

export interface SearchParams {
  originQuery: string
  originAirport?: Airport
  destinationAirport?: Airport
  startDate: string
  endDate: string
  currency: string
}
