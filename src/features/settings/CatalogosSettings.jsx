import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/MoneyInput'
import { useStore } from '@/store/useStore'

function Bloque({ title, hint, children }) {
  return (
    <div>
      <div className="mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function FilaDelete({ onDelete }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={onDelete}
      aria-label="Eliminar"
    >
      <Trash2 className="size-4" />
    </Button>
  )
}

export function CatalogosSettings() {
  const tiposAuto = useStore((s) => s.tiposAuto)
  const addTipoAuto = useStore((s) => s.addTipoAuto)
  const updateTipoAuto = useStore((s) => s.updateTipoAuto)
  const removeTipoAuto = useStore((s) => s.removeTipoAuto)

  const formasPago = useStore((s) => s.formasPago)
  const addFormaPago = useStore((s) => s.addFormaPago)
  const updateFormaPago = useStore((s) => s.updateFormaPago)
  const removeFormaPago = useStore((s) => s.removeFormaPago)

  const categorias = useStore((s) => s.categorias)
  const addCategoria = useStore((s) => s.addCategoria)
  const updateCategoria = useStore((s) => s.updateCategoria)
  const removeCategoria = useStore((s) => s.removeCategoria)
  const moveCategoria = useStore((s) => s.moveCategoria)

  const productos = useStore((s) => s.productos)
  const addProducto = useStore((s) => s.addProducto)
  const updateProducto = useStore((s) => s.updateProducto)
  const removeProducto = useStore((s) => s.removeProducto)

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)

  return (
    <div className="space-y-6">
      {/* Tipos de auto */}
      <Bloque
        title="Tipos de auto"
        hint="El multiplicador deriva precios de tipos sin valor explícito en la matriz."
      >
        <div className="space-y-2">
          {tiposAuto.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <Input
                value={t.nombre}
                onChange={(e) => updateTipoAuto(t.id, { nombre: e.target.value })}
                placeholder="Nombre"
                className="flex-1"
              />
              <Input
                type="number"
                step="0.05"
                value={t.multiplicador}
                onChange={(e) =>
                  updateTipoAuto(t.id, { multiplicador: Number(e.target.value) || 0 })
                }
                className="w-20"
                aria-label="Multiplicador"
              />
              <FilaDelete onDelete={() => removeTipoAuto(t.id)} />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addTipoAuto('Nuevo tipo', 1)}
        >
          <Plus className="size-4" /> Agregar tipo
        </Button>
      </Bloque>

      {/* Formas de pago */}
      <Bloque title="Formas de pago">
        <div className="space-y-2">
          {formasPago.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <Input
                value={f.nombre}
                onChange={(e) => updateFormaPago(f.id, { nombre: e.target.value })}
                className="flex-1"
              />
              <FilaDelete onDelete={() => removeFormaPago(f.id)} />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addFormaPago('Nueva forma')}
        >
          <Plus className="size-4" /> Agregar
        </Button>
      </Bloque>

      {/* Categorías */}
      <Bloque title="Categorías de servicio" hint="Ordená con las flechas.">
        <div className="space-y-2">
          {categoriasOrdenadas.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveCategoria(c.id, 'up')}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Subir"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategoria(c.id, 'down')}
                  disabled={i === categoriasOrdenadas.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Bajar"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <Input
                value={c.nombre}
                onChange={(e) => updateCategoria(c.id, { nombre: e.target.value })}
                className="flex-1"
              />
              <FilaDelete onDelete={() => removeCategoria(c.id)} />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addCategoria('Nueva categoría')}
        >
          <Plus className="size-4" /> Agregar categoría
        </Button>
      </Bloque>

      {/* Productos */}
      <Bloque title="Productos" hint="Costo interno reutilizable en los ítems.">
        <div className="space-y-3">
          {productos.map((p) => (
            <div key={p.id} className="rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <Input
                  value={p.nombre}
                  onChange={(e) => updateProducto(p.id, { nombre: e.target.value })}
                  placeholder="Nombre"
                  className="flex-1"
                />
                <FilaDelete onDelete={() => removeProducto(p.id)} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={p.marca}
                  onChange={(e) => updateProducto(p.id, { marca: e.target.value })}
                  placeholder="Marca"
                  className="flex-1"
                />
                <MoneyInput
                  value={p.costo}
                  onChange={(costo) => updateProducto(p.id, { costo })}
                  className="w-40"
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addProducto({ nombre: 'Nuevo producto' })}
        >
          <Plus className="size-4" /> Agregar producto
        </Button>
      </Bloque>
    </div>
  )
}
