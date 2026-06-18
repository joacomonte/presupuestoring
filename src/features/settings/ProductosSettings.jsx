import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/Field'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoneyInput } from '@/components/MoneyInput'
import { useStore } from '@/store/useStore'
import { formatMoney } from '@/lib/format'

function EditDialog({ producto: p, onClose, onUpdate, onRemove }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nombre" htmlFor="prod-edit-nombre">
            <Input
              id="prod-edit-nombre"
              value={p.nombre}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              placeholder="Nombre"
            />
          </Field>
          <Field label="Marca" htmlFor="prod-edit-marca">
            <Input
              id="prod-edit-marca"
              value={p.marca}
              onChange={(e) => onUpdate({ marca: e.target.value })}
              placeholder="Marca"
            />
          </Field>
          <Field label="Costo interno">
            <MoneyInput
              value={p.costo}
              onChange={(costo) => onUpdate({ costo })}
              className="w-full"
            />
          </Field>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              onRemove()
              onClose()
            }}
          >
            <Trash2 className="size-4" /> Eliminar
          </Button>
          <Button size="sm" onClick={onClose}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProductosSettings() {
  const productos = useStore((s) => s.productos)
  const addProducto = useStore((s) => s.addProducto)
  const updateProducto = useStore((s) => s.updateProducto)
  const removeProducto = useStore((s) => s.removeProducto)

  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(q) || p.marca?.toLowerCase().includes(q),
    )
  }, [productos, query])

  const editing = productos.find((p) => p.id === editingId) || null

  const handleAdd = () => {
    setQuery('')
    const id = addProducto({ nombre: 'Nuevo producto' })
    setEditingId(id)
  }

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

      <Button variant="outline" size="sm" className="mb-3 w-full" onClick={handleAdd}>
        <Plus className="size-4" /> Agregar producto
      </Button>

      {filtrados.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No hay productos que coincidan.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {filtrados.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {p.nombre || 'Sin nombre'}
                </div>
                {p.marca && (
                  <div className="truncate text-xs text-muted-foreground">
                    {p.marca}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {p.costo?.valor ? formatMoney(p.costo) : '—'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setEditingId(p.id)}
                aria-label={`Editar ${p.nombre || 'producto'}`}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditDialog
          producto={editing}
          onClose={() => setEditingId(null)}
          onUpdate={(patch) => updateProducto(editing.id, patch)}
          onRemove={() => removeProducto(editing.id)}
        />
      )}
    </div>
  )
}
