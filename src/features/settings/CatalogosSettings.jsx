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
import { MultiplicadorInput } from '@/components/MultiplicadorInput'
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

function SortableTipo({ tipo, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tipo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label="Reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Input
          value={tipo.nombre}
          onChange={(e) => onUpdate({ nombre: e.target.value })}
          placeholder="Nombre (ej. SUV, Perro grande, Casa)"
          className="flex-1"
        />
        <FilaDelete onDelete={onDelete} />
      </div>
      <MultiplicadorInput
        value={tipo.multiplicador}
        onChange={(multiplicador) => onUpdate({ multiplicador })}
        className="pl-11"
      />
    </div>
  )
}

export function CatalogosSettings() {
  const tiposTrabajo = useStore((s) => s.tiposTrabajo)
  const addTipoTrabajo = useStore((s) => s.addTipoTrabajo)
  const updateTipoTrabajo = useStore((s) => s.updateTipoTrabajo)
  const removeTipoTrabajo = useStore((s) => s.removeTipoTrabajo)
  const reorderTiposTrabajo = useStore((s) => s.reorderTiposTrabajo)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = tiposTrabajo.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderTiposTrabajo(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      {tiposTrabajo.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no definiste tipos de trabajo. Es opcional: si no agregás ninguno, los
          presupuestos no muestran este paso.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tiposTrabajo.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tiposTrabajo.map((t) => (
              <SortableTipo
                key={t.id}
                tipo={t}
                onUpdate={(patch) => updateTipoTrabajo(t.id, patch)}
                onDelete={() => removeTipoTrabajo(t.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => addTipoTrabajo('Nuevo tipo', 1)}
      >
        <Plus className="size-4" /> Agregar tipo de trabajo
      </Button>
    </div>
  )
}
