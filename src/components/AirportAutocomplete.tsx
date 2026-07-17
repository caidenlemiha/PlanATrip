import { useId, useState } from 'react'
import type { Airport } from '../types'
import { resolveAirports } from '../lib/airports'

interface Props {
  label: string
  placeholder: string
  value: string
  onChange: (query: string, airport: Airport | undefined) => void
}

export function AirportAutocomplete({ label, placeholder, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const matches = resolveAirports(value)

  return (
    <div className="field autocomplete">
      <label htmlFor={listId}>{label}</label>
      <input
        id={listId}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value, undefined)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        autoComplete="off"
      />
      {open && value.trim().length >= 2 && matches.length > 0 && (
        <ul className="autocomplete-list">
          {matches.map((a) => (
            <li key={a.iata}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(`${a.city} (${a.iata})`, a)
                  setOpen(false)
                }}
              >
                <span className="iata">{a.iata}</span>
                <span>{a.city}, {a.country} &mdash; {a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
