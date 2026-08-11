import type { ReactNode } from 'react'

interface SheetProps {
  title?: string
  full?: boolean
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
}

export function Sheet({ title, full, onClose, children, actions }: SheetProps) {
  return (
    <div className="backdrop" role="presentation" onClick={onClose}>
      <div
        className={`sheet${full ? ' sheet-full' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Sheet'}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="sheet-handle" aria-label="Close" onClick={onClose} />
        {title ? <h2 className="sheet-title">{title}</h2> : null}
        <div className="sheet-body">{children}</div>
        {actions ? <div className="sheet-actions">{actions}</div> : null}
      </div>
    </div>
  )
}