import { cn } from '@/lib/utils'

// Preview ILUSTRATIVO de un presupuesto, usado en los pasos "preview" del onboarding
// para mostrar qué se va a armar antes de cada paso de edición. NO refleja los datos
// que el usuario carga: es siempre el mismo ejemplo fijo (detailing) y solo resalta
// la capa del paso actual, atenuando las que todavía no se "crearon".
//
// Capas y orden narrativo: secciones (1) → servicios (2) → productos (3).
// - La capa resaltada se acentúa en color primario.
// - Las capas "por encima" (ya creadas en la narrativa) se ven normales.
// - Las capas "por debajo" (todavía no creadas) se atenúan.
const EJEMPLO = [
  {
    seccion: 'Lavado exterior',
    servicios: [
      { titulo: 'Lavado simple', precio: '$18.000', productos: ['Shampoo pH', 'Microfibras'] },
      { titulo: 'Lavado + encerado', precio: '$28.000', productos: ['Cera líquida', 'Shampoo pH'] },
    ],
  },
  {
    seccion: 'Interior',
    servicios: [
      { titulo: 'Interior básico', precio: '$22.000', productos: ['APC', 'Renovador'] },
      { titulo: 'Tratamiento de cuero', precio: '$35.000', productos: ['Acondicionador'] },
    ],
  },
  {
    seccion: 'Tratamientos',
    servicios: [{ titulo: 'Cerámico 9H', precio: '$120.000', productos: ['Recubrimiento 9H'] }],
  },
]

const ORDER = { secciones: 1, servicios: 2, productos: 3 }

export function OnboardingPreview({ nombre, highlight }) {
  const active = ORDER[highlight] ?? 0
  // Atenúa una capa solo si está "por debajo" de la resaltada (todavía no creada).
  const dim = (layer) => (ORDER[layer] > active ? 'opacity-30' : '')

  return (
    <div
      className="select-none overflow-hidden rounded-xl border bg-white text-zinc-900 shadow-sm"
      style={{ colorScheme: 'light' }}
      aria-hidden
    >
      {/* Encabezado del local */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
            {(nombre || 'T').slice(0, 1).toUpperCase()}
          </div>
          <div className="truncate text-sm font-bold leading-tight">{nombre || 'Tu negocio'}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Presupuesto
          </div>
          <div className="text-sm font-bold tabular-nums">N° 0001</div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {EJEMPLO.map((g) => (
          <div key={g.seccion}>
            {/* Capa secciones */}
            <div
              className={cn(
                'mb-1 inline-block border-b border-zinc-100 pb-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                highlight === 'secciones'
                  ? 'rounded bg-primary/10 px-1.5 text-primary'
                  : 'text-zinc-400',
                dim('secciones')
              )}
            >
              {g.seccion}
            </div>

            {g.servicios.map((s) => (
              <div key={s.titulo} className="py-1">
                {/* Capa servicios */}
                <div className={cn('flex items-center justify-between gap-2 transition-colors', dim('servicios'))}>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      highlight === 'servicios' && 'text-primary'
                    )}
                  >
                    {s.titulo}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-medium tabular-nums',
                      highlight === 'servicios' ? 'text-primary' : 'text-zinc-500'
                    )}
                  >
                    {s.precio}
                  </span>
                </div>

                {/* Capa productos (chips) */}
                <div className={cn('mt-1 flex flex-wrap gap-1 transition-opacity', dim('productos'))}>
                  {s.productos.map((p) => (
                    <span
                      key={p}
                      className={cn(
                        'rounded-full border px-1.5 py-0.5 text-[10px] transition-colors',
                        highlight === 'productos'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                      )}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Total ilustrativo */}
        <div className="ml-auto w-32 border-t border-zinc-200 pt-1.5">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Total</span>
            <span className="tabular-nums">$223.000</span>
          </div>
        </div>
      </div>
    </div>
  )
}
