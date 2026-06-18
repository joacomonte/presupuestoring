import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Input de importe con toggle de moneda ARS/USD (PRD §3.3 "toggle por precio").
// value = { valor, moneda }
// Muestra el monto formateado (miles con punto, 2 decimales con coma, es-AR) y la
// moneda en gris junto al número. Al enfocar se edita en crudo y al salir se
// vuelve a formatear.
export function MoneyInput({
  value,
  onChange,
  id,
  className,
  allowCurrencyToggle = true,
  placeholder = '0,00',
}) {
  const money = value || { valor: 0, moneda: 'ARS' }
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const formatted =
    money.valor === 0
      ? ''
      : money.valor.toLocaleString('es-AR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })

  return (
    <div className={cn('flex items-stretch', className)}>
      <div className="flex shrink-0 overflow-hidden rounded-l-md border border-r-0">
        {['ARS', 'USD'].map((m) => (
          <button
            key={m}
            type="button"
            disabled={!allowCurrencyToggle}
            onClick={() => onChange({ ...money, moneda: m })}
            className={cn(
              'px-2 text-xs font-semibold transition disabled:opacity-100',
              money.moneda === m
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-background text-muted-foreground/60 hover:bg-accent'
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="relative flex-1">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={focused ? draft : formatted}
          onFocus={() => {
            setFocused(true)
            setDraft(money.valor === 0 ? '' : String(money.valor).replace('.', ','))
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value
            setDraft(raw)
            const normalized = raw.replace(/\./g, '').replace(',', '.')
            const num = normalized === '' ? 0 : Number(normalized)
            if (!Number.isNaN(num)) onChange({ ...money, valor: num })
          }}
          placeholder={placeholder}
          className="rounded-l-none pr-10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60">
          {money.moneda}
        </span>
      </div>
    </div>
  )
}
