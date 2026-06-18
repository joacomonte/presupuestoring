import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export function PaquetesSettings() {
  const items = useStore((s) => s.items)
  const categorias = useStore((s) => s.categorias)
  const paquetes = useStore((s) => s.paquetes)
  const addPaquete = useStore((s) => s.addPaquete)
  const updatePaquete = useStore((s) => s.updatePaquete)
  const removePaquete = useStore((s) => s.removePaquete)
  const movePaquete = useStore((s) => s.movePaquete)
  const paqueteDestacadoId = useStore((s) => s.config.paqueteDestacadoId)
  const setPaqueteDestacado = useStore((s) => s.setPaqueteDestacado)

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
      <div className="space-y-3">
        {paquetes.map((paq, i) => (
          <Collapsible key={paq.id} className="rounded-lg border p-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => movePaquete(paq.id, 'up')}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Subir paquete"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => movePaquete(paq.id, 'down')}
                  disabled={i === paquetes.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Bajar paquete"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <CollapsibleTrigger
                className="group flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:bg-accent"
                aria-label="Desplegar paquete"
              >
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <Input
                value={paq.nombre}
                onChange={(e) => updatePaquete(paq.id, { nombre: e.target.value })}
                className="h-8 flex-1"
              />
              {(() => {
                const isDefault = paqueteDestacadoId === paq.id
                return (
                  <Badge asChild variant={isDefault ? 'default' : 'outline'}>
                    <button
                      type="button"
                      onClick={() => setPaqueteDestacado(isDefault ? null : paq.id)}
                      aria-pressed={isDefault}
                      className={cn('shrink-0 cursor-pointer', !isDefault && 'text-muted-foreground')}
                    >
                      Default
                    </button>
                  </Badge>
                )
              })()}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => removePaquete(paq.id)}
                aria-label="Eliminar paquete"
              >
                <Trash2 className="size-4" />
              </Button>
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
        ))}
      </div>
    </div>
  )
}
