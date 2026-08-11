import { useMemo, useRef, useState } from 'react'
import type { Category, PaymentMode, Payment } from '../types'
import { CATEGORIES, PAYMENT_MODES, CATEGORY_LABELS, PAYMENT_MODE_LABELS } from '../types'
import { PillGroup } from './PillGroup'
import { todayISO, toISO } from '../lib/format'
import { useDistinctNames } from '../db/payments'
import { amountToWords } from '../lib/words'

export interface EntryFormValues {
  name: string
  amount: string
  date: string
  category: Category
  payment_mode: PaymentMode
}

interface EntryFormProps {
  initial?: Payment
  onSubmit: (v: EntryFormValues) => void
  onDelete?: () => void
  submitLabel: string
}

const MODE_LABELS = PAYMENT_MODES.map((m) => ({ value: m, label: PAYMENT_MODE_LABELS[m] }))
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))

export function EntryForm({ initial, onSubmit, onDelete, submitLabel }: EntryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [category, setCategory] = useState<Category>(initial?.category ?? 'general')
  const [mode, setMode] = useState<PaymentMode>(initial?.payment_mode ?? 'cash')

  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set())
  const nameRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const allNames = useDistinctNames()
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase()
    if (!q) return allNames.slice(0, 5)
    return allNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 5)
  }, [name, allNames])

  const [showSuggest, setShowSuggest] = useState(false)

  const touched = (field: string) => invalidFields.has(field)

  const amountNum = parseAmount(amount)
  const amountWords = amountNum != null && amountNum > 0 ? amountToWords(amountNum) : ''

  function markInvalid(field: string, keep: string[]) {
    setInvalidFields((prev) => {
      const next = new Set(prev)
      keep.forEach((k) => next.delete(k))
      next.add(field)
      return next
    })
  }

  function shakeRemove(field: string) {
    setInvalidFields((prev) => {
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }

  function focusFirstInvalid(): boolean {
    if (!name.trim()) {
      markInvalid('name', [])
      setTimeout(() => nameRef.current?.focus(), 10)
      return true
    }
    const n = parseAmount(amount)
    if (n == null || n <= 0) {
      shakeRemove('name')
      markInvalid('amount', ['name'])
      setTimeout(() => amountRef.current?.focus(), 10)
      return true
    }
    return false
  }

  function handleSubmit() {
    if (focusFirstInvalid()) return
    onSubmit({ name: name.trim(), amount, date, category, payment_mode: mode })
  }

  function handleAmount(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // digits + optional single decimal point, two places max
    const cleaned = raw.replace(/[^0-9.]/g, '')
    const [int, dec] = cleaned.split('.')
    const value = dec === undefined ? int : `${int.slice(0, 7)}.${dec.slice(0, 2)}`
    setAmount(value)
  }

  return (
    <div>
      <div className={`field${touched('name') ? ' invalid shake' : ''}`} onAnimationEnd={(e) => e.currentTarget.classList.remove('shake')}>
        <label className="field-label" htmlFor="entry-name">
          Name
        </label>
        <div className="input-row">
          <input
            ref={nameRef}
            id="entry-name"
            className="text-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              shakeRemove('name')
              setShowSuggest(true)
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setShowSuggest(false)}
            placeholder="Who was it for?"
            autoComplete="off"
            enterKeyHint="next"
            aria-label="Name"
          />
        </div>
        {showSuggest && suggestions.length > 0 && (
          <ul className="suggest" role="listbox" aria-label="Previous names">
            {suggestions.map((s) => (
              <li key={s} role="option">
                <button
                  type="button"
                  className="suggest-item"
                  onMouseDown={(e) => {
                    e.preventDefault() // keep focus
                    setName(s)
                    setShowSuggest(false)
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`field${touched('amount') ? ' invalid shake' : ''}`} onAnimationEnd={(e) => e.currentTarget.classList.remove('shake')}>
        <label className="field-label" htmlFor="entry-amount">
          Amount
        </label>
        <div className="amount-box">
          <div className="amount-row">
            <span className="amount-prefix">Rs</span>
            <input
              ref={amountRef}
              id="entry-amount"
              className="amount-input"
              value={amount}
              onChange={handleAmount}
              placeholder="0"
              inputMode="decimal"
              enterKeyHint="done"
              aria-label="Amount"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="amount-words" aria-live="polite">
          {amountWords}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="entry-date">
          Date
        </label>
        <input
          id="entry-date"
          type="date"
          className="date-input"
          value={date}
          onChange={(e) => setDate(e.target.value || todayISO())}
          max={toISO(new Date(new Date().getFullYear() + 5, 11, 31))}
          aria-label="Date"
        />
      </div>

      <div className="field">
        <span className="field-label" id="category-label">
          Category
        </span>
        <PillGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      </div>

      <div className="field">
        <span className="field-label" id="mode-label">
          Payment mode
        </span>
        <PillGroup options={MODE_LABELS} value={mode} onChange={setMode} />
      </div>

      <div className="sheet-actions">
        <button type="button" className="btn-primary" onClick={handleSubmit}>
          {submitLabel}
        </button>
        {onDelete && (
          <button type="button" className="btn-ghost btn-danger" onClick={onDelete}>
            Delete entry
          </button>
        )}
      </div>
    </div>
  )
}

function parseAmount(value: string): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}