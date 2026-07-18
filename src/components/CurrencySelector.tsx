import { SUPPORTED_CURRENCIES } from '../lib/currency'

interface Props {
  value: string
  onChange: (currency: string) => void
}

export function CurrencySelector({ value, onChange }: Props) {
  return (
    <div className="field">
      <label htmlFor="currency">Currency</label>
      <select id="currency" value={value} onChange={(e) => onChange(e.target.value)}>
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}
