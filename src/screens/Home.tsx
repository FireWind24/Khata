import { useRef, useEffect, useState } from 'react'
import { usePayments } from '../db/payments'
import { monthKeyOf, todayISO, formatMonthKey } from '../lib/format'
import { StampButton } from '../components/StampButton'
import { LedgerRow } from '../components/LedgerRow'
import type { Payment } from '../types'

interface HomeProps {
  onOpenEntry: () => void
  onOpenPayment: (p: Payment) => void
  loggedId: string | null
}

export function Home({ onOpenEntry, onOpenPayment, loggedId }: HomeProps) {
  const payments = usePayments() ?? []
  const currentMonth = monthKeyOf(todayISO())

  // Pulse the stamp once per newly-logged entry.
  const [pulseToken, setPulseToken] = useState(0)
  const prevLogged = useRef(loggedId)
  useEffect(() => {
    if (loggedId && loggedId !== prevLogged.current) {
      setPulseToken((t) => t + 1)
    }
    prevLogged.current = loggedId
  }, [loggedId])

  const monthTotal = payments
    .filter((p) => monthKeyOf(p.date) === currentMonth)
    .reduce((s, p) => s + p.amount, 0)

  const preview = payments.slice(0, 5)
  const hasEntries = payments.length > 0

  return (
    <div className="screen">
      <header style={{ padding: '8px 4px 4px' }}>
        <div className="label" style={{ marginBottom: 2 }}>
          {formatMonthKey(currentMonth)}
        </div>
        <div className="month-total">
          <span className="currency">Rs</span>
          {new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: monthTotal % 1 !== 0 ? 2 : 0,
            maximumFractionDigits: 2,
          }).format(monthTotal)}
        </div>
      </header>

      <StampButton onPress={onOpenEntry} pulseToken={pulseToken} />

      <section style={{ marginTop: 8 }}>
        <div style={{ padding: '0 4px 10px' }}>
          <h2 className="h2">{hasEntries ? 'Recent entries' : 'No entries yet'}</h2>
        </div>
        {!hasEntries ? (
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <p className="label" style={{ margin: 0, padding: '12px 0' }}>
              Press the stamp to add your first entry.
            </p>
          </div>
        ) : (
          <ul className="list card">
            {preview.map((p) => (
              <LedgerRow key={p.local_id} payment={p} onOpen={onOpenPayment} justLogged={loggedId === p.local_id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}