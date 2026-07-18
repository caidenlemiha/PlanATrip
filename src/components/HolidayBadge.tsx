import type { HolidayInfo } from '../types'

interface Props {
  label: string
  info: HolidayInfo | null | undefined
  loading: boolean
}

export function HolidayBadge({ label, info, loading }: Props) {
  if (loading) return <div className="muted small">Checking holidays at {label}&hellip;</div>
  if (info === null) return <div className="muted small">{label}: holiday data not available for this country</div>
  if (!info) return null

  return (
    <div className={`badge-line ${info.isHoliday ? 'is-holiday' : ''}`}>
      <span className="muted small">{label}:</span>{' '}
      {info.isHoliday ? (
        <span className="badge badge-holiday">Public holiday &mdash; {info.name}</span>
      ) : (
        <span className="muted small">not a public holiday</span>
      )}
    </div>
  )
}
