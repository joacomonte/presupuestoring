import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeed, STORAGE_KEY, SEED_VERSION } from '@/data/seed'
import { uid } from '@/lib/id'
import { createDraft as buildDraft, duplicateDraft } from '@/lib/budget'

const DATA_KEYS = [
  'seedVersion',
  'config',
  'local',
  'tiposAuto',
  'formasPago',
  'categorias',
  'productos',
  'items',
  'paquetes',
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

      // ---------------- Config ----------------
      setCotizacionUsd: (v) =>
        set((s) => ({ config: { ...s.config, cotizacionUsd: Number(v) || 0 } })),
      setIvaPct: (v) =>
        set((s) => ({ config: { ...s.config, ivaPct: Number(v) || 0 } })),
      setPaqueteDestacado: (id) =>
        set((s) => ({ config: { ...s.config, paqueteDestacadoId: id } })),
      setLocal: (patch) => set((s) => ({ local: { ...s.local, ...patch } })),

      // ---------------- Tipos de auto ----------------
      addTipoAuto: (nombre, multiplicador = 1) => {
        const id = uid('ta')
        set((s) => ({
          tiposAuto: [
            ...s.tiposAuto,
            { id, nombre, multiplicador: Number(multiplicador) || 1 },
          ],
        }))
        return id
      },
      updateTipoAuto: (id, patch) =>
        set((s) => ({
          tiposAuto: s.tiposAuto.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTipoAuto: (id) =>
        set((s) => ({ tiposAuto: s.tiposAuto.filter((t) => t.id !== id) })),

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
      moveCategoria: (id, dir) =>
        set((s) => {
          const ordered = [...s.categorias].sort((a, b) => a.orden - b.orden)
          const i = ordered.findIndex((c) => c.id === id)
          const j = dir === 'up' ? i - 1 : i + 1
          if (i < 0 || j < 0 || j >= ordered.length) return {}
          const tmp = ordered[i].orden
          ordered[i] = { ...ordered[i], orden: ordered[j].orden }
          ordered[j] = { ...ordered[j], orden: tmp }
          return { categorias: ordered }
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
              precios: {},
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
          paquetes: s.paquetes.map((p) => ({
            ...p,
            itemIds: (p.itemIds || []).filter((iid) => iid !== id),
          })),
        })),

      // ---------------- Paquetes ----------------
      addPaquete: (data) => {
        const id = uid('paq')
        set((s) => ({
          paquetes: [...s.paquetes, { id, nombre: '', itemIds: [], ...data }],
        }))
        return id
      },
      updatePaquete: (id, patch) =>
        set((s) => ({
          paquetes: s.paquetes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePaquete: (id) =>
        set((s) => ({ paquetes: s.paquetes.filter((p) => p.id !== id) })),

      // ---------------- Actualización masiva de precios ----------------
      // Escala precios de venta (matriz), deltas (monto) y precios unitarios.
      // No toca costos internos (productos / mano de obra).
      bumpPrices: ({ pct, categoriaId } = {}) => {
        const factor = 1 + (Number(pct) || 0) / 100
        if (factor === 1) return
        set((s) => ({
          items: s.items.map((it) => {
            if (categoriaId && it.categoriaId !== categoriaId) return it
            const precios = Object.fromEntries(
              Object.entries(it.precios || {}).map(([k, v]) => [k, scaleMoneyBy(v, factor)])
            )
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
            return { ...it, precios, opciones }
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
        const patch = {}
        for (const k of DATA_KEYS) if (k in obj) patch[k] = obj[k]
        if (Object.keys(patch).length === 0) throw new Error('El archivo no tiene datos reconocibles')
        set(patch)
      },
    }),
    {
      name: STORAGE_KEY,
      version: SEED_VERSION,
      partialize: (s) => {
        const out = {}
        for (const k of DATA_KEYS) out[k] = s[k]
        return out
      },
    }
  )
)
