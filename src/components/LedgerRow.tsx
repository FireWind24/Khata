import { useEffect, useState } from 'react'
import type { Payment } from '../types'
import { categoryLabel, formatDate, formatMoney } from '../lib/format'
import { amountToWords } from '../lib/words'

interface LedgerRowProps {
  payment: Payment
  onOpen: (p: Payment) => void
  justLogged?: boolean
}

export function LedgerRow({ payment, onOpen, justLogged }: LedgerRowProps) {
  const [logged, setLogged] = useState(false)
  useEffect(() => {
    if (!justLogged) return
    setLogged(true)
    const t = setTimeout(() => setLogged(false), 1800)
    return () => clearTimeout(t)
  }, [justLogged])

  return (
    <li>
      <button type="button" className="ledger-row imprint-wrap" onClick={() => onOpen(payment)}>
        <span className="ledger-row-main">
          <span className="ledger-row-name">{payment.name}</span>
          <span className="ledger-row-sub">
            {categoryLabel(payment.category)} · {formatDate(payment.date)}
          </span>
        </span>
        <span className="ledger-row-right">
          <span className="ledger-row-amount">{formatMoney(payment.amount)}</span>
          <span className="ledger-row-words">{amountToWords(payment.amount)}</span>
        </span>
        {logged && (
          <span className="imprint" aria-hidden="true">
            <ImprintSvg />
          </span>
        )}
      </button>
    </li>
  )
}

function ImprintSvg() {
  return (
    <svg width="52" height="52" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#1E5C4A" strokeWidth="4" strokeDasharray="30 6 34 4 40 5 26" opacity="0.85" />
      <circle cx="51" cy="49.5" r="45" fill="none" stroke="#1E5C4A" strokeWidth="1.4" opacity="0.5" />
      <path d="M32 52.5 46 66 69 40" fill="none" stroke="#1E5C4A" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}