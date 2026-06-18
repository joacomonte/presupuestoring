import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/MoneyInput'
import { useStore } from '@/store/useStore'

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

export function ProductosSettings() {
  const productos = useStore((s) => s.productos)
  const addProducto = useStore((s) => s.addProducto)
  const updateProducto = useStore((s) => s.updateProducto)
  const removeProducto = useStore((s) => s.removeProducto)

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Costo interno reutilizable en los ítems.
      </p>
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
    </div>
  )
}
