import { useState } from 'react'
import { StickyNote, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { QuickToggle } from '@/components/QuickToggle'
import { MoneyInput } from '@/components/MoneyInput'
import { Stepper } from '@/components/Stepper'
import { Field } from '@/components/Field'
import { cn } from '@/lib/utils'
import { formatARS, formatMoney, deltaLabel } from '@/lib/format'
import { itemFinalARS, itemCostoARS, itemGananciaARS } from '@/lib/calc'

function OpcionControl({ opcion, value, onChange }) {
  if (opcion.tipo === 'select') {
    const options = opcion.valores.map((v) => ({
      value: v.id,
      label: v.label,
      hint: deltaLabel(v.delta),
    }))
    return (
      <QuickToggle
        id={`op-${opcion.id}`}
        options={options}
        value={value}
        onChange={onChange}
        size="sm"
      />
    )
  }
  if (opcion.tipo === 'addons') {
    return (
      <div className="flex flex-wrap gap-2">
        {opcion.opciones.map((a) => {
          const active = !!value?.[a.id]
          const hint = deltaLabel(a.delta)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange({ ...value, [a.id]: !active })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent'
              )}
            >
              {a.label}
              {hint && (
                <span
                  className={cn(
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                >
                  {hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }
  if (opcion.tipo === 'cantidad') {
    return (
      <div className="flex items-center gap-3">
        <Stepper value={value ?? opcion.default ?? 0} onChange={onChange} />
        <span className="text-xs text-muted-foreground">
          {formatMoney(opcion.precioUnitario)} c/u
        </span>
      </div>
    )
  }
  return null
}

export function ItemCard({ item, cotizacionUsd, productosCatalogo, onChange, onRemove }) {
  const [showObs, setShowObs] = useState(!!item.observaciones)
  const esManual = !item.catalogoItemId

  const final = itemFinalARS(item, cotizacionUsd)
  const costo = itemCostoARS(item, cotizacionUsd)
  const ganancia = itemGananciaARS(item, cotizacionUsd)

  const setSeleccion = (opId, val) =>
    onChange({ seleccion: { ...item.seleccion, [opId]: val } })

  const productosDisponibles = productosCatalogo.filter(
    (p) => !item.productos.some((ip) => ip.id === p.id)
  )

  const addProducto = (pid) => {
    const p = productosCatalogo.find((x) => x.id === pid)
    if (!p) return
    onChange({
      productos: [
        ...item.productos,
        { id: p.id, nombre: p.nombre, marca: p.marca, costo: { ...p.costo } },
      ],
    })
  }
  const removeProducto = (pid) =>
    onChange({ productos: item.productos.filter((p) => p.id !== pid) })

  return (
    <div
      id={`item-${item.id}`}
      className="scroll-mt-20 rounded-lg border bg-background p-3"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {esManual ? (
            <Input
              value={item.titulo}
              onChange={(e) => onChange({ titulo: e.target.value })}
              placeholder="Título del ítem"
              className="h-8 font-medium"
            />
          ) : (
            <div className="font-medium leading-tight">{item.titulo}</div>
          )}
          {esManual ? (
            <Input
              value={item.descripcion}
              onChange={(e) => onChange({ descripcion: e.target.value })}
              placeholder="Descripción (opcional)"
              className="mt-1 h-7 text-xs"
            />
          ) : (
            item.descripcion && (
              <p className="mt-0.5 text-xs text-muted-foreground">{item.descripcion}</p>
            )
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold tabular-nums">{formatARS(final)}</div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 text-muted-foreground"
          onClick={onRemove}
          aria-label="Quitar ítem"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Precio de venta editable */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Precio de venta</span>
        <MoneyInput
          id={`precio-${item.id}`}
          value={item.precioVenta}
          onChange={(precioVenta) => onChange({ precioVenta })}
          className="w-44"
        />
      </div>

      {/* Opciones / variantes */}
      {item.opciones?.length > 0 && (
        <div className="mt-3 space-y-2.5 border-t pt-3">
          {item.opciones.map((op) => (
            <div key={op.id}>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                {op.nombre}
              </div>
              <OpcionControl
                opcion={op}
                value={item.seleccion?.[op.id]}
                onChange={(val) => setSeleccion(op.id, val)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Observaciones del ítem */}
      {showObs ? (
        <Textarea
          value={item.observaciones}
          onChange={(e) => onChange({ observaciones: e.target.value })}
          placeholder="Observaciones del ítem"
          rows={2}
          className="mt-3 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowObs(true)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <StickyNote className="size-3.5" /> Agregar nota
        </button>
      )}

      {/* Costos internos / ganancia (solo operador) */}
      <Collapsible className="mt-3 rounded-md border bg-muted/40">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">Costos / ganancia (interno)</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              ganancia >= 0 ? 'text-emerald-600' : 'text-destructive'
            )}
          >
            Ganancia {formatARS(ganancia)}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t px-3 py-3">
            {/* Productos */}
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                Productos utilizados
              </div>
              {item.productos.length > 0 ? (
                <ul className="space-y-1">
                  {item.productos.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="min-w-0 truncate">
                        {p.nombre}
                        {p.marca && (
                          <span className="text-muted-foreground"> · {p.marca}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-muted-foreground">
                          {formatMoney(p.costo)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProducto(p.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Quitar producto"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Sin productos.</p>
              )}
              {productosDisponibles.length > 0 && (
                <Select value="" onValueChange={addProducto}>
                  <SelectTrigger size="sm" className="mt-2 h-8 w-full text-xs">
                    <SelectValue placeholder="+ Agregar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productosDisponibles.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.nombre} {p.marca ? `· ${p.marca}` : ''} ({formatMoney(p.costo)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Mano de obra */}
            <Field label="Mano de obra" className="gap-1">
              <MoneyInput
                value={item.manoObra}
                onChange={(manoObra) => onChange({ manoObra })}
                className="w-44"
              />
            </Field>

            <div className="flex justify-between border-t pt-2 text-xs">
              <span className="text-muted-foreground">Costo total</span>
              <span className="tabular-nums">{formatARS(costo)}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
