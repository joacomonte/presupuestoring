import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeed, migrateData, STORAGE_KEY, SEED_VERSION } from '@/data/seed'
import { uid } from '@/lib/id'
import { createDraft as buildDraft, duplicateDraft } from '@/lib/budget'

export const DATA_KEYS = [
  'seedVersion',
  'config',
  'local',
  'formasPago',
  'categorias',
  'productos',
  'items',
  'plantillas',
  'presupuestos',
  'nextNro',
]

const nowISO = () => new Date().toISOString()

function scaleMoneyBy(money, factor) {
  if (!money) return money
  const raw = (Number(money.valor) || 0) * factor
  const valor =
    money.moneda === 'ARS' ? Math.round(raw / 100) * 100 : Math.round(raw)
  return { ...money, valor }
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...buildSeed(),

      // Cambios de ajustes/catálogos sin guardar en la DB (no se persiste ni se sube).
      dirty: false,

      // ---------------- Config ----------------
      setCotizacionUsd: (v) =>
        set((s) => ({ config: { ...s.config, cotizacionUsd: Number(v) || 0 } })),
      setIvaPct: (v) =>
        set((s) => ({ config: { ...s.config, ivaPct: Number(v) || 0 } })),
      setPlantillaDestacada: (id) =>
        set((s) => ({ config: { ...s.config, plantillaDestacadaId: id } })),
      setFormaPagoDefault: (id) =>
        set((s) => ({ config: { ...s.config, formaPagoDefaultId: id } })),
      setLocal: (patch) => set((s) => ({ local: { ...s.local, ...patch } })),

      // ---------------- Formas de pago ----------------
      addFormaPago: (nombre) => {
        const id = uid('fp')
        set((s) => ({ formasPago: [...s.formasPago, { id, nombre }] }))
        return id
      },
      updateFormaPago: (id, patch) =>
        set((s) => ({
          formasPago: s.formasPago.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),
      removeFormaPago: (id) =>
        set((s) => ({ formasPago: s.formasPago.filter((f) => f.id !== id) })),

      // ---------------- Categorías ----------------
      addCategoria: (nombre) => {
        const id = uid('cat')
        set((s) => ({
          categorias: [
            ...s.categorias,
            { id, nombre, orden: Math.max(0, ...s.categorias.map((c) => c.orden)) + 1 },
          ],
        }))
        return id
      },
      updateCategoria: (id, patch) =>
        set((s) => ({
          categorias: s.categorias.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCategoria: (id) =>
        set((s) => ({ categorias: s.categorias.filter((c) => c.id !== id) })),
      reorderCategorias: (orderedIds) =>
        set((s) => {
          const byId = new Map(s.categorias.map((c) => [c.id, c]))
          return {
            categorias: orderedIds
              .map((id, idx) => {
                const c = byId.get(id)
                return c ? { ...c, orden: idx } : null
              })
              .filter(Boolean),
          }
        }),

      // ---------------- Productos ----------------
      addProducto: (data) => {
        const id = uid('prod')
        set((s) => ({
          productos: [
            ...s.productos,
            { id, nombre: '', marca: '', costo: { valor: 0, moneda: 'ARS' }, ...data },
          ],
        }))
        return id
      },
      updateProducto: (id, patch) =>
        set((s) => ({
          productos: s.productos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProducto: (id) =>
        set((s) => ({
          productos: s.productos.filter((p) => p.id !== id),
          items: s.items.map((it) => ({
            ...it,
            productoIds: (it.productoIds || []).filter((pid) => pid !== id),
          })),
        })),

      // ---------------- Ítems de catálogo ----------------
      addItem: (data) => {
        const id = uid('item')
        set((s) => ({
          items: [
            ...s.items,
            {
              id,
              categoriaId: null,
              titulo: '',
              descripcion: '',
              precioVenta: { valor: 0, moneda: 'ARS' },
              productoIds: [],
              manoObra: { valor: 0, moneda: 'ARS' },
              opciones: [],
              ...data,
            },
          ],
        }))
        return id
      },
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),
      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((it) => it.id !== id),
          plantillas: s.plantillas.map((p) => ({
            ...p,
            itemIds: (p.itemIds || []).filter((iid) => iid !== id),
          })),
        })),

      // ---------------- Plantillas ----------------
      addPlantilla: (data) => {
        const id = uid('plt')
        set((s) => ({
          plantillas: [
            ...s.plantillas,
            { id, nombre: '', descripcion: '', itemIds: [], ...data },
          ],
        }))
        return id
      },
      updatePlantilla: (id, patch) =>
        set((s) => ({
          plantillas: s.plantillas.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePlantilla: (id) =>
        set((s) => ({ plantillas: s.plantillas.filter((p) => p.id !== id) })),
      reorderPlantillas: (orderedIds) =>
        set((s) => ({
          plantillas: orderedIds
            .map((id) => s.plantillas.find((p) => p.id === id))
            .filter(Boolean),
        })),

      // ---------------- Actualización masiva de precios ----------------
      // Escala precios de venta (matriz), deltas (monto) y precios unitarios.
      // No toca costos internos (productos / mano de obra).
      bumpPrices: ({ pct, categoriaId } = {}) => {
        const factor = 1 + (Number(pct) || 0) / 100
        if (factor === 1) return
        set((s) => ({
          items: s.items.map((it) => {
            if (categoriaId && it.categoriaId !== categoriaId) return it
            const precioVenta = scaleMoneyBy(it.precioVenta, factor)
            const opciones = (it.opciones || []).map((op) => {
              if (op.tipo === 'select') {
                return {
                  ...op,
                  valores: op.valores.map((v) =>
                    v.delta?.modo === 'monto'
                      ? { ...v, delta: { ...v.delta, monto: scaleMoneyBy(v.delta.monto, factor) } }
                      : v
                  ),
                }
              }
              if (op.tipo === 'addons') {
                return {
                  ...op,
                  opciones: op.opciones.map((a) =>
                    a.delta?.modo === 'monto'
                      ? { ...a, delta: { ...a.delta, monto: scaleMoneyBy(a.delta.monto, factor) } }
                      : a
                  ),
                }
              }
              if (op.tipo === 'cantidad') {
                return { ...op, precioUnitario: scaleMoneyBy(op.precioUnitario, factor) }
              }
              return op
            })
            return { ...it, precioVenta, opciones }
          }),
        }))
      },

      // ---------------- Presupuestos ----------------
      createDraft: () => buildDraft(get()),

      duplicateBudget: (id) => {
        const p = get().presupuestos.find((x) => x.id === id)
        return p ? duplicateDraft(p) : null
      },

      getBudget: (id) => get().presupuestos.find((p) => p.id === id),

      saveBudget: (pre) => {
        const s = get()
        const exists = s.presupuestos.some((p) => p.id === pre.id)
        const now = nowISO()
        let saved
        if (!exists) {
          const nro = pre.nro == null ? s.nextNro : pre.nro
          saved = { ...pre, nro, createdAt: now, updatedAt: now }
          set({
            presupuestos: [...s.presupuestos, saved],
            nextNro: Math.max(s.nextNro, nro + 1),
          })
        } else {
          saved = { ...pre, updatedAt: now }
          set({
            presupuestos: s.presupuestos.map((p) => (p.id === saved.id ? saved : p)),
          })
        }
        return saved
      },

      removeBudget: (id) =>
        set((s) => ({ presupuestos: s.presupuestos.filter((p) => p.id !== id) })),

      // ---------------- Gestión de datos ----------------
      resetData: () => set(buildSeed()),

      exportData: () => {
        const s = get()
        const out = { __app: STORAGE_KEY, __version: SEED_VERSION, exportedAt: nowISO() }
        for (const k of DATA_KEYS) out[k] = s[k]
        return out
      },

      importData: (obj) => {
        if (!obj || typeof obj !== 'object') throw new Error('JSON inválido')
        const data = migrateData(obj)
        const patch = {}
        for (const k of DATA_KEYS) if (k in data) patch[k] = data[k]
        if (Object.keys(patch).length === 0) throw new Error('El archivo no tiene datos reconocibles')
        set(patch)
      },
    }),
    {
      name: STORAGE_KEY,
      version: SEED_VERSION,
      migrate: (persisted) => migrateData(persisted),
      partialize: (s) => {
        const out = {}
        for (const k of DATA_KEYS) out[k] = s[k]
        return out
      },
    }
  )
)
