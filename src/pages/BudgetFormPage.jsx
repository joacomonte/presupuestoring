import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { User, Car, Tag, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useStore } from '@/store/useStore'
import { ClienteSection } from '@/features/form/ClienteSection'
import { VehiculoSection } from '@/features/form/VehiculoSection'
import { CategoriaSection } from '@/features/form/CategoriaSection'
import { CierreSection } from '@/features/form/CierreSection'
import { CrearWizard } from '@/features/form/CrearWizard'
import { SummaryBar } from '@/features/form/SummaryBar'
import { materializeItem, blankItem } from '@/lib/budget'
import { computeTotals, itemFinalARS } from '@/lib/calc'
import { formatNro } from '@/lib/format'

export function BudgetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const createDraft = useStore((s) => s.createDraft)
  const getBudget = useStore((s) => s.getBudget)
  const saveBudget = useStore((s) => s.saveBudget)
  const addFormaPago = useStore((s) => s.addFormaPago)

  const config = useStore((s) => s.config)
  const tiposTrabajo = useStore((s) => s.tiposTrabajo)
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
  const [saving, setSaving] = useState(false)
  // Presupuestos nuevos pasan por el wizard (tipo de vehículo + paquete/manual);
  // al editar uno existente se salta directo al formulario.
  const [wizardDone, setWizardDone] = useState(!!id)
  const [tab, setTab] = useState('cliente')

  const tabsScrollRef = useRef(null)
  const [tabsScroll, setTabsScroll] = useState({ left: false, right: false })

  const updateTabsScroll = () => {
    const el = tabsScrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setTabsScroll({
      left: scrollLeft > 1,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    })
  }

  useEffect(() => {
    updateTabsScroll()
    window.addEventListener('resize', updateTabsScroll)
    return () => window.removeEventListener('resize', updateTabsScroll)
  }, [categorias.length])

  useEffect(() => {
    if (id && !getBudget(id)) {
      toast.error('Presupuesto no encontrado')
      navigate('/', { replace: true })
    }
  }, [id, getBudget, navigate])

  if (!draft) return null

  const cot = draft.cotizacionUsd
  const ctx = { productos, items: catalogoItems, categorias }
  const totals = computeTotals(draft)
  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)

  // Orden de las tabs para navegar con los botones Volver / Continuar.
  const tabOrder = [
    'cliente',
    'vehiculo',
    ...categoriasOrdenadas.map((c) => `cat-${c.id}`),
    'cierre',
  ]
  const tabIndex = tabOrder.indexOf(tab)

  // ---- mutadores del borrador ----
  const patch = (p) => setDraft((d) => ({ ...d, ...p }))
  const patchCliente = (p) =>
    setDraft((d) => ({ ...d, cliente: { ...d.cliente, ...p } }))
  const patchVehiculo = (p) =>
    setDraft((d) => ({ ...d, vehiculo: { ...d.vehiculo, ...p } }))
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
      return { ...d, items: [...d.items, materializeItem(ci, ctx)] }
    })
  const addBlank = (catId) => {
    const cat = categorias.find((c) => c.id === catId)
    setDraft((d) => ({ ...d, items: [...d.items, blankItem(catId, cat?.nombre || '')] }))
  }

  // Completa el wizard: fija el tipo de vehículo y precarga los ítems del
  // paquete elegido (o arranca vacío si es manual). Reemplaza los ítems del
  // borrador para no arrastrar la precarga inicial de createDraft.
  const completeWizard = (nombre, tipoTrabajo, paquete) => {
    setDraft((d) => {
      const items = paquete
        ? (paquete.itemIds || [])
            .map((iid) => catalogoItems.find((c) => c.id === iid))
            .filter(Boolean)
            .map((ci) => materializeItem(ci, ctx))
        : []
      return {
        ...d,
        cliente: { ...d.cliente, nombre: nombre.trim() },
        tipoTrabajo,
        items,
      }
    })
    setWizardDone(true)
  }

  const jumpToItem = (itemId) => {
    const item = draft.items.find((i) => i.id === itemId)
    if (!item) return
    setTab(`cat-${item.categoriaId}`)
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
        <h1 className="text-lg font-semibold">
          {id ? `Editar presupuesto ${formatNro(draft.nro)}` : 'Nuevo presupuesto'}
        </h1>
      </div>

      {!wizardDone ? (
        <CrearWizard
          tiposTrabajo={tiposTrabajo}
          paquetes={paquetes}
          paqueteDestacadoId={config.paqueteDestacadoId}
          ctx={ctx}
          cotizacionUsd={cot}
          onComplete={completeWizard}
        />
      ) : (
        <>
          <Tabs value={tab} onValueChange={setTab}>
            <div className="relative -mx-4">
              {tabsScroll.left && (
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-background to-transparent pl-2 pr-8">
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </div>
              )}
              <div
                ref={tabsScrollRef}
                onScroll={updateTabsScroll}
                className="overflow-x-auto px-4"
              >
                <TabsList variant="line" className="w-max">
                  <TabsTrigger value="cliente">
                    <User /> Cliente
                  </TabsTrigger>
                  <TabsTrigger value="vehiculo">
                    <Car /> Vehículo
                  </TabsTrigger>
                  {categoriasOrdenadas.map((cat) => (
                    <TabsTrigger key={cat.id} value={`cat-${cat.id}`}>
                      <Tag /> {cat.nombre}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="cierre">
                    <Receipt /> Cierre
                  </TabsTrigger>
                </TabsList>
              </div>
              {tabsScroll.right && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-background to-transparent pl-8 pr-2">
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <TabsContent value="cliente">
              <ClienteSection cliente={draft.cliente} onChange={patchCliente} plain />
            </TabsContent>

            <TabsContent value="vehiculo">
              <VehiculoSection
                vehiculo={draft.vehiculo}
                onChange={patchVehiculo}
                plain
              />
            </TabsContent>

            {categoriasOrdenadas.map((cat) => (
              <TabsContent key={cat.id} value={`cat-${cat.id}`}>
                <CategoriaSection
                  categoria={cat}
                  catalogItems={catalogoItems.filter((i) => i.categoriaId === cat.id)}
                  draftItems={draft.items.filter((it) => it.categoriaId === cat.id)}
                  cotizacionUsd={cot}
                  productosCatalogo={productos}
                  onToggleItem={toggleCatalogItem}
                  onChangeItem={updateItem}
                  onRemoveItem={removeItem}
                  onAddBlank={addBlank}
                  plain
                />
              </TabsContent>
            ))}

            <TabsContent value="cierre">
              <CierreSection
                presupuesto={draft}
                onChange={patch}
                formasPago={formasPago}
                onAddFormaPago={(name) => addFormaPago(name)}
                totals={totals}
                plain
              />
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex gap-3">
            <Button
              id="form-tab-volver"
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={tabIndex <= 0}
              onClick={() => setTab(tabOrder[tabIndex - 1])}
            >
              <ChevronLeft className="size-5" />
              Volver
            </Button>
            <Button
              id="form-tab-continuar"
              size="lg"
              className="flex-1"
              disabled={tabIndex >= tabOrder.length - 1}
              onClick={() => setTab(tabOrder[tabIndex + 1])}
            >
              Continuar
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <SummaryBar
            presupuesto={draft}
            totals={totals}
            tiposTrabajo={tiposTrabajo}
            itemsResumen={itemsResumen}
            onPatch={patch}
            onGenerar={onGenerar}
            onJumpToItem={jumpToItem}
            saving={saving}
          />
        </>
      )}
    </div>
  )
}
