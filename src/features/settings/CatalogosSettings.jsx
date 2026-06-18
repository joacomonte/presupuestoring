import { createElement } from 'react'
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { VEHICLE_ICONS, getVehicleIcon } from '@/lib/vehicleIcons'
import { useStore } from '@/store/useStore'

function IconPicker({ value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label="Elegir icono"
        >
          {createElement(getVehicleIcon(value), { className: 'size-4' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {Object.entries(VEHICLE_ICONS).map(([key, Icon]) => (
            <Button
              key={key}
              variant={key === value ? 'secondary' : 'ghost'}
              size="icon"
              className="size-9"
              onClick={() => onChange(key)}
              aria-label={`Icono ${key}`}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

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

function SortableTipo({ tipo, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tipo.id })

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
        aria-label="Reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <IconPicker value={tipo.icono} onChange={(icono) => onUpdate({ icono })} />
      <Input
        value={tipo.nombre}
        onChange={(e) => onUpdate({ nombre: e.target.value })}
        placeholder="Nombre"
        className="flex-1"
      />
      <Input
        type="number"
        step="0.05"
        value={tipo.multiplicador}
        onChange={(e) => onUpdate({ multiplicador: Number(e.target.value) || 0 })}
        className="w-20"
        aria-label="Multiplicador"
      />
      <FilaDelete onDelete={onDelete} />
    </div>
  )
}

export function CatalogosSettings() {
  const tiposAuto = useStore((s) => s.tiposAuto)
  const addTipoAuto = useStore((s) => s.addTipoAuto)
  const updateTipoAuto = useStore((s) => s.updateTipoAuto)
  const removeTipoAuto = useStore((s) => s.removeTipoAuto)
  const reorderTiposAuto = useStore((s) => s.reorderTiposAuto)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = tiposAuto.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderTiposAuto(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div className="space-y-6">
      {/* Tipos de vehículos */}
      <Bloque
        title="Tipos de vehículos"
        hint="El multiplicador deriva precios de tipos sin valor explícito en la matriz."
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tiposAuto.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tiposAuto.map((t) => (
                <SortableTipo
                  key={t.id}
                  tipo={t}
                  onUpdate={(patch) => updateTipoAuto(t.id, patch)}
                  onDelete={() => removeTipoAuto(t.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addTipoAuto('Nuevo tipo', 1)}
        >
          <Plus className="size-4" /> Agregar tipo
        </Button>
      </Bloque>
    </div>
  )
}
