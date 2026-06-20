import { uid } from './id'
import { emptyMoney, IVA_DEFAULT } from './calc'

// Materializa un ítem del catálogo en un snapshot editable del presupuesto.
// Congela precio, opciones, productos y mano de obra.
export function materializeItem(catalogItem, ctx) {
  const { productos, categorias } = ctx
  const precioVenta = catalogItem.precioVenta || emptyMoney()
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
    opcionesTexto: catalogItem.opcionesTexto || '',
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

// Crea un presupuesto borrador con defaults (sin N°: se asigna al guardar).
export function createDraft(state) {
  const { config, paquetes, items, productos, categorias, formasPago } = state
  const ctx = { productos, items, categorias }

  // Preselecciona el paquete destacado (más vendido).
  let draftItems = []
  const destacado = paquetes.find((p) => p.id === config.paqueteDestacadoId)
  if (destacado) {
    draftItems = (destacado.itemIds || [])
      .map((id) => items.find((it) => it.id === id))
      .filter(Boolean)
      .map((ci) => materializeItem(ci, ctx))
  }

  return {
    id: uid('pre'),
    nro: null,
    fechaEmision: new Date().toISOString(),
    cliente: {
      nombre: '',
      apodo: '',
      telefono: '',
      email: '',
      facturacion: '',
      observaciones: '',
    },
    vehiculo: {
      descripcion: '',
      patente: '',
      estado: '',
      observaciones: '',
    },
    tipoTrabajo: null,
    items: draftItems,
    tiempoEstimado: '',
    formaPago:
      (formasPago || []).find((f) => f.id === config.formaPagoDefaultId)?.nombre ?? '',
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
