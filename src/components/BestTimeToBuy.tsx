import type { BuyTiming } from '../types'

export function BestTimeToBuy({ timing }: { timing: BuyTiming }) {
  return (
    <div className="card suggestions-card">
      <h3>Best time to buy</h3>
      <p className="muted small" style={{ marginBottom: 0 }}>{timing.recommendation}</p>
    </div>
  )
}
