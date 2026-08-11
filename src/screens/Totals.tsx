import { useState } from 'react'
import { usePayments } from '../db/payments'
import { monthBounds, formatMonthKey, formatMoney, todayISO } from '../lib/format'
import { Sheet } from '../components/Sheet'
import { downloadCsv, printPdf } from '../lib/export'
import { CATEGORIES, CATEGORY_LABELS } from '../types'

export function Totals() {
  const payments = usePayments() ?? []
  const [month, setMonth] = useState(() => monthBoundsKey(todayISO()))
  const [showExport, setShowExport] = useState(false)

  const { from, to } = monthBounds(month)

  const monthRows = payments
    .filter((p) => p.date >= from && p.date <= to)
    .sort((a, b) => (a.date === b.date ? (a.created_at < b.created_at ? 1 : -1) : a.date < b.date ? -1 : 1))

  const total = monthRows.reduce((s, p) => s + p.amount, 0)

  const byCategory = (() => {
    const map = new Map<string, number>()
    for (const p of monthRows) {
      map.set(p.category, (map.get(p.category) ?? 0) + p.amount)
    }
    return CATEGORIES.map((c) => ({ category: c, amount: map.get(c) ?? 0 }))
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  })()

  const maxCat = byCategory[0]?.amount ?? 0

  function shiftMonth(dir: 1 | -1) {
    setMonth((m) => {
      const [y, mo] = m.split('-').map(Number)
      const d = new Date(y, mo - 1 + dir, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }

  const isCurrentMonth = month === monthBoundsKey(todayISO())

  function exportFor(kind: 'csv' | 'pdf') {
    const title = `Khata — ${formatMonthKey(month)}`
    if (kind === 'csv') {
      downloadCsv(monthRows, `khata-${month}.csv`)
    } else {
      printPdf(monthRows, title)
    }
    setShowExport(false)
  }

  return (
    <div className="screen">
      <h1 className="h1">Totals</h1>

      <div className="month-nav">
        <button type="button" className="month-arrow" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="month-current">{formatMonthKey(month)}</div>
        <button type="button" className="month-arrow" aria-label="Next month" onClick={() => shiftMonth(1)} disabled={isCurrentMonth}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-pad">
          <div className="label" style={{ marginBottom: 2 }}>
            Total for {formatMonthKey(month)}
          </div>
          <div className="month-total">
            <span className="currency">Rs</span>
            {new Intl.NumberFormat('en-PK', {
              minimumFractionDigits: total % 1 !== 0 ? 2 : 0,
              maximumFractionDigits: 2,
            }).format(total)}
          </div>
        </div>
      </div>

      {byCategory.length === 0 ? (
        <p className="totals-empty">No entries in {formatMonthKey(month)}.</p>
      ) : (
        <div className="card">
          {byCategory.map(({ category, amount }) => (
            <div className="bar-row" key={category}>
              <span className="bar-label">{CATEGORY_LABELS[category]}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: maxCat ? `${Math.max((amount / maxCat) * 100, 2)}%` : '2%' }} />
              </span>
              <span className="bar-amount">{formatMoney(amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sheet-actions" style={{ marginTop: 28 }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setShowExport(true)}
          disabled={monthRows.length === 0}
        >
          Export {formatMonthKey(month)}
        </button>
      </div>

      {showExport && (
        <Sheet title="Export this month" onClose={() => setShowExport(false)}>
          <div className="export-list">
            <button type="button" className="btn-ghost" onClick={() => exportFor('pdf')}>
              <span className="file-kind">
                <span className="file-kind-icon">PDF</span>
                <span className="file-kind-txt">
                  <b>PDF</b>
                  <span>Formatted, printable — for handing to someone</span>
                </span>
              </span>
            </button>
            <button type="button" className="btn-ghost" onClick={() => exportFor('csv')}>
              <span className="file-kind">
                <span className="file-kind-icon">CSV</span>
                <span className="file-kind-txt">
                  <b>CSV</b>
                  <span>Open in Excel / Sheets if needed</span>
                </span>
              </span>
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

function monthBoundsKey(iso: string): string {
  return iso.slice(0, 7)
}