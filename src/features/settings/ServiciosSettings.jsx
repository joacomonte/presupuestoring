import { useState } from 'react'
import { ChevronDown, GripVertical, Plus, Search, Trash2, X } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field } from '@/components/Field'
import { MoneyInput } from '@/components/MoneyInput'
import { useStore } from '@/store/useStore'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import { formatMoney, formatARS } from '@/lib/format'
import { toARS } from '@/lib/calc'

const emptyDelta = () => ({ modo: 'monto', monto: { valor: 0, moneda: 'ARS' } })

function Section({ title, subtitle, children }) {
  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h4>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function DeltaEditor({ delta, onChange }) {
  const modo = delta?.modo || 'monto'
  return (
    <div className="flex items-center gap-1">
      <div className="flex overflow-hidden rounded-md border text-xs">
        <button
          type="button"
          onClick={() => onChange(emptyDelta())}
          className={cn(
            'px-2 py-1 font-semibold',
            modo === 'monto' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          $
        </button>
        <button
          type="button"
          onClick={() => onChange({ modo: 'pct', pct: 0 })}
          className={cn(
            'px-2 py-1 font-semibold',
            modo === 'pct' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          %
        </button>
      </div>
      {modo === 'monto' ? (
        <MoneyInput
          value={delta.monto}
          onChange={(monto) => onChange({ modo: 'monto', monto })}
          className="w-44"
        />
      ) : (
        <Input
          type="number"
          value={delta.pct || ''}
          onChange={(e) => onChange({ modo: 'pct', pct: Number(e.target.value) || 0 })}
          className="w-20"
          placeholder="%"
        />
      )}
    </div>
  )
}

function OptionsEditor({ opciones, onChange }) {
  const updateOp = (opId, patch) =>
    onChange(opciones.map((o) => (o.id === opId ? { ...o, ...patch } : o)))
  const removeOp = (opId) => onChange(opciones.filter((o) => o.id !== opId))
  const addOp = (tipo) => {
    const base = { id: uid('op'), nombre: 'Nueva opción' }
    let nueva
    if (tipo === 'select') {
      const vid = uid('v')
      nueva = {
        ...base,
        tipo: 'select',
        valores: [{ id: vid, label: 'Base', delta: emptyDelta() }],
        defaultId: vid,
      }
    } else if (tipo === 'addons') {
      nueva = {
        ...base,
        tipo: 'addons',
        opciones: [{ id: uid('a'), label: 'Add-on', delta: emptyDelta(), default: false }],
      }
    } else {
      nueva = {
        ...base,
        tipo: 'cantidad',
        precioUnitario: { valor: 0, moneda: 'ARS' },
        default: 1,
      }
    }
    onChange([...opciones, nueva])
  }

  return (
    <div className="space-y-3">
      {opciones.map((op) => (
        <div key={op.id} className="rounded-lg border bg-muted/30 p-2">
          <div className="flex items-center gap-2">
            <Input
              value={op.nombre}
              onChange={(e) => updateOp(op.id, { nombre: e.target.value })}
              className="h-8 flex-1"
            />
            <Badge variant="secondary" className="shrink-0 capitalize">
              {op.tipo}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeOp(op.id)}
              aria-label="Eliminar opción"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {op.tipo === 'select' && (
            <div className="mt-2 space-y-1.5">
              {op.valores.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-1.5">
                  <Input
                    value={v.label}
                    onChange={(e) =>
                      updateOp(op.id, {
                        valores: op.valores.map((x) =>
                          x.id === v.id ? { ...x, label: e.target.value } : x
                        ),
                      })
                    }
                    className="h-8 w-28"
                  />
                  <DeltaEditor
                    delta={v.delta}
                    onChange={(delta) =>
                      updateOp(op.id, {
                        valores: op.valores.map((x) =>
                          x.id === v.id ? { ...x, delta } : x
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => updateOp(op.id, { defaultId: v.id })}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px]',
                      op.defaultId === v.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    default
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateOp(op.id, { valores: op.valores.filter((x) => x.id !== v.id) })
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Quitar valor"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  updateOp(op.id, {
                    valores: [
                      ...op.valores,
                      { id: uid('v'), label: 'Valor', delta: emptyDelta() },
                    ],
                  })
                }
              >
                <Plus className="size-3.5" /> Valor
              </Button>
            </div>
          )}

          {op.tipo === 'addons' && (
            <div className="mt-2 space-y-1.5">
              {op.opciones.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-1.5">
                  <Input
                    value={a.label}
                    onChange={(e) =>
                      updateOp(op.id, {
                        opciones: op.opciones.map((x) =>
                          x.id === a.id ? { ...x, label: e.target.value } : x
                        ),
                      })
                    }
                    className="h-8 w-28"
                  />
                  <DeltaEditor
                    delta={a.delta}
                    onChange={(delta) =>
                      updateOp(op.id, {
                        opciones: op.opciones.map((x) =>
                          x.id === a.id ? { ...x, delta } : x
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateOp(op.id, {
                        opciones: op.opciones.map((x) =>
                          x.id === a.id ? { ...x, default: !x.default } : x
                        ),
                      })
                    }
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px]',
                      a.default
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    on
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateOp(op.id, {
                        opciones: op.opciones.filter((x) => x.id !== a.id),
                      })
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Quitar add-on"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  updateOp(op.id, {
                    opciones: [
                      ...op.opciones,
                      { id: uid('a'), label: 'Add-on', delta: emptyDelta(), default: false },
                    ],
                  })
                }
              >
                <Plus className="size-3.5" /> Add-on
              </Button>
            </div>
          )}

          {op.tipo === 'cantidad' && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Precio unitario</span>
                <MoneyInput
                  value={op.precioUnitario}
                  onChange={(precioUnitario) => updateOp(op.id, { precioUnitario })}
                  className="w-44"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Default</span>
                <Input
                  type="number"
                  value={op.default ?? 0}
                  onChange={(e) => updateOp(op.id, { default: Number(e.target.value) || 0 })}
                  className="h-8 w-16"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOp('select')}>
          <Plus className="size-3.5" /> Selección
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOp('addons')}>
          <Plus className="size-3.5" /> Add-ons
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOp('cantidad')}>
          <Plus className="size-3.5" /> Cantidad
        </Button>
      </div>
    </div>
  )
}

function ProductoPicker({ productos, onSelect }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-2 flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-xs text-muted-foreground shadow-xs transition hover:bg-accent"
        >
          + Agregar producto
          <ChevronDown className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar producto…" className="text-xs" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-xs">Sin resultados.</CommandEmpty>
            <CommandGroup>
              {productos.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.nombre}
                  onSelect={() => {
                    onSelect(p.id)
                    setOpen(false)
                  }}
                  className="text-xs"
                >
                  {p.nombre} ({formatMoney(p.costo)})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ItemEditor({ item, categorias, tiposAuto, productos, cotizacionUsd, onUpdate, onRemove, defaultOpen }) {
  const categoria = categorias.find((c) => c.id === item.categoriaId)
  const setPrecio = (tipoId, money) =>
    onUpdate({ precios: { ...item.precios, [tipoId]: money } })

  const productosSel = (item.productoIds || [])
    .map((pid) => productos.find((p) => p.id === pid))
    .filter(Boolean)
  const productosDisp = productos.filter((p) => !(item.productoIds || []).includes(p.id))

  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.titulo || 'Sin título'}</div>
          <div className="truncate text-xs text-muted-foreground">
            {categoria?.nombre || 'Sin categoría'}
          </div>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t p-3">
          {/* Datos */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Título">
                <Input
                  value={item.titulo}
                  onChange={(e) => onUpdate({ titulo: e.target.value })}
                />
              </Field>
              <Field label="Categoría">
                <Select
                  value={item.categoriaId || ''}
                  onValueChange={(v) => onUpdate({ categoriaId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elegir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Descripción">
              <Textarea
                value={item.descripcion}
                onChange={(e) => onUpdate({ descripcion: e.target.value })}
                rows={2}
              />
            </Field>
          </div>

          {/* Precio de venta */}
          <Section title="Precio de venta" subtitle="Por tipo de vehículo">
            <div className="divide-y divide-border/60 rounded-lg border">
              {tiposAuto.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 truncate text-sm">{t.nombre}</span>
                  <MoneyInput
                    value={item.precios?.[t.id] || { valor: 0, moneda: 'ARS' }}
                    onChange={(m) => setPrecio(t.id, m)}
                    className="min-w-0 flex-1"
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Productos */}
          <Section
            title="Productos"
            subtitle="En el presupuesto se listan los productos usados (sin cantidad ni costo): solo para que el cliente sepa qué se aplicó."
          >
            <div className="space-y-1.5">
              {productosSel.length > 0 && (
                <div className="divide-y divide-border/60 rounded-lg border">
                  {productosSel.map((p) => {
                    const cant = item.productoCant?.[p.id] ?? 100
                    const costoARS = toARS(p.costo, cotizacionUsd) * (cant / 100)
                    return (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{p.nombre}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatMoney(p.costo)} c/u
                          </div>
                        </div>
                        <div className="relative w-20 shrink-0">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="1"
                            value={cant}
                            onChange={(e) =>
                              onUpdate({
                                productoCant: {
                                  ...(item.productoCant || {}),
                                  [p.id]: e.target.value === '' ? 0 : Number(e.target.value),
                                },
                              })
                            }
                            className="h-8 pr-6 text-right"
                            aria-label={`Porcentaje de uso de ${p.nombre}`}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                        <span className="w-20 shrink-0 text-right text-sm tabular-nums">
                          {formatARS(costoARS)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const { [p.id]: _, ...restCant } = item.productoCant || {}
                            onUpdate({
                              productoIds: item.productoIds.filter((id) => id !== p.id),
                              productoCant: restCant,
                            })
                          }}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Quitar ${p.nombre}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">Costo estimado en productos</span>
                    <span className="font-semibold tabular-nums">
                      {formatARS(
                        productosSel.reduce(
                          (s, p) =>
                            s + toARS(p.costo, cotizacionUsd) * ((item.productoCant?.[p.id] ?? 100) / 100),
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
              {productosDisp.length > 0 && (
                <ProductoPicker
                  productos={productosDisp}
                  onSelect={(pid) =>
                    onUpdate({ productoIds: [...(item.productoIds || []), pid] })
                  }
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                Porcentaje de uso y costo son internos (para calcular tu costo). 100% = envase entero, puede ser más de 100%.
              </p>
            </div>
          </Section>

          {/* Opciones / variantes */}
          <Section title="Opciones / variantes">
            <OptionsEditor
              opciones={item.opciones || []}
              onChange={(opciones) => onUpdate({ opciones })}
            />
          </Section>

          <div className="mt-4 border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-4" /> Eliminar ítem
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SortableCategoria({ cat, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
        aria-label="Reordenar categoría"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Input
        value={cat.nombre}
        onChange={(e) => onUpdate({ nombre: e.target.value })}
        className="flex-1"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="Eliminar categoría"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

export function ServiciosSettings() {
  const items = useStore((s) => s.items)
  const categorias = useStore((s) => s.categorias)
  const tiposAuto = useStore((s) => s.tiposAuto)
  const productos = useStore((s) => s.productos)
  const cotizacionUsd = useStore((s) => s.config.cotizacionUsd)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)

  const addCategoria = useStore((s) => s.addCategoria)
  const updateCategoria = useStore((s) => s.updateCategoria)
  const removeCategoria = useStore((s) => s.removeCategoria)
  const reorderCategorias = useStore((s) => s.reorderCategorias)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const [query, setQuery] = useState('')
  const [openCats, setOpenCats] = useState({})
  const [newItemId, setNewItemId] = useState(null)
  const toggleCat = (id) => setOpenCats((prev) => ({ ...prev, [id]: !prev[id] }))

  const addServicio = (catId) => {
    setQuery('')
    setOpenCats((prev) => ({ ...prev, [catId ?? 'sin-categoria']: true }))
    const id = addItem({ titulo: 'Nuevo servicio', categoriaId: catId })
    setNewItemId(id)
  }

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = categoriasOrdenadas.map((c) => c.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderCategorias(arrayMove(ids, oldIndex, newIndex))
  }

  const q = query.trim().toLowerCase()
  const itemsFiltrados = q
    ? items.filter((it) => it.titulo?.toLowerCase().includes(q))
    : items
  const itemsOrdenados = [...itemsFiltrados].sort((a, b) => {
    const ca = categorias.find((c) => c.id === a.categoriaId)?.orden ?? 99
    const cb = categorias.find((c) => c.id === b.categoriaId)?.orden ?? 99
    return ca - cb
  })

  return (
    <div className="space-y-6">
      {/* Categorías de servicio */}
      <div>
        <div className="mb-2">
          <h3 className="text-sm font-semibold">Categorías de servicio</h3>
          <p className="text-xs text-muted-foreground">Arrastrá para ordenar.</p>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categoriasOrdenadas.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categoriasOrdenadas.map((c) => (
                <SortableCategoria
                  key={c.id}
                  cat={c}
                  onUpdate={(patch) => updateCategoria(c.id, patch)}
                  onDelete={() => removeCategoria(c.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addCategoria('Nueva categoría')}
        >
          <Plus className="size-4" /> Agregar categoría
        </Button>
      </div>

      <div className="border-t pt-4">
        <h3 className="mb-2 text-sm font-semibold">Servicios individuales</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="items-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ítem..."
            className="pl-9"
          />
        </div>
        <div className="space-y-2">
          {[...categoriasOrdenadas, { id: null, nombre: 'Sin categoría' }].map((cat) => {
            const itemsCat = itemsOrdenados.filter((it) =>
              cat.id === null
                ? !categorias.some((c) => c.id === it.categoriaId)
                : it.categoriaId === cat.id
            )
            const isSinCat = cat.id === null
            if (itemsCat.length === 0 && (q || isSinCat)) return null
            const catKey = cat.id ?? 'sin-categoria'
            const open = q ? true : !!openCats[catKey]
            return (
              <Collapsible
                key={catKey}
                open={open}
                onOpenChange={() => !q && toggleCat(catKey)}
              >
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger className="group flex min-h-11 flex-1 items-center gap-2 rounded-md px-2 text-left hover:bg-accent active:bg-accent">
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {cat.nombre}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      ({itemsCat.length})
                    </span>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="ml-4 mt-1.5 space-y-2 border-l border-border/60 pl-4">
                  {itemsCat.map((item) => (
                    <ItemEditor
                      key={item.id}
                      item={item}
                      categorias={categoriasOrdenadas}
                      tiposAuto={tiposAuto}
                      productos={productos}
                      cotizacionUsd={cotizacionUsd}
                      defaultOpen={item.id === newItemId}
                      onUpdate={(patch) => updateItem(item.id, patch)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                  {!isSinCat && (
                    <button
                      type="button"
                      onClick={() => addServicio(cat.id)}
                      aria-label={`Agregar servicio en ${cat.nombre}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted"
                    >
                      <Plus className="size-4" />
                      Agregar servicio
                    </button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
          {q && itemsOrdenados.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No hay ítems que coincidan.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
