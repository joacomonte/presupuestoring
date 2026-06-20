// Motor de cálculo. Todo se convierte a ARS para sumar/mostrar.
// money = { valor:number, moneda:'ARS'|'USD' }
// delta = { modo:'monto', monto:money } | { modo:'pct', pct:number }

export const IVA_DEFAULT = 21

export function toARS(money, cotizacionUsd) {
  if (!money) return 0
  const v = Number(money.valor) || 0
  return money.moneda === 'USD' ? v * (Number(cotizacionUsd) || 0) : v
}

export function emptyMoney(moneda = 'ARS') {
  return { valor: 0, moneda }
}

export function roundPrice(n) {
  // Redondeo "comercial" al $100 para ARS; USD se deja entero.
  return Math.round((Number(n) || 0) / 100) * 100
}

// ---- Cálculos a nivel ítem (snapshot PresupuestoItem) ----

export function itemBaseARS(item, cotizacionUsd) {
  return toARS(item.precioVenta, cotizacionUsd)
}

export function itemFinalARS(item, cotizacionUsd) {
  return itemBaseARS(item, cotizacionUsd)
}

export function itemCostoARS(item, cotizacionUsd) {
  const prods = (item.productos || []).reduce(
    (s, p) => s + toARS(p.costo, cotizacionUsd),
    0
  )
  return prods + toARS(item.manoObra, cotizacionUsd)
}

export function itemGananciaARS(item, cotizacionUsd) {
  return itemFinalARS(item, cotizacionUsd) - itemCostoARS(item, cotizacionUsd)
}

// ---- Cálculos a nivel presupuesto ----

export function subtotalARS(items, cotizacionUsd) {
  return (items || []).reduce((s, it) => s + itemFinalARS(it, cotizacionUsd), 0)
}

export function costoTotalARS(items, cotizacionUsd) {
  return (items || []).reduce((s, it) => s + itemCostoARS(it, cotizacionUsd), 0)
}

// descuento/seña = { tipo:'%'|'monto', valor:number }
export function aplicarPorcentajeOMonto(base, regla) {
  if (!regla || !regla.valor) return 0
  const valor = Number(regla.valor) || 0
  if (regla.tipo === '%') return (base * valor) / 100
  return valor // monto fijo en ARS
}

// Cómputo completo del presupuesto.
export function computeTotals(presupuesto) {
  const cot = Number(presupuesto.cotizacionUsd) || 0
  const items = presupuesto.items || []
  const subtotalItems = subtotalARS(items, cot)
  const subtotal = subtotalItems
  const descuento = Math.min(
    aplicarPorcentajeOMonto(subtotal, presupuesto.descuento),
    subtotal
  )
  const baseImponible = subtotal - descuento
  const ivaPct = Number(presupuesto.ivaPct) || IVA_DEFAULT
  const iva = presupuesto.ivaActivo ? (baseImponible * ivaPct) / 100 : 0
  const total = baseImponible + iva
  const sena = Math.min(aplicarPorcentajeOMonto(total, presupuesto.sena), total)
  const saldo = total - sena
  const costo = costoTotalARS(items, cot)
  const ganancia = baseImponible - costo // ganancia tras bonificación (sin IVA)

  return {
    subtotalItems,
    subtotal,
    descuento,
    baseImponible,
    ivaPct,
    iva,
    total,
    sena,
    saldo,
    costo,
    ganancia,
    margenPct: baseImponible > 0 ? (ganancia / baseImponible) * 100 : 0,
  }
}
