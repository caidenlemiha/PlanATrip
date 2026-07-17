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
