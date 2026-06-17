// Formato de moneda. ARS: separador de miles, sin decimales -> $45.000
// USD: USD 100. Locale es-AR usa "." como separador de miles.

export function formatARS(n) {
  const v = Math.round(Number(n) || 0)
  return '$' + v.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export function formatUSD(n) {
  const v = Math.round(Number(n) || 0)
  return 'USD ' + v.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

// money = { valor, moneda: 'ARS' | 'USD' }
export function formatMoney(money) {
  if (!money) return formatARS(0)
  return money.moneda === 'USD' ? formatUSD(money.valor) : formatARS(money.valor)
}

// Numero plano con separador de miles (sin signo $).
export function formatNumber(n) {
  const v = Math.round(Number(n) || 0)
  return v.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

// N° de presupuesto con padding visual -> #0001
export function formatNro(nro) {
  if (nro == null) return '#----'
  return '#' + String(nro).padStart(4, '0')
}

// Etiqueta de un delta de opción para mostrar como hint ("+$30.000", "+USD 65", "+15%").
export function deltaLabel(delta) {
  if (!delta) return null
  if (delta.modo === 'pct') {
    if (!delta.pct) return null
    return (delta.pct > 0 ? '+' : '') + delta.pct + '%'
  }
  const m = delta.monto
  if (!m || !m.valor) return null
  return (m.valor > 0 ? '+' : '') + formatMoney(m)
}

// Fecha ISO -> dd/mm/aaaa
export function formatFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
