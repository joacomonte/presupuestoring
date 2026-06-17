import { Minus, Plus } from 'lucide-react'

// Stepper de cantidad (opción tipo 'cantidad', PRD §3.3.1).
export function Stepper({ value, onChange, min = 0, max = 99, id }) {
  const v = Number(value) || 0
  return (
    <div className="inline-flex items-center rounded-full border" id={id}>
      <button
        type="button"
        aria-label="Restar"
        onClick={() => onChange(Math.max(min, v - 1))}
        className="flex size-9 items-center justify-center rounded-l-full text-muted-foreground hover:bg-accent disabled:opacity-40"
        disabled={v <= min}
      >
        <Minus className="size-4" />
      </button>
      <span className="w-9 text-center text-sm font-medium tabular-nums">{v}</span>
      <button
        type="button"
        aria-label="Sumar"
        onClick={() => onChange(Math.min(max, v + 1))}
        className="flex size-9 items-center justify-center rounded-r-full text-muted-foreground hover:bg-accent disabled:opacity-40"
        disabled={v >= max}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
