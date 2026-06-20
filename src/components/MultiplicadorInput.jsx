import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Texto que explica qué significa el multiplicador respecto del precio base.
export function explicarMultiplicador(mult) {
  if (mult === '' || mult == null) return 'precio base'
  const m = Number(mult) || 0
  if (m === 1) return 'precio base'
  const pct = Math.round((m - 1) * 100)
  if (pct > 0) return `${pct}% más caro`
  return `${Math.abs(pct)}% más barato`
}

// Input chico para el multiplicador: muestra "×" pegado y, al lado, el significado.
export function MultiplicadorInput({ value, onChange, id, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative w-20 shrink-0">
        <Input
          id={id}
          type="number"
          step="0.05"
          min="0"
          value={value === '' || value == null ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="pr-5 text-right tabular-nums"
          aria-label="Multiplicador"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-muted-foreground">
          ×
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{explicarMultiplicador(value)}</span>
    </div>
  )
}
