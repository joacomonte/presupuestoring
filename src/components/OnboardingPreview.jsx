import { cn } from '@/lib/utils'

// Preview ILUSTRATIVO de un presupuesto, usado en los pasos "preview" del onboarding
// para mostrar qué se va a armar antes de cada paso de edición. Recibe `data` (el
// preview del rubro elegido en el paso 2) y solo resalta la capa del paso actual,
// atenuando las que todavía no se "crearon". Los montos son ilustrativos.
//
// Capas y orden narrativo: secciones (1) → servicios (2) → productos (3).
// - La capa resaltada se acentúa en color primario.
// - Las capas "por encima" (ya creadas en la narrativa) se ven normales.
// - Las capas "por debajo" (todavía no creadas) se atenúan.
// - El primer elemento de la capa resaltada recibe `targetId` para que la flecha
//   conectora del paso (OnboardingArrow, en AccountGate) sepa adónde apuntar.
//
// Modo `blur` (cuando se eligió "empezar de cero"): secciones genéricas (Sección 1,
// 2, 3) y los datos de servicios/productos se muestran borroneados, como placeholder
// de "acá van tus datos".
const PLACEHOLDER = [
  {
    seccion: 'Sección 1',
    servicios: [
      { titulo: 'Servicio uno', precio: '$00.000', productos: ['Producto', 'Producto'] },
      { titulo: 'Servicio dos', precio: '$00.000', productos: ['Producto'] },
    ],
  },
  {
    seccion: 'Sección 2',
    servicios: [{ titulo: 'Servicio tres', precio: '$00.000', productos: ['Producto', 'Producto'] }],
  },
  {
    seccion: 'Sección 3',
    servicios: [{ titulo: 'Servicio cuatro', precio: '$00.000', productos: ['Producto'] }],
  },
]

const ORDER = { secciones: 1, servicios: 2, productos: 3 }

export function OnboardingPreview({ nombre, highlight, data, total = '$223.000', blur = false, targetId }) {
  const grupos = blur ? PLACEHOLDER : data ?? PLACEHOLDER
  const active = ORDER[highlight] ?? 0
  // Atenúa una capa solo si está "por debajo" de la resaltada (todavía no creada).
  const dim = (layer) => (ORDER[layer] > active ? 'opacity-30' : '')
  // En modo "de cero" los datos (servicios y productos) van borroneados.
  const blurData = blur ? 'blur-[3px] select-none' : ''
  // id del primer elemento de la capa resaltada: destino de la flecha conectora.
  const targetIf = (on) => (on && targetId ? targetId : undefined)

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
        {grupos.map((g, gi) => (
          <div key={g.seccion}>
            {/* Capa secciones */}
            <div className="mb-1 flex items-center">
              <span
                id={targetIf(highlight === 'secciones' && gi === 0)}
                className={cn(
                  'inline-block border-b border-zinc-100 pb-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                  highlight === 'secciones'
                    ? 'rounded bg-primary/10 px-1.5 text-primary'
                    : 'text-zinc-400',
                  dim('secciones')
                )}
              >
                {g.seccion}
              </span>
            </div>

            {g.servicios.map((s, si) => (
              <div key={s.titulo} className="py-1">
                {/* Capa servicios */}
                <div className={cn('flex items-center justify-between gap-2 transition-colors', dim('servicios'))}>
                  <span className="flex min-w-0 items-center">
                    <span
                      id={targetIf(highlight === 'servicios' && gi === 0 && si === 0)}
                      className={cn(
                        'truncate text-xs font-medium',
                        highlight === 'servicios' && 'text-primary',
                        blurData
                      )}
                    >
                      {s.titulo}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-medium tabular-nums',
                      highlight === 'servicios' ? 'text-primary' : 'text-zinc-500',
                      blurData
                    )}
                  >
                    {s.precio}
                  </span>
                </div>

                {/* Capa productos: insumos usados, en texto gris (no badges) */}
                <div
                  className={cn(
                    'mt-0.5 flex flex-wrap items-center gap-x-1 text-[10px] leading-snug transition-colors',
                    dim('productos')
                  )}
                >
                  <span className={cn('font-medium', highlight === 'productos' ? 'text-primary' : 'text-zinc-400')}>
                    Se utilizó:
                  </span>
                  <span
                    id={targetIf(highlight === 'productos' && gi === 0 && si === 0)}
                    className={cn(highlight === 'productos' ? 'text-primary' : 'text-zinc-500', blurData)}
                  >
                    {s.productos.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Total ilustrativo */}
        <div className="ml-auto w-32 border-t border-zinc-200 pt-1.5">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Total</span>
            <span className={cn('tabular-nums', blurData)}>{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
