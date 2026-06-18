import { useState } from 'react'
import { ChevronDown, StickyNote, Trash2, X } from 'lucide-react'
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
import { MoneyInput } from '@/components/MoneyInput'
import { Field } from '@/components/Field'
import { cn } from '@/lib/utils'
import { formatARS, formatMoney } from '@/lib/format'
import { itemFinalARS, itemCostoARS, itemGananciaARS } from '@/lib/calc'

export function ItemCard({ item, cotizacionUsd, productosCatalogo, onChange, onRemove }) {
  const [showObs, setShowObs] = useState(!!item.observaciones)
  const esManual = !item.catalogoItemId

  const final = itemFinalARS(item, cotizacionUsd)
  const costo = itemCostoARS(item, cotizacionUsd)
  const ganancia = itemGananciaARS(item, cotizacionUsd)

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
        <span className="text-xs text-muted-foreground">Personalizar el precio</span>
        <MoneyInput
          id={`precio-${item.id}`}
          value={item.precioVenta}
          onChange={(precioVenta) => onChange({ precioVenta })}
          className="w-44"
        />
      </div>

      {/* Opciones / variantes (descripción del catálogo) */}
      {item.opcionesTexto && (
        <p className="mt-3 whitespace-pre-line border-t pt-3 text-xs text-muted-foreground">
          {item.opcionesTexto}
        </p>
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
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">Costos / ganancia (interno)</span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'font-semibold tabular-nums',
                ganancia >= 0 ? 'text-emerald-600' : 'text-destructive'
              )}
            >
              Ganancia {formatARS(ganancia)}
            </span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
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
                className="w-full"
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
