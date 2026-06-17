import { uid } from './id'
import { resolveMatrixPrice, emptyMoney, IVA_DEFAULT } from './calc'

// Materializa un ítem del catálogo en un snapshot editable del presupuesto.
// Congela precio (segun tipo de auto), opciones, productos y mano de obra.
export function materializeItem(catalogItem, tipoAutoId, ctx) {
  const { tiposAuto, productos, categorias } = ctx
  const precioVenta = resolveMatrixPrice(catalogItem, tipoAutoId, tiposAuto)
  const categoria = (categorias || []).find((c) => c.id === catalogItem.categoriaId)

  const seleccion = {}
  for (const op of catalogItem.opciones || []) {
    if (op.tipo === 'select') seleccion[op.id] = op.defaultId
    else if (op.tipo === 'addons')
      seleccion[op.id] = Object.fromEntries(
        (op.opciones || []).map((a) => [a.id, !!a.default])
      )
    else if (op.tipo === 'cantidad') seleccion[op.id] = op.default ?? 1
  }

  const prods = (catalogItem.productoIds || [])
    .map((pid) => {
      const p = productos.find((x) => x.id === pid)
      return p
        ? { id: p.id, nombre: p.nombre, marca: p.marca, costo: { ...p.costo } }
        : null
    })
    .filter(Boolean)

  return {
    id: uid('it'),
    catalogoItemId: catalogItem.id,
    categoriaId: catalogItem.categoriaId,
    categoriaNombre: categoria?.nombre || '',
    titulo: catalogItem.titulo,
    descripcion: catalogItem.descripcion,
    precioVenta: { ...precioVenta },
    opciones: structuredClone(catalogItem.opciones || []),
    seleccion,
    productos: prods,
    manoObra: { ...(catalogItem.manoObra || emptyMoney()) },
    observaciones: '',
  }
}

// Ítem en blanco (manual, sin catálogo).
export function blankItem(categoriaId, categoriaNombre = '') {
  return {
    id: uid('it'),
    catalogoItemId: null,
    categoriaId: categoriaId || null,
    categoriaNombre,
    titulo: '',
    descripcion: '',
    precioVenta: emptyMoney(),
    opciones: [],
    seleccion: {},
    productos: [],
    manoObra: emptyMoney(),
    observaciones: '',
  }
}

// Recalcula el precio base de un ítem ya materializado al cambiar el tipo de auto.
export function repriceItem(item, tipoAutoId, ctx) {
  const catalogItem = ctx.items.find((c) => c.id === item.catalogoItemId)
  if (!catalogItem) return item // ítem manual: no se reprecia
  const precioVenta = resolveMatrixPrice(catalogItem, tipoAutoId, ctx.tiposAuto)
  return { ...item, precioVenta: { ...precioVenta } }
}

// Crea un presupuesto borrador con defaults (sin N°: se asigna al guardar).
export function createDraft(state) {
  const { config, paquetes, items, tiposAuto, productos, categorias } = state
  const ctx = { tiposAuto, productos, items, categorias }

  // Preselecciona el paquete destacado (más vendido).
  let draftItems = []
  const destacado = paquetes.find((p) => p.id === config.paqueteDestacadoId)
  if (destacado) {
    draftItems = (destacado.itemIds || [])
      .map((id) => items.find((it) => it.id === id))
      .filter(Boolean)
      .map((ci) => materializeItem(ci, null, ctx))
  }

  return {
    id: uid('pre'),
    nro: null,
    fechaEmision: new Date().toISOString(),
    cliente: {
      nombre: '',
      telefono: '',
      email: '',
      facturacion: '',
      observaciones: '',
    },
    vehiculo: {
      descripcion: '',
      patente: '',
      tipoAutoId: null,
      estado: '',
      observaciones: '',
    },
    items: draftItems,
    tiempoEstimado: '',
    formaPago: '',
    garantia: '',
    observaciones: '',
    ivaActivo: false,
    ivaPct: config.ivaPct ?? IVA_DEFAULT,
    descuento: { tipo: '%', valor: 0 },
    sena: { tipo: '%', valor: 0 },
    cotizacionUsd: config.cotizacionUsd,
    createdAt: null,
    updatedAt: null,
  }
}

// Duplica un presupuesto guardado como nuevo borrador.
export function duplicateDraft(pre) {
  const copy = structuredClone(pre)
  copy.id = uid('pre')
  copy.nro = null
  copy.fechaEmision = new Date().toISOString()
  copy.createdAt = null
  copy.updatedAt = null
  copy.items = (copy.items || []).map((it) => ({ ...it, id: uid('it') }))
  return copy
}
