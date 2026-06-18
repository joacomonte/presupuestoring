import { cn } from '@/lib/utils'

// Selector de unidad (% / $) + input con la unidad pegada al número.
// Usado en Bonificación y Seña (SummaryBar y CierreSection).
export function MontoUnidad({
  tipo,
  valor,
  onTipoChange,
  onValorChange,
  id,
  placeholder = '0',
}) {
  const esPct = tipo === '%'

  return (
    <div className="flex items-center gap-2">
      {/* Selector de unidad segmentado */}
      <div
        role="group"
        aria-label="Unidad"
        className="inline-flex shrink-0 rounded-lg border border-input bg-background p-0.5"
      >
        {['%', 'monto'].map((t) => {
          const active = tipo === t
          return (
            <button
              key={t}
              type="button"
              id={id ? `${id}-tipo-${t}` : undefined}
              aria-pressed={active}
              onClick={() => onTipoChange(t)}
              className={cn(
                'min-w-8 rounded-md px-2.5 py-1 text-sm font-semibold transition',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === '%' ? '%' : '$'}
            </button>
          )
        })}
      </div>

      {/* Input con la unidad pegada */}
      <div className="relative flex-1">
        {!esPct && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
        )}
        <input
          id={id ? `${id}-valor` : undefined}
          type="number"
          inputMode="numeric"
          min={0}
          value={valor || ''}
          onChange={(e) => onValorChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className={cn(
            'h-9 w-full rounded-md border border-input bg-transparent py-1 text-base tabular-nums shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm',
            esPct ? 'pl-3 pr-8' : 'pl-7 pr-3'
          )}
        />
        {esPct && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        )}
      </div>
    </div>
  )
}
