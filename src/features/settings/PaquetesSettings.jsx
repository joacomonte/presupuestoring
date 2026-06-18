import { ChevronDown, GripVertical, Plus, Star, Trash2 } from 'lucide-react'
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

function SortablePaquete({ paq, categoriasOrdenadas, itemsOrdenados }) {
  const updatePaquete = useStore((s) => s.updatePaquete)
  const removePaquete = useStore((s) => s.removePaquete)
  const paqueteDestacadoId = useStore((s) => s.config.paqueteDestacadoId)
  const setPaqueteDestacado = useStore((s) => s.setPaqueteDestacado)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: paq.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const isDefault = paqueteDestacadoId === paq.id

  return (
    <Collapsible ref={setNodeRef} style={style} className="rounded-lg border p-2">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
            aria-label="Reordenar paquete"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <Input
            value={paq.nombre}
            onChange={(e) => updatePaquete(paq.id, { nombre: e.target.value })}
            className="h-8 flex-1"
          />
        </div>
        <div className="flex items-center gap-1 pl-11">
          <CollapsibleTrigger className="group flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent active:bg-accent">
            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
            {paq.itemIds?.length || 0} servicios
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
            onClick={() => setPaqueteDestacado(isDefault ? null : paq.id)}
            aria-pressed={isDefault}
            aria-label={isDefault ? 'Quitar como default' : 'Marcar como default'}
            title={isDefault ? 'Paquete default' : 'Marcar como default'}
          >
            <Star className={cn('size-4', isDefault && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removePaquete(paq.id)}
            aria-label="Eliminar paquete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <CollapsibleContent className="mt-2 space-y-2">
        {categoriasOrdenadas.map((cat) => {
          const itemsCat = itemsOrdenados.filter((it) => it.categoriaId === cat.id)
          if (itemsCat.length === 0) return null
          return (
            <div key={cat.id}>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {cat.nombre}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {itemsCat.map((it) => {
                  const active = (paq.itemIds || []).includes(it.id)
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() =>
                        updatePaquete(paq.id, {
                          itemIds: active
                            ? paq.itemIds.filter((x) => x !== it.id)
                            : [...(paq.itemIds || []), it.id],
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

export function PaquetesSettings() {
  const items = useStore((s) => s.items)
  const categorias = useStore((s) => s.categorias)
  const paquetes = useStore((s) => s.paquetes)
  const addPaquete = useStore((s) => s.addPaquete)
  const reorderPaquetes = useStore((s) => s.reorderPaquetes)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ids = paquetes.map((p) => p.id)
    const oldIndex = ids.indexOf(active.id)
    const newIndex = ids.indexOf(over.id)
    reorderPaquetes(arrayMove(ids, oldIndex, newIndex))
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
        <h3 className="text-sm font-semibold">Paquetes / combos</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addPaquete({ nombre: 'Nuevo paquete' })}
        >
          <Plus className="size-4" /> Agregar paquete
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={paquetes.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {paquetes.map((paq) => (
              <SortablePaquete
                key={paq.id}
                paq={paq}
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
