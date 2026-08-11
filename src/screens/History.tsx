import { useState } from 'react'
import { usePayments } from '../db/payments'
import { monthKeyOf, formatMonthKey, formatMoney } from '../lib/format'
import { LedgerRow } from '../components/LedgerRow'
import { Sheet } from '../components/Sheet'
import type { Category, Payment } from '../types'
import { CATEGORIES, CATEGORY_LABELS } from '../types'

interface HistoryProps {
  onOpenPayment: (p: Payment) => void
}

interface Filters {
  categories: Category[]
  from: string
  to: string
}

const EMPTY: Filters = { categories: [], from: '', to: '' }

export function History({ onOpenPayment }: HistoryProps) {
  const payments = usePayments() ?? []
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [showFilters, setShowFilters] = useState(false)
  const [draft, setDraft] = useState<Filters>(EMPTY)

  const filtered = payments.filter((p) => {
    const q = query.trim().toLowerCase()
    if (q && !p.name.toLowerCase().includes(q)) return false
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false
    if (filters.from && p.date < filters.from) return false
    if (filters.to && p.date > filters.to) return false
    return true
  })

  const groups = (() => {
    const map = new Map<string, Payment[]>()
    for (const p of filtered) {
      const key = monthKeyOf(p.date)
      const arr = map.get(key)
      if (arr) arr.push(p)
      else map.set(key, [p])
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  })()

  const filtersActive = filters.categories.length > 0 || !!filters.from || !!filters.to
  const totalCount = filtered.length

  return (
    <div className="screen">
      <h1 className="h1">All entries</h1>

      <div className="history-toolbar">
        <input
          className="search-bar"
          placeholder="Search name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search entries"
        />
        <button
          type="button"
          className="filter-btn"
          data-active={filtersActive || undefined}
          aria-label={`Filter entries${filtersActive ? ' (active)' : ''}`}
          onClick={() => {
            setDraft(filters)
            setShowFilters(true)
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      </div>

      {totalCount > 0 && (
        <div className="label" style={{ padding: '6px 0 2px' }}>
          {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="totals-empty">Nothing here yet.</p>
      ) : (
        groups.map(([monthKey, rows]) => {
          const subTotal = rows.reduce((s, p) => s + p.amount, 0)
          return (
            <section key={monthKey} style={{ marginBottom: 18 }}>
              <div className="sticky-month">
                <span className="month-name">{formatMonthKey(monthKey)}</span>
                <span className="month-sub">{formatMoney(subTotal)}</span>
              </div>
              <ul className="list card">
                {rows.map((p) => (
                  <LedgerRow key={p.local_id} payment={p} onOpen={onOpenPayment} />
                ))}
              </ul>
            </section>
          )
        })
      )}

      {showFilters && (
        <Sheet title="Filter entries" onClose={() => setShowFilters(false)}>
          <span className="field-label">Category</span>
          <div className="pill-group" style={{ marginBottom: 22 }}>
            {CATEGORIES.map((c) => {
              const active = draft.categories.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  className="chip-toggle"
                  aria-pressed={active || undefined}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      categories: active
                        ? d.categories.filter((x) => x !== c)
                        : [...d.categories, c],
                    }))
                  }
                >
                  {CATEGORY_LABELS[c]}
                </button>
              )
            })}
          </div>

          <span className="field-label">Date range</span>
          <div className="range-grid" style={{ marginBottom: 24 }}>
            <div>
              <label className="field-label" htmlFor="f-from">
                From
              </label>
              <input
                id="f-from"
                type="date"
                className="date-input"
                value={draft.from}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="f-to">
                To
              </label>
              <input
                id="f-to"
                type="date"
                className="date-input"
                value={draft.to}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              />
            </div>
          </div>

          <div className="sheet-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setFilters(draft)
                setShowFilters(false)
              }}
            >
              Apply filter
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setDraft(EMPTY)
                setFilters(EMPTY)
                setShowFilters(false)
              }}
            >
              Clear filter
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}