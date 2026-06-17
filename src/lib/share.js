// Link compartible autocontenido (sin backend): el presupuesto viaja codificado
// dentro del propio link, en el #hash (nunca se manda al server). El que lo recibe
// lo abre en /ver y se renderiza con el mismo template del detalle.
//
// Se comprime con gzip (CompressionStream) para que la URL no sea enorme — el JSON
// es muy repetitivo y comprime ~5x. Si el browser no soporta gzip, cae a plano.

const VER = 1 // versión del formato del payload, por si cambia el modelo
const MARK_GZIP = 'c'
const MARK_PLAIN = 'u'

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

// base64url (URL-safe: usa - y _ en vez de + y /, sin padding).
function bytesToBase64Url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function gzip(str) {
  const stream = new Blob([new TextEncoder().encode(str)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return await new Response(stream).text()
}

export async function encodeShare(presupuesto, local) {
  const json = JSON.stringify({
    v: VER,
    p: sanitizePresupuesto(presupuesto),
    l: sanitizeLocal(local),
  })
  if (typeof CompressionStream !== 'undefined') {
    try {
      return MARK_GZIP + bytesToBase64Url(await gzip(json))
    } catch {
      // cae a plano
    }
  }
  return MARK_PLAIN + bytesToBase64Url(new TextEncoder().encode(json))
}

export async function decodeShare(token) {
  const mark = token[0]
  const bytes = base64UrlToBytes(token.slice(1))
  const json = mark === MARK_GZIP ? await gunzip(bytes) : new TextDecoder().decode(bytes)
  const payload = JSON.parse(json)
  return { presupuesto: payload.p, local: payload.l }
}

export async function buildShareUrl(presupuesto, local) {
  return `${window.location.origin}/ver#${await encodeShare(presupuesto, local)}`
}
