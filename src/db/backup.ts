import { db } from './db'
import { allPayments } from './payments'
import { toISO } from '../lib/format'

export function buildCsv(payments: { name: string; amount: number; date: string; category: string; payment_mode: string }[]): string {
  const header = ['name', 'amount', 'date', 'category', 'payment_mode']
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows = [header.join(',')]
  for (const p of payments) {
    rows.push([p.name, p.amount, p.date, p.category, p.payment_mode].map(esc).join(','))
  }
  return rows.join('\r\n') + '\r\n'
}

function currentWeekKey(now: Date): string {
  // Week number: Monday-based ISO week
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayNum = (now.getDay() + 6) % 7
  date.setDate(date.getDate() - dayNum + 3)
  const firstThursday = new Date(date.getFullYear(), 0, 4)
  const firstDayNum = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Weekly background CSV snapshot — a second, independent backup layer.
 * Runs once per ISO week.
 */
export async function runWeeklyBackup(): Promise<void> {
  const now = new Date()
  const week = currentWeekKey(now)
  const existing = await db.backups.get(week)
  if (existing) return

  const payments = await allPayments()
  if (payments.length === 0) return

  const csv = buildCsv(payments)
  await db.backups.put({ week, csv, created_at: now.toISOString() })
  console.info('[khata] weekly CSV backup saved for', toISO(now), week)
}