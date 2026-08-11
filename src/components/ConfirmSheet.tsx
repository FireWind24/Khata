import { Sheet } from './Sheet'

interface ConfirmSheetProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmSheet({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <Sheet title={title} onClose={onCancel}>
      <p className="label" style={{ padding: '4px 0' }}>
        {message}
      </p>
      <div className="sheet-actions">
        <button type="button" className="btn-ghost btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Sheet>
  )
}