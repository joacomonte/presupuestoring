import { itemFinalARS } from '@/lib/calc'
import { formatARS, formatNro, formatFecha } from '@/lib/format'

function groupByCategoria(items) {
  const groups = []
  for (const it of items) {
    let g = groups.find((x) => x.id === it.categoriaId)
    if (!g) {
      g = { id: it.categoriaId, nombre: it.categoriaNombre || 'Servicios', items: [] }
      groups.push(g)
    }
    g.items.push(it)
  }
  return groups
}

function usaUsd(items) {
  return items.some((it) => it.precioVenta?.moneda === 'USD')
}

function Línea({ label, value, bold, big, color }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={bold ? 'font-semibold' : 'text-zinc-600'} style={color ? { color } : undefined}>
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? 'font-semibold' : ''} ${big ? 'text-xl' : ''}`}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  )
}

// Versión cliente del detalle (lo que se exporta a PDF). Sin costos ni ganancia.
export function DetailDocument({ presupuesto, local, totals, innerRef }) {
  const cot = presupuesto.cotizacionUsd
  const grupos = groupByCategoria(presupuesto.items || [])
  const hayUsd = usaUsd(presupuesto.items || [])

  return (
    <div
      ref={innerRef}
      className="mx-auto max-w-[760px] bg-white p-6 text-zinc-900"
      style={{ colorScheme: 'light' }}
    >
      {/* Encabezado local */}
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          {local.logo ? (
            <img src={local.logo} alt="" className="size-14 rounded-lg object-contain" />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-lg bg-zinc-900 text-lg font-bold text-white">
              {(local.nombre || 'D').slice(0, 1)}
            </div>
          )}
          <div>
            <div className="text-lg font-bold leading-tight">{local.nombre || 'Mi taller'}</div>
            {local.direccion && <div className="text-xs text-zinc-500">{local.direccion}</div>}
            {local.telefono && <div className="text-xs text-zinc-500">{local.telefono}</div>}
            {local.email && <div className="text-xs text-zinc-500">{local.email}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Presupuesto
          </div>
          <div className="text-2xl font-bold tabular-nums">{formatNro(presupuesto.nro)}</div>
          <div className="text-xs text-zinc-500">{formatFecha(presupuesto.fechaEmision)}</div>
        </div>
      </div>

      {/* Cliente / Vehículo */}
      <div className="grid grid-cols-2 gap-4 py-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Cliente
          </div>
          {presupuesto.cliente.nombre ? (
            <div className="text-sm font-medium">{presupuesto.cliente.nombre}</div>
          ) : (
            <div className="text-sm text-zinc-400">—</div>
          )}
          {presupuesto.cliente.telefono && (
            <div className="text-xs text-zinc-500">{presupuesto.cliente.telefono}</div>
          )}
          {presupuesto.cliente.email && (
            <div className="text-xs text-zinc-500">{presupuesto.cliente.email}</div>
          )}
          {presupuesto.cliente.observaciones && (
            <div className="mt-1 text-xs italic text-zinc-500">
              {presupuesto.cliente.observaciones}
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Vehículo
          </div>
          {presupuesto.vehiculo.descripcion ? (
            <div className="text-sm font-medium">{presupuesto.vehiculo.descripcion}</div>
          ) : (
            <div className="text-sm text-zinc-400">—</div>
          )}
          {presupuesto.vehiculo.patente && (
            <div className="text-xs text-zinc-500">Patente: {presupuesto.vehiculo.patente}</div>
          )}
          {presupuesto.vehiculo.estado && (
            <div className="mt-1 text-xs italic text-zinc-500">
              {presupuesto.vehiculo.estado}
            </div>
          )}
          {presupuesto.vehiculo.observaciones && (
            <div className="text-xs italic text-zinc-500">
              {presupuesto.vehiculo.observaciones}
            </div>
          )}
        </div>
      </div>

      {/* Servicios */}
      {grupos.map((g) => (
        <div key={g.id || g.nombre} className="mb-3">
          <div className="mb-1 border-b border-zinc-100 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {g.nombre}
          </div>
          {g.items.map((it) => {
            return (
              <div key={it.id} className="flex items-start justify-between gap-3 py-1.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{it.titulo || 'Ítem'}</div>
                  {it.descripcion && (
                    <div className="text-xs text-zinc-500">{it.descripcion}</div>
                  )}
                  {it.observaciones && (
                    <div className="text-xs italic text-zinc-500">{it.observaciones}</div>
                  )}
                </div>
                <div className="shrink-0 text-sm font-medium tabular-nums">
                  {formatARS(itemFinalARS(it, cot))}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {presupuesto.items.length === 0 && (
        <div className="py-4 text-sm text-zinc-400">Sin servicios cargados.</div>
      )}

      {/* Totales */}
      <div className="mt-2 ml-auto w-full max-w-xs border-t border-zinc-200 pt-2 text-sm">
        <Línea label="Subtotal" value={formatARS(totals.subtotalItems)} />
        {totals.recargoTrabajo > 0 && (
          <Línea
            label={presupuesto.tipoTrabajo?.nombre || 'Tipo de trabajo'}
            value={`+${formatARS(totals.recargoTrabajo)}`}
          />
        )}
        {totals.descuento > 0 && (
          <Línea
            label="Bonificación"
            value={`−${formatARS(totals.descuento)}`}
            color="#059669"
          />
        )}
        {presupuesto.ivaActivo && (
          <Línea label={`IVA (${totals.ivaPct}%)`} value={formatARS(totals.iva)} />
        )}
        <div className="my-1 border-t border-zinc-200" />
        <Línea label="Total" value={formatARS(totals.total)} bold big />
        {totals.sena > 0 && (
          <>
            <Línea label="Seña / anticipo" value={formatARS(totals.sena)} />
            <Línea label="Saldo restante" value={formatARS(totals.saldo)} bold />
          </>
        )}
      </div>

      {/* Cierre */}
      {(presupuesto.tiempoEstimado ||
        presupuesto.formaPago ||
        presupuesto.garantia ||
        presupuesto.observaciones) && (
        <div className="mt-4 space-y-1 border-t border-zinc-200 pt-3 text-xs text-zinc-600">
          {presupuesto.tiempoEstimado && (
            <div>
              <span className="font-semibold text-zinc-700">Tiempo estimado:</span>{' '}
              {presupuesto.tiempoEstimado}
            </div>
          )}
          {presupuesto.formaPago && (
            <div>
              <span className="font-semibold text-zinc-700">Forma de pago:</span>{' '}
              {presupuesto.formaPago}
            </div>
          )}
          {presupuesto.garantia && (
            <div>
              <span className="font-semibold text-zinc-700">Garantía:</span>{' '}
              {presupuesto.garantia}
            </div>
          )}
          {presupuesto.observaciones && (
            <div>
              <span className="font-semibold text-zinc-700">Observaciones:</span>{' '}
              {presupuesto.observaciones}
            </div>
          )}
        </div>
      )}

      {hayUsd && (
        <div className="mt-3 text-[11px] text-zinc-400">
          Cotización USD usada: {formatARS(cot)} por dólar. Importes en USD convertidos a ARS.
        </div>
      )}

      <div className="mt-4 border-t border-zinc-200 pt-2 text-center text-[11px] text-zinc-400">
        Presupuesto sin validez fiscal · Precios sujetos a modificación.
      </div>
    </div>
  )
}
