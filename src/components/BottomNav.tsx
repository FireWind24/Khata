import type { ReactNode } from 'react'

export type NavTarget = 'home' | 'history' | 'totals'

interface BottomNavProps {
  active: NavTarget
  onChange: (target: NavTarget) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const tabs: { id: NavTarget; label: string; icon: ReactNode }[] = [
    {
      id: 'home',
      label: 'Today',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M10 21v-6h4v6" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Entries',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeWidth="2.5" />
        </svg>
      ),
    },
    {
      id: 'totals',
      label: 'Totals',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="nav-tab"
            data-active={active === t.id || undefined}
            aria-current={active === t.id ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}