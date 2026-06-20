import { Check, ChevronDown, GripVertical, Plus, Star, Trash2 } from 'lucide-react'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

function SortablePlantilla({ plt, categoriasOrdenadas, itemsOrdenados }) {
  const updatePlantilla = useStore((s) => s.updatePlantilla)
  const removePlantilla = useStore((s) => s.removePlantilla)
  const plantillaDestacadaId = useStore((s) => s.config.plantillaDestacadaId)
  const setPlantillaDestacada = useStore((s) => s.setPlantillaDestacada)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: plt.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const isDefault = plantillaDestacadaId === plt.id

  return (
    <Collapsible ref={setNodeRef} style={style} className="rounded-lg border p-2">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
            aria-label="Reordenar plantilla"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <Input
            value={plt.nombre}
            onChange={(e) => updatePlantilla(plt.id, { nombre: e.target.value })}
            placeholder="Nombre de la plantilla"
            className="h-8 flex-1"
          />
        </div>
        <div className="pl-11">
          <Input
            value={plt.descripcion || ''}
            onChange={(e) => updatePlantilla(plt.id, { descripcion: e.target.value })}
            placeholder="Descripción (opcional) — para acordarte de qué se trata"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-1 pl-11">
          <CollapsibleTrigger className="group flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent active:bg-accent">
            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
            {plt.itemIds?.length || 0} servicios
          </CollapsibleTrigger>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-8 shrink-0',
              isDefault
                ? 'text-primary hover:text-primary'
                : 'text-muted-foreground/50 hover:text-foreground'
            )}
            onClick={() => setPlantillaDestacada(isDefault ? null : plt.id)}
            aria-pressed={isDefault}
            aria-label={isDefault ? 'Quitar como default' : 'Marcar como default'}
            title={isDefault ? 'Plantilla default' : 'Marcar como default'}
          >
            <Star className={cn('size-4', isDefault && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removePlantilla(plt.id)}
            aria-label="Eliminar plantilla"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <CollapsibleContent className="mt-2 space-y-2">
        {categoriasOrdenadas.map((cat) => {
          const itemsCat = itemsOrdenados.filter((it) => it.categoriaId === cat.id)
          if (itemsCat.length === 0) return null
          const seleccionados = (plt.itemIds || []).filter((id) =>
            itemsCat.some((it) => it.id === id)
          )
          const todosActivos = seleccionados.length === itemsCat.length
          const toggleSeccion = () => {
            const otros = (plt.itemIds || []).filter(
              (id) => !itemsCat.some((it) => it.id === id)
            )
            updatePlantilla(plt.id, {
              itemIds: todosActivos ? otros : [...otros, ...itemsCat.map((it) => it.id)],
            })
          }
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={toggleSeccion}
                aria-pressed={todosActivos}
                className="mb-1 flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-accent"
              >
                <span
                  className={cn(
                    'flex size-3.5 items-center justify-center rounded-sm border',
                    todosActivos
                      ? 'border-primary bg-primary text-primary-foreground'
                      : seleccionados.length > 0
                        ? 'border-primary bg-primary/30'
                        : 'border-input'
                  )}
                >
                  {todosActivos && <Check className="size-3" />}
                </span>
                {cat.nombre}
              </button>
              <div className="flex flex-wrap gap-1.5">
                {itemsCat.map((it) => {
                  const active = (plt.itemIds || []).includes(it.id)
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() =>
                        updatePlantilla(plt.id, {
                          itemIds: active
                            ? plt.itemIds.filter((x) => x !== it.id)
                            : [...(plt.itemIds || []), it.id],
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
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function PlantillasSettings() {
  const items = useStore((s) => s.items)
  const categorias = useStore((s) => s.categorias)
  const plantillas = useStore((s) => s.plantillas)
  const addPlantilla = useStore((s) => s.addPlantilla)
  const reorderPlantillas = useStore((s) => s.reorderPlantillas)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = plantillas.map((p) => p.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderPlantillas(arrayMove(ids, oldIndex, newIndex))
  }

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden)
  const itemsOrdenados = [...items].sort((a, b) => {
    const ca = categorias.find((c) => c.id === a.categoriaId)?.orden ?? 99
    const cb = categorias.find((c) => c.id === b.categoriaId)?.orden ?? 99
    return ca - cb
  })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Plantillas</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addPlantilla({ nombre: 'Nueva plantilla' })}
        >
          <Plus className="size-4" /> Agregar plantilla
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={plantillas.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {plantillas.map((plt) => (
              <SortablePlantilla
                key={plt.id}
                plt={plt}
                categoriasOrdenadas={categoriasOrdenadas}
                itemsOrdenados={itemsOrdenados}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
