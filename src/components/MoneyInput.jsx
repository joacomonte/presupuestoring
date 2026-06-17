import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Input de importe con toggle de moneda ARS/USD (PRD §3.3 "toggle por precio").
// value = { valor, moneda }
export function MoneyInput({
  value,
  onChange,
  id,
  className,
  allowCurrencyToggle = true,
  placeholder = '0',
}) {
  const money = value || { valor: 0, moneda: 'ARS' }

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
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-accent'
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={money.valor === 0 ? '' : money.valor}
        onChange={(e) =>
          onChange({
            ...money,
            valor: e.target.value === '' ? 0 : Number(e.target.value),
          })
        }
        placeholder={placeholder}
        className="rounded-l-none"
      />
    </div>
  )
}
