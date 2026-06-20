// Link compartible vía backend: el presupuesto se guarda en KV (Upstash) a través
// de /api/share y se comparte un link corto en nuestro dominio: /ver/<id>.
// Sin #, sin terceros, sin payload en la URL.

import { itemFinalARS } from '@/lib/calc'
import { formatARS, formatNro, formatFecha } from '@/lib/format'

const VER = 1 // versión del formato del payload, por si cambia el modelo

// El contenido del link es visible para quien lo recibe → NO debe filtrar costos.
// Quitamos costos de productos, mano de obra y la matriz de precios interna.
function sanitizeItem(it) {
  const { productos, manoObra, precios, ...rest } = it
  return rest
}

function sanitizePresupuesto(p) {
  return {
    nro: p.nro,
    fechaEmision: p.fechaEmision,
    cliente: p.cliente,
    vehiculo: p.vehiculo,
    items: (p.items || []).map(sanitizeItem),
    cotizacionUsd: p.cotizacionUsd,
    descuento: p.descuento,
    ivaActivo: p.ivaActivo,
    ivaPct: p.ivaPct,
    sena: p.sena,
    tiempoEstimado: p.tiempoEstimado,
    formaPago: p.formaPago,
    garantia: p.garantia,
    observaciones: p.observaciones,
  }
}

// Sin logo (decisión): el header del documento muestra nombre/datos de texto.
function sanitizeLocal(l) {
  return {
    nombre: l?.nombre,
    direccion: l?.direccion,
    telefono: l?.telefono,
    email: l?.email,
  }
}

function buildSharePayload(presupuesto, local) {
  return { v: VER, p: sanitizePresupuesto(presupuesto), l: sanitizeLocal(local) }
}

// Guarda el presupuesto en el backend y devuelve el link corto. Lanza si falla.
export async function createShareLink(presupuesto, local) {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: buildSharePayload(presupuesto, local) }),
  })
  if (!res.ok) throw new Error('No se pudo crear el link')
  const { id } = await res.json()
  return `${window.location.origin}/ver/${id}`
}

// Resumen tipo texto para pegar en WhatsApp. Usa el formato de WhatsApp:
// *negrita*, _itálica_. Refleja la vista cliente (sin costos ni ganancia).
export function buildWhatsappText(presupuesto, local, totals) {
  const cot = presupuesto.cotizacionUsd
  const L = []

  if (local?.nombre) L.push(`*${local.nombre}*`)
  L.push(`Presupuesto ${formatNro(presupuesto.nro)} · ${formatFecha(presupuesto.fechaEmision)}`)
  L.push('')

  if (presupuesto.cliente?.nombre) L.push(`*Cliente:* ${presupuesto.cliente.nombre}`)
  const veh = presupuesto.vehiculo
  if (veh?.descripcion) {
    L.push(`*Vehículo:* ${veh.descripcion}${veh.patente ? ` (${veh.patente})` : ''}`)
  }
  if (presupuesto.cliente?.nombre || veh?.descripcion) L.push('')

  const items = presupuesto.items || []
  if (items.length > 0) {
    L.push('*Servicios*')
    for (const it of items) {
      L.push(`• ${it.titulo || 'Ítem'} — ${formatARS(itemFinalARS(it, cot))}`)
    }
    L.push('')
  }

  L.push(`Subtotal: ${formatARS(totals.subtotalItems)}`)
  if (totals.recargoTrabajo > 0)
    L.push(
      `${presupuesto.tipoTrabajo?.nombre || 'Tipo de trabajo'}: +${formatARS(totals.recargoTrabajo)}`
    )
  if (totals.descuento > 0) L.push(`Bonificación: −${formatARS(totals.descuento)}`)
  if (presupuesto.ivaActivo) L.push(`IVA (${totals.ivaPct}%): ${formatARS(totals.iva)}`)
  L.push(`*Total: ${formatARS(totals.total)}*`)
  if (totals.sena > 0) {
    L.push(`Seña / anticipo: ${formatARS(totals.sena)}`)
    L.push(`Saldo restante: ${formatARS(totals.saldo)}`)
  }

  const cierre = []
  if (presupuesto.tiempoEstimado) cierre.push(`*Tiempo estimado:* ${presupuesto.tiempoEstimado}`)
  if (presupuesto.formaPago) cierre.push(`*Forma de pago:* ${presupuesto.formaPago}`)
  if (presupuesto.garantia) cierre.push(`*Garantía:* ${presupuesto.garantia}`)
  if (presupuesto.observaciones) cierre.push(`*Observaciones:* ${presupuesto.observaciones}`)
  if (cierre.length > 0) {
    L.push('')
    L.push(...cierre)
  }

  return L.join('\n')
}

// Trae un presupuesto compartido por id. Devuelve null si no existe.
export async function fetchShared(id) {
  const res = await fetch(`/api/share?id=${encodeURIComponent(id)}`)
  if (!res.ok) return null
  const payload = await res.json()
  return { presupuesto: payload.p, local: payload.l }
}
