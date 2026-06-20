import { GripVertical, Plus, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'

function SortableSeccion({ cat, items, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const serviciosCat = items.filter((it) => it.categoriaId === cat.id)

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card p-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label="Reordenar sección"
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
          aria-label="Eliminar sección"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-1.5 pl-11">
        {serviciosCat.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {serviciosCat.map((it) => (
              <span
                key={it.id}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {it.titulo || 'Sin título'}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/70">
            Sin servicios. Vinculalos desde la pestaña Servicios.
          </p>
        )}
      </div>
    </div>
  )
}

export function SeccionesSettings() {
  const items = useStore((s) => s.items)
  const categorias = useStore((s) => s.categorias)
  const addCategoria = useStore((s) => s.addCategoria)
  const updateCategoria = useStore((s) => s.updateCategoria)
  const removeCategoria = useStore((s) => s.removeCategoria)
  const reorderCategorias = useStore((s) => s.reorderCategorias)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = categoriasOrdenadas.map((c) => c.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderCategorias(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div>
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
              <SortableSeccion
                key={c.id}
                cat={c}
                items={items}
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
        onClick={() => addCategoria('Nueva sección')}
      >
        <Plus className="size-4" /> Agregar sección
      </Button>
    </div>
  )
}
