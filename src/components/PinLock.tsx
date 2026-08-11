import { useEffect, useState } from 'react'

const PIN_KEY = 'khata.pin'

function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

interface PinLockProps {
  onUnlock: () => void
}

export function PinLock({ onUnlock }: PinLockProps) {
  const savedPin = localStorage.getItem(PIN_KEY)
  const [isSetup] = useState(savedPin === null)
  const [first, setFirst] = useState('')
  const [entry, setEntry] = useState('')
  const [error, setError] = useState('')

  function press(key: string) {
    if (error) setError('')
    if (key === 'del') {
      setEntry((e) => e.slice(0, -1))
      return
    }
    setEntry((e) => (e.length >= 4 ? e : e + key))
  }

  // When 4 digits land, resolve the flow
  useEffect(() => {
    if (entry.length < 4) return

    if (isSetup && !first) {
      setFirst(entry)
      setEntry('')
      setError('Now enter the same PIN again to confirm.')
      return
    }

    if (isSetup) {
      if (entry === first) {
        localStorage.setItem(PIN_KEY, hashCode(entry))
        onUnlock()
      } else {
        setError('PINs did not match. Start again.')
        setFirst('')
        setEntry('')
      }
      return
    }

    if (hashCode(entry) === savedPin) {
      onUnlock()
    } else {
      setError('Wrong PIN. Try again.')
      setEntry('')
    }
  }, [entry, isSetup, first, savedPin, onUnlock])

  const title = isSetup ? (first ? 'Repeat your PIN' : 'Set a 4-digit PIN') : 'Enter PIN'

  return (
    <div className="lock-screen">
      <div className="lock-title">{title}</div>
      <p className="label" style={{ textAlign: 'center', maxWidth: 280 }}>
        {isSetup ? 'This keeps your ledger private to you.' : 'This app is locked.'}
      </p>
      <div className="lock-dots" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`lock-dot${i < entry.length ? ' filled' : ''}`} />
        ))}
      </div>
      <div className="lock-error" role="alert">
        {error}
      </div>
      <div className="lock-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) =>
          k === '' ? (
            <span key="spacer" />
          ) : (
            <button
              key={k}
              type="button"
              className={`lock-key${k === 'del' ? ' del' : ''}`}
              onClick={() => press(k)}
              aria-label={k === 'del' ? 'Delete digit' : `Digit ${k}`}
            >
              {k === 'del' ? '⌫' : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}