import { useCallback, useState } from 'react'

interface StampButtonProps {
  onPress: () => void
  pulseToken?: number | null
}

const RING = '#1E5C4A'

export function StampButton({ onPress, pulseToken }: StampButtonProps) {
  const [pressed, setPressed] = useState(false)

  const down = useCallback(() => setPressed(true), [])
  const up = useCallback(() => setPressed(false), [])

  return (
    <div className="stamp-wrap">
      <button
        type="button"
        className={`stamp-btn${pulseToken ? ' pulse' : ''}`}
        key={pulseToken ?? undefined}
        aria-label="Log an entry"
        onClick={onPress}
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        data-pressed={pressed || undefined}
      >
        <svg className="stamp-ring" viewBox="0 0 100 100" aria-hidden="true">
          {/* slightly uneven outer ring: two arcs slightly rotated */}
          <circle
            cx="50"
            cy="50"
            r="45.5"
            fill="none"
            stroke={RING}
            strokeWidth="3.4"
            strokeDasharray="38 4.5 36.5 4.5 44 3.5 31"
          />
          <circle
            cx="50.8"
            cy="49.6"
            r="44.4"
            fill="none"
            stroke={RING}
            strokeWidth="1.1"
            opacity="0.55"
          />
          <circle cx="50" cy="50" r="37" fill="none" stroke={RING} strokeWidth="1.6" opacity="0.8" />
          <circle
            cx="50" cy="50" r="36.2"
            fill="none"
            stroke={RING}
            strokeWidth="0.8"
            strokeDasharray="20 6 24 5"
            opacity="0.5"
          />
        </svg>
        <svg className="stamp-plus" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M18 7v22M7 18h22"
            stroke={RING}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}