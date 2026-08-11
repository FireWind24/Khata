import type { Category, PaymentMode } from '../types'
import { CATEGORY_LABELS, PAYMENT_MODE_LABELS } from '../types'

export function formatMoney(amount: number): string {
  const hasPaise = amount % 1 !== 0
  return (
    'Rs ' +
    new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(amount)
  )
}

export function formatMoneyMono(amount: number): string {
  return formatMoney(amount)
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  return new Intl.DateTimeFormat('en-PK', { month: 'long', year: 'numeric' }).format(date)
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7)
}

export function todayISO(): string {
  const now = new Date()
  return toISO(now)
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthBounds(key: string): { from: string; to: string } {
  const [y, m] = key.split('-').map(Number)
  const from = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

export function categoryLabel(c: Category): string {
  return CATEGORY_LABELS[c]
}

export function paymentModeLabel(p: PaymentMode): string {
  return PAYMENT_MODE_LABELS[p]
}