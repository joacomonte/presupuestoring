import { formatNro, formatARS } from './format'

// Construye el link wa.me con mensaje precargado (PRD §4.2).
// Si no hay teléfono, abre WhatsApp sin destinatario.
export function buildWhatsappLink(presupuesto, local) {
  const num = (presupuesto.cliente?.telefono || '').replace(/[^\d]/g, '')
  const saludo = presupuesto.cliente?.nombre
    ? `Hola ${presupuesto.cliente.nombre}!`
    : '¡Hola!'
  const totalARS = presupuesto.__totalARS
  const partes = [
    saludo,
    `Te paso el presupuesto ${formatNro(presupuesto.nro)}${local?.nombre ? ` de ${local.nombre}` : ''}.`,
  ]
  if (totalARS != null) partes.push(`Total: ${formatARS(totalARS)}.`)
  partes.push('Te adjunto el PDF con el detalle. ¡Cualquier duda me avisás!')
  const text = encodeURIComponent(partes.join(' '))
  return num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`
}
