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

// Resuelve un delta de opción a ARS. Los % se aplican sobre el precio base del ítem.
export function resolveDeltaARS(delta, baseARS, cotizacionUsd) {
  if (!delta) return 0
  if (delta.modo === 'pct') return (baseARS * (Number(delta.pct) || 0)) / 100
  return toARS(delta.monto, cotizacionUsd)
}

// Precio del ítem en la matriz para un tipo de auto, con fallback por multiplicador.
export function resolveMatrixPrice(item, tipoAutoId, tiposAuto) {
  const precios = item.precios || {}
  if (tipoAutoId && precios[tipoAutoId]) return { ...precios[tipoAutoId] }

  const baseTipo =
    tiposAuto.find((t) => t.base) ||
    tiposAuto.find((t) => Number(t.multiplicador) === 1) ||
    tiposAuto[0]
  const basePrice = baseTipo ? precios[baseTipo.id] : null
  const tipo = tiposAuto.find((t) => t.id === tipoAutoId)

  if (basePrice && tipo && baseTipo && baseTipo.multiplicador) {
    const ratio = (Number(tipo.multiplicador) || 1) / Number(baseTipo.multiplicador)
    return { valor: roundPrice(basePrice.valor * ratio), moneda: basePrice.moneda }
  }
  if (basePrice) return { ...basePrice }
  const first = Object.values(precios)[0]
  return first ? { ...first } : emptyMoney()
}

export function roundPrice(n) {
  // Redondeo "comercial" al $100 para ARS; USD se deja entero.
  return Math.round((Number(n) || 0) / 100) * 100
}

// ---- Cálculos a nivel ítem (snapshot PresupuestoItem) ----

export function itemBaseARS(item, cotizacionUsd) {
  return toARS(item.precioVenta, cotizacionUsd)
}

export function itemOpcionesDeltaARS(item, cotizacionUsd) {
  const baseARS = itemBaseARS(item, cotizacionUsd)
  let total = 0
  for (const op of item.opciones || []) {
    const sel = item.seleccion?.[op.id]
    if (op.tipo === 'select') {
      const val = (op.valores || []).find((v) => v.id === sel)
      if (val) total += resolveDeltaARS(val.delta, baseARS, cotizacionUsd)
    } else if (op.tipo === 'addons') {
      for (const a of op.opciones || []) {
        if (sel?.[a.id]) total += resolveDeltaARS(a.delta, baseARS, cotizacionUsd)
      }
    } else if (op.tipo === 'cantidad') {
      const qty = sel ?? op.default ?? 0
      total += toARS(op.precioUnitario, cotizacionUsd) * qty
    }
  }
  return total
}

export function itemFinalARS(item, cotizacionUsd) {
  return itemBaseARS(item, cotizacionUsd) + itemOpcionesDeltaARS(item, cotizacionUsd)
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

// Etiquetas legibles de las opciones elegidas (para el detalle).
export function itemOpcionesElegidas(item, cotizacionUsd) {
  const baseARS = itemBaseARS(item, cotizacionUsd)
  const out = []
  for (const op of item.opciones || []) {
    const sel = item.seleccion?.[op.id]
    if (op.tipo === 'select') {
      const val = (op.valores || []).find((v) => v.id === sel)
      if (val) {
        const d = resolveDeltaARS(val.delta, baseARS, cotizacionUsd)
        out.push({ nombre: op.nombre, label: val.label, deltaARS: d })
      }
    } else if (op.tipo === 'addons') {
      for (const a of op.opciones || []) {
        if (sel?.[a.id]) {
          const d = resolveDeltaARS(a.delta, baseARS, cotizacionUsd)
          out.push({ nombre: op.nombre, label: a.label, deltaARS: d })
        }
      }
    } else if (op.tipo === 'cantidad') {
      const qty = sel ?? op.default ?? 0
      if (qty > 0) {
        const d = toARS(op.precioUnitario, cotizacionUsd) * qty
        out.push({ nombre: op.nombre, label: `${qty} u.`, deltaARS: d })
      }
    }
  }
  return out
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
  const subtotal = subtotalARS(items, cot)
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
