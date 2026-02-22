import { useMemo, useState } from 'react'
import { Input } from './Input'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function sanitizeMoneyInput(s: string): string {
  // Keep digits + at most one dot. This is a "draft" string for typing.
  const cleaned = s.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
}

function parseMoneyDraft(s: string): number {
  const cleaned = sanitizeMoneyInput(s)
  if (!cleaned) return 0
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

function displayDraftFromValue(value: number): string {
  if (!Number.isFinite(value) || value === 0) return ''
  // Avoid showing "$" and commas while typing; keep a plain number string.
  // Trim trailing zeros from decimals.
  const s = value.toFixed(2)
  return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '$0.00',
}: {
  value: number
  onChange: (next: number) => void
  placeholder?: string
}) {
  // When not editing, show formatted currency. While editing, keep a raw draft string
  // so users can type whole dollar amounts naturally (e.g. "750" instead of "$0.01" jumps).
  const [draft, setDraft] = useState<string | null>(null)
  const display = useMemo(() => (Number.isFinite(value) ? fmt.format(value) : ''), [value])
  return (
    <Input
      value={draft ?? display}
      placeholder={placeholder}
      inputMode="decimal"
      onFocus={() => {
        setDraft(displayDraftFromValue(value))
      }}
      onBlur={() => {
        // If user left it empty, treat as 0.
        if (draft !== null && !sanitizeMoneyInput(draft)) onChange(0)
        setDraft(null)
      }}
      onChange={(e) => {
        const nextDraft = sanitizeMoneyInput(e.target.value)
        setDraft(nextDraft)
        onChange(parseMoneyDraft(nextDraft))
      }}
    />
  )
}

export const money = {
  fmt: (n: number) => fmt.format(n),
}
