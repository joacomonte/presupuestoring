import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Formatea lo que el usuario tipea a es-AR en vivo: miles con punto, coma decimal,
// máximo 2 decimales. Devuelve { display, valor }.
function formatDraft(raw) {
  let s = raw.replace(/[^\d,]/g, '')
  const comma = s.indexOf(',')
  let int = comma === -1 ? s : s.slice(0, comma)
  let dec = comma === -1 ? null : s.slice(comma + 1).replace(/,/g, '').slice(0, 2)
  int = int.replace(/\D/g, '')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const display = intFmt + (comma !== -1 ? ',' + dec : '')
  const num = int === '' && (dec === null || dec === '') ? 0 : Number(`${int || '0'}.${dec || '0'}`)
  return { display, valor: Number.isNaN(num) ? 0 : num }
}

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
      <button
        type="button"
        disabled={!allowCurrencyToggle}
        title={allowCurrencyToggle ? `Cambiar a ${money.moneda === 'ARS' ? 'USD' : 'ARS'}` : undefined}
        aria-label={allowCurrencyToggle ? `Moneda ${money.moneda}, tocá para cambiar` : `Moneda ${money.moneda}`}
        onClick={() =>
          onChange({ ...money, moneda: money.moneda === 'ARS' ? 'USD' : 'ARS' })
        }
        className={cn(
          'flex w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-l-md border border-r-0 bg-secondary text-xs font-semibold text-secondary-foreground transition hover:bg-accent active:scale-[0.97] disabled:opacity-100',
          !allowCurrencyToggle && 'cursor-default hover:bg-secondary'
        )}
      >
        <span>{money.moneda}</span>
        {allowCurrencyToggle && <ArrowLeftRight className="size-3 text-muted-foreground" />}
      </button>
      <div className="relative flex-1">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={focused ? draft : formatted}
          onFocus={() => {
            setFocused(true)
            setDraft(money.valor === 0 ? '' : formatDraft(String(money.valor).replace('.', ',')).display)
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const { display, valor } = formatDraft(e.target.value)
            setDraft(display)
            onChange({ ...money, valor })
          }}
          placeholder={placeholder}
          className="h-full rounded-l-none pr-10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/60">
          {money.moneda}
        </span>
      </div>
    </div>
  )
}
