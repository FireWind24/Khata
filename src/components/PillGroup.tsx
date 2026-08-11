interface PillGroupProps<T extends string> {
  options: readonly { value: T; label: string; swatch?: string }[]
  value: T | null
  onChange: (value: T) => void
}

export function PillGroup<T extends string>({ options, value, onChange }: PillGroupProps<T>) {
  return (
    <div className="pill-group" role="radiogroup">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className="pill-option"
            onClick={() => onChange(opt.value)}
          >
            {opt.swatch ? <span className="swatch" style={{ background: opt.swatch }} /> : null}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}