// Link compartible autocontenido (sin backend): el presupuesto viaja codificado
// dentro del propio link, en el #hash (nunca se manda al server). El que lo recibe
// lo abre en /ver y se renderiza con el mismo template del detalle.

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

// Sin logo (decisión): mantiene el link corto. Solo datos de texto del taller.
function sanitizeLocal(l) {
  return {
    nombre: l?.nombre,
    direccion: l?.direccion,
    telefono: l?.telefono,
    email: l?.email,
  }
}

// base64url UTF-8 safe (btoa no soporta acentos/ñ directo).
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeShare(presupuesto, local) {
  const payload = {
    v: VER,
    p: sanitizePresupuesto(presupuesto),
    l: sanitizeLocal(local),
  }
  return toBase64Url(JSON.stringify(payload))
}

export function decodeShare(token) {
  const payload = JSON.parse(fromBase64Url(token))
  return { presupuesto: payload.p, local: payload.l }
}

export function buildShareUrl(presupuesto, local) {
  return `${window.location.origin}/ver#${encodeShare(presupuesto, local)}`
}
