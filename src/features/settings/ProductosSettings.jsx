import { useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
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

  const [query, setQuery] = useState('')

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q),
    )
  }, [productos, query])

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="productos-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="pl-9"
        />
      </div>
      <div className="space-y-3">
        {filtrados.map((p) => (
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
                className="w-44"
              />
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No hay productos que coincidan.
          </p>
        )}
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
