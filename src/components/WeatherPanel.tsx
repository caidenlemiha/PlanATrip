import type { WeatherAssessment } from '../types'

interface Props {
  label: string
  weather: WeatherAssessment | null
  loading: boolean
}

const RISK_LABEL: Record<WeatherAssessment['monsoonRisk'], string> = {
  none: 'No elevated risk',
  low: 'Low risk',
  moderate: 'Moderate risk',
  high: 'High risk',
}

export function WeatherPanel({ label, weather, loading }: Props) {
  if (loading) return <div className="card weather-card muted">Loading weather for {label}&hellip;</div>
  if (!weather) return null

  return (
    <div className={`card weather-card risk-${weather.monsoonRisk}`}>
      <div className="weather-header">
        <strong>{label}</strong>
        <span className={`badge badge-${weather.monsoonRisk}`}>{RISK_LABEL[weather.monsoonRisk]}</span>
      </div>
      <div className="weather-temp">
        {Number.isFinite(weather.tempMinC) ? `${weather.tempMinC}°–${weather.tempMaxC}°C` : '—'}
      </div>
      <div className="muted small">{weather.conditions}</div>
      <div className="muted small">
        {weather.source === 'forecast' ? 'Live forecast' : 'Based on historical averages (date is beyond reliable forecast range)'}
        {' · '}{weather.precipitationChancePct}% rain chance
      </div>
      {weather.monsoonNote && <div className="muted small monsoon-note">{weather.monsoonNote}</div>}
    </div>
  )
}
