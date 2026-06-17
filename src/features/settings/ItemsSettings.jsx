import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { formatMoney } from '@/lib/format'

const emptyDelta = () => ({ modo: 'monto', monto: { valor: 0, moneda: 'ARS' } })

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
          className="w-32"
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
                  className="w-32"
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

function ItemEditor({ item, categorias, tiposAuto, productos, onUpdate, onRemove }) {
  const categoria = categorias.find((c) => c.id === item.categoriaId)
  const setPrecio = (tipoId, money) =>
    onUpdate({ precios: { ...item.precios, [tipoId]: money } })

  const productosSel = (item.productoIds || [])
    .map((pid) => productos.find((p) => p.id === pid))
    .filter(Boolean)
  const productosDisp = productos.filter((p) => !(item.productoIds || []).includes(p.id))

  return (
    <Collapsible className="rounded-lg border bg-card">
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
        <div className="space-y-3 border-t p-3">
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

          {/* Matriz de precios por tipo de auto */}
          <Field label="Precio de venta por tipo de auto">
            <div className="space-y-2">
              {tiposAuto.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-sm">{t.nombre}</span>
                  <MoneyInput
                    value={item.precios?.[t.id] || { valor: 0, moneda: 'ARS' }}
                    onChange={(m) => setPrecio(t.id, m)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </Field>

          {/* Costos: productos + mano de obra */}
          <Field label="Productos (costo interno)">
            <div className="flex flex-wrap gap-1.5">
              {productosSel.map((p) => (
                <Badge key={p.id} variant="secondary" className="gap-1 py-1">
                  {p.nombre}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({
                        productoIds: item.productoIds.filter((id) => id !== p.id),
                      })
                    }
                    aria-label="Quitar"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {productosDisp.length > 0 && (
              <Select
                value=""
                onValueChange={(pid) =>
                  onUpdate({ productoIds: [...(item.productoIds || []), pid] })
                }
              >
                <SelectTrigger size="sm" className="mt-2 h-8 w-full text-xs">
                  <SelectValue placeholder="+ Agregar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productosDisp.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nombre} ({formatMoney(p.costo)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field label="Mano de obra (costo interno)">
            <MoneyInput
              value={item.manoObra}
              onChange={(manoObra) => onUpdate({ manoObra })}
              className="w-44"
            />
          </Field>

          {/* Opciones / variantes */}
          <Field label="Opciones / variantes">
            <OptionsEditor
              opciones={item.opciones || []}
              onChange={(opciones) => onUpdate({ opciones })}
            />
          </Field>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-4" /> Eliminar ítem
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ItemsSettings() {
  const items = useStore((s) => s.items)
  const categorias = useStore((s) => s.categorias)
  const tiposAuto = useStore((s) => s.tiposAuto)
  const productos = useStore((s) => s.productos)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)

  const paquetes = useStore((s) => s.paquetes)
  const addPaquete = useStore((s) => s.addPaquete)
  const updatePaquete = useStore((s) => s.updatePaquete)
  const removePaquete = useStore((s) => s.removePaquete)

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)
  const itemsOrdenados = [...items].sort((a, b) => {
    const ca = categorias.find((c) => c.id === a.categoriaId)?.orden ?? 99
    const cb = categorias.find((c) => c.id === b.categoriaId)?.orden ?? 99
    return ca - cb
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Ítems de servicio</h3>
        <div className="space-y-2">
          {itemsOrdenados.map((item) => (
            <ItemEditor
              key={item.id}
              item={item}
              categorias={categoriasOrdenadas}
              tiposAuto={tiposAuto}
              productos={productos}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            addItem({
              titulo: 'Nuevo ítem',
              categoriaId: categoriasOrdenadas[0]?.id || null,
            })
          }
        >
          <Plus className="size-4" /> Agregar ítem
        </Button>
      </div>

      {/* Paquetes */}
      <div className="border-t pt-4">
        <h3 className="mb-2 text-sm font-semibold">Paquetes / combos</h3>
        <div className="space-y-3">
          {paquetes.map((paq) => (
            <div key={paq.id} className="rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <Input
                  value={paq.nombre}
                  onChange={(e) => updatePaquete(paq.id, { nombre: e.target.value })}
                  className="h-8 flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removePaquete(paq.id)}
                  aria-label="Eliminar paquete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {itemsOrdenados.map((it) => {
                  const active = (paq.itemIds || []).includes(it.id)
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() =>
                        updatePaquete(paq.id, {
                          itemIds: active
                            ? paq.itemIds.filter((x) => x !== it.id)
                            : [...(paq.itemIds || []), it.id],
                        })
                      }
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      {it.titulo}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addPaquete({ nombre: 'Nuevo paquete' })}
        >
          <Plus className="size-4" /> Agregar paquete
        </Button>
      </div>
    </div>
  )
}
