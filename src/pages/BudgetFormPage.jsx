import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { ClienteSection } from '@/features/form/ClienteSection'
import { VehiculoSection } from '@/features/form/VehiculoSection'
import { CategoriaSection } from '@/features/form/CategoriaSection'
import { CierreSection } from '@/features/form/CierreSection'
import { SummaryBar } from '@/features/form/SummaryBar'
import { materializeItem, blankItem, repriceItem } from '@/lib/budget'
import { computeTotals, itemFinalARS } from '@/lib/calc'
import { formatNro } from '@/lib/format'

export function BudgetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const createDraft = useStore((s) => s.createDraft)
  const getBudget = useStore((s) => s.getBudget)
  const saveBudget = useStore((s) => s.saveBudget)
  const addTipoAuto = useStore((s) => s.addTipoAuto)
  const addFormaPago = useStore((s) => s.addFormaPago)

  const tiposAuto = useStore((s) => s.tiposAuto)
  const formasPago = useStore((s) => s.formasPago)
  const categorias = useStore((s) => s.categorias)
  const catalogoItems = useStore((s) => s.items)
  const productos = useStore((s) => s.productos)
  const paquetes = useStore((s) => s.paquetes)

  const [draft, setDraft] = useState(() =>
    id
      ? getBudget(id)
        ? structuredClone(getBudget(id))
        : null
      : createDraft()
  )
  const [openSections, setOpenSections] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id && !getBudget(id)) {
      toast.error('Presupuesto no encontrado')
      navigate('/', { replace: true })
    }
  }, [id, getBudget, navigate])

  if (!draft) return null

  const cot = draft.cotizacionUsd
  const ctx = { tiposAuto, productos, items: catalogoItems, categorias }
  const totals = computeTotals(draft)
  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)

  // ---- mutadores del borrador ----
  const patch = (p) => setDraft((d) => ({ ...d, ...p }))
  const patchCliente = (p) =>
    setDraft((d) => ({ ...d, cliente: { ...d.cliente, ...p } }))
  const patchVehiculo = (p) =>
    setDraft((d) => {
      let items = d.items
      if ('tipoAutoId' in p && p.tipoAutoId !== d.vehiculo.tipoAutoId) {
        items = d.items.map((it) => repriceItem(it, p.tipoAutoId, ctx))
      }
      return { ...d, vehiculo: { ...d.vehiculo, ...p }, items }
    })
  const updateItem = (itemId, p) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === itemId ? { ...it, ...p } : it)),
    }))
  const removeItem = (itemId) =>
    setDraft((d) => ({ ...d, items: d.items.filter((it) => it.id !== itemId) }))
  const toggleCatalogItem = (ci) =>
    setDraft((d) => {
      if (d.items.some((it) => it.catalogoItemId === ci.id)) {
        return { ...d, items: d.items.filter((it) => it.catalogoItemId !== ci.id) }
      }
      return { ...d, items: [...d.items, materializeItem(ci, d.vehiculo.tipoAutoId, ctx)] }
    })
  const addBlank = (catId) => {
    const cat = categorias.find((c) => c.id === catId)
    setDraft((d) => ({ ...d, items: [...d.items, blankItem(catId, cat?.nombre || '')] }))
  }

  const loadPaquete = (paq) => {
    setDraft((d) => {
      const nuevos = (paq.itemIds || [])
        .map((iid) => catalogoItems.find((c) => c.id === iid))
        .filter(Boolean)
        .filter((ci) => !d.items.some((it) => it.catalogoItemId === ci.id))
        .map((ci) => materializeItem(ci, d.vehiculo.tipoAutoId, ctx))
      return { ...d, items: [...d.items, ...nuevos] }
    })
    toast.success(`Paquete "${paq.nombre}" cargado`)
  }

  // ---- secciones plegables ----
  const isOpen = (key, fallback) => openSections[key] ?? fallback
  const setOpen = (key) => (v) => setOpenSections((s) => ({ ...s, [key]: v }))

  const jumpToItem = (itemId) => {
    const item = draft.items.find((i) => i.id === itemId)
    if (!item) return
    setOpenSections((s) => ({ ...s, [`cat-${item.categoriaId}`]: true }))
    requestAnimationFrame(() => {
      const el = document.getElementById(`item-${itemId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-primary')
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1300)
      }
    })
  }

  const onGenerar = () => {
    setSaving(true)
    const saved = saveBudget(draft)
    toast.success(`Presupuesto ${formatNro(saved.nro)} generado`)
    navigate(`/presupuesto/${saved.id}`)
  }

  const itemsResumen = draft.items.map((it) => ({
    id: it.id,
    titulo: it.titulo,
    finalARS: itemFinalARS(it, cot),
  }))

  return (
    <div className="mx-auto max-w-xl px-4 pb-32 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {id ? `Editar presupuesto ${formatNro(draft.nro)}` : 'Nuevo presupuesto'}
        </h1>
      </div>

      <div className="space-y-3">
        <ClienteSection
          cliente={draft.cliente}
          onChange={patchCliente}
          open={isOpen('cliente', false)}
          onOpenChange={setOpen('cliente')}
        />

        <VehiculoSection
          vehiculo={draft.vehiculo}
          onChange={patchVehiculo}
          tiposAuto={tiposAuto}
          onAddTipoAuto={(name) => addTipoAuto(name)}
          open={isOpen('vehiculo', true)}
          onOpenChange={setOpen('vehiculo')}
        />

        {/* Paquetes / combos */}
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Package className="size-4 text-muted-foreground" />
            Paquetes / combos
          </div>
          <div className="flex flex-wrap gap-2">
            {paquetes.map((paq) => (
              <button
                key={paq.id}
                type="button"
                onClick={() => loadPaquete(paq)}
                className="rounded-full border border-dashed px-3 py-1.5 text-sm hover:border-primary hover:bg-accent"
              >
                + {paq.nombre}
              </button>
            ))}
            {paquetes.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No hay paquetes configurados.
              </span>
            )}
          </div>
        </div>

        {categoriasOrdenadas.map((cat) => {
          const draftItems = draft.items.filter((it) => it.categoriaId === cat.id)
          return (
            <CategoriaSection
              key={cat.id}
              categoria={cat}
              catalogItems={catalogoItems.filter((i) => i.categoriaId === cat.id)}
              draftItems={draftItems}
              tiposAuto={tiposAuto}
              tipoAutoId={draft.vehiculo.tipoAutoId}
              cotizacionUsd={cot}
              productosCatalogo={productos}
              onToggleItem={toggleCatalogItem}
              onChangeItem={updateItem}
              onRemoveItem={removeItem}
              onAddBlank={addBlank}
              open={isOpen(`cat-${cat.id}`, draftItems.length > 0)}
              onOpenChange={setOpen(`cat-${cat.id}`)}
            />
          )
        })}

        <CierreSection
          presupuesto={draft}
          onChange={patch}
          formasPago={formasPago}
          onAddFormaPago={(name) => addFormaPago(name)}
          totals={totals}
          open={isOpen('cierre', false)}
          onOpenChange={setOpen('cierre')}
        />
      </div>

      <SummaryBar
        presupuesto={draft}
        totals={totals}
        itemsResumen={itemsResumen}
        onPatch={patch}
        onGenerar={onGenerar}
        onJumpToItem={jumpToItem}
        saving={saving}
      />
    </div>
  )
}
