import type { PricePosition } from '../types'

const LABEL: Record<PricePosition['label'], string> = {
  low: 'Lower than usual',
  mid: 'Typical price',
  high: 'Higher than usual',
}

export function PricePositionBadge({ position }: { position: PricePosition }) {
  const title =
    position.source === 'history'
      ? `Based on ${position.sampleSize} historical fares observed for this route`
      : 'Rough estimate — not enough fare history for this route yet, compared against a distance-based typical fare instead'

  return (
    <span className={`badge badge-price-${position.label}`} title={title}>
      {LABEL[position.label]}
      {position.source === 'estimate' && <span className="badge-asterisk">*</span>}
    </span>
  )
}
