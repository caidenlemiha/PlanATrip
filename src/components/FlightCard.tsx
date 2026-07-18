import { useEffect, useState } from 'react'
import type { Airport, FlightOffer } from '../types'
import { convertFromMYR, formatMoney } from '../lib/currency'
import { zonedWallTimeToUtc, toMalaysiaTime, zoneOffsetLabel, MALAYSIA_TZ } from '../lib/timezone'
import { isEstimated } from '../lib/flights'
import { getPricePosition } from '../lib/priceInsights'
import { PricePositionBadge } from './PricePositionBadge'

interface Props {
  offer: FlightOffer
  origin: Airport
  destination: Airport
  currency: string
}

export function FlightCard({ offer, origin, destination, currency }: Props) {
  const [displayPrice, setDisplayPrice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    convertFromMYR(offer.priceMYR, currency).then((amount) => {
      if (!cancelled) setDisplayPrice(formatMoney(amount, currency))
    })
    return () => {
      cancelled = true
    }
  }, [offer.priceMYR, currency])

  const departUtc = zonedWallTimeToUtc(offer.departDateLocal, offer.departTimeLocal, origin.timezone)
  const arriveUtc = zonedWallTimeToUtc(offer.arriveDateLocal, offer.arriveTimeLocal, destination.timezone)
  const departMYT = toMalaysiaTime(departUtc)
  const arriveMYT = toMalaysiaTime(arriveUtc)
  const showOriginIsMYT = origin.timezone === MALAYSIA_TZ
  const showDestIsMYT = destination.timezone === MALAYSIA_TZ

  const hours = Math.floor(offer.durationMinutes / 60)
  const mins = offer.durationMinutes % 60
  const pricePosition = getPricePosition(origin, destination, offer.date, offer)

  return (
    <div className="card flight-card">
      <div className="flight-card-header">
        <div>
          <div className="price">{displayPrice ?? `MYR ${offer.priceMYR}`}</div>
          <div className="muted">{offer.airline} &middot; {offer.stops === 0 ? 'Direct' : `${offer.stops} stop`} &middot; {hours}h {mins}m</div>
          <div className="price-position-row">
            <PricePositionBadge position={pricePosition} />
          </div>
        </div>
        {isEstimated(offer) && (
          <span className="badge badge-muted" title="No live fare fetched yet for this route/date — showing a distance-based estimate">
            estimated fare
          </span>
        )}
      </div>

      <div className="flight-legs">
        <div className="leg">
          <div className="leg-code">{origin.iata}</div>
          <div className="leg-time">{offer.departTimeLocal}</div>
          <div className="muted small">{offer.departDateLocal} local ({zoneOffsetLabel(origin.timezone, departUtc)})</div>
          {!showOriginIsMYT && (
            <div className="muted small">= {departMYT.time} {departMYT.date} MYT</div>
          )}
        </div>
        <div className="leg-arrow">&rarr;</div>
        <div className="leg">
          <div className="leg-code">{destination.iata}</div>
          <div className="leg-time">{offer.arriveTimeLocal}</div>
          <div className="muted small">{offer.arriveDateLocal} local ({zoneOffsetLabel(destination.timezone, arriveUtc)})</div>
          {!showDestIsMYT && (
            <div className="muted small">= {arriveMYT.time} {arriveMYT.date} MYT</div>
          )}
        </div>
      </div>
    </div>
  )
}
