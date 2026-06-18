import { Plus, Tag } from 'lucide-react'
import { Section } from '@/components/Section'
import { Badge } from '@/components/ui/badge'
import { ItemCard } from './ItemCard'
import { formatARS, formatMoney } from '@/lib/format'
import { resolveMatrixPrice, itemFinalARS } from '@/lib/calc'

export function CategoriaSection({
  categoria,
  catalogItems,
  draftItems,
  tiposAuto,
  tipoAutoId,
  cotizacionUsd,
  productosCatalogo,
  onToggleItem,
  onChangeItem,
  onRemoveItem,
  onAddBlank,
  open,
  onOpenChange,
  plain,
}) {
  const incluidos = draftItems
  const incluidosCatalogoIds = new Set(
    incluidos.map((it) => it.catalogoItemId).filter(Boolean)
  )
  const disponibles = catalogItems.filter((ci) => !incluidosCatalogoIds.has(ci.id))

  const totalCat = incluidos.reduce((s, it) => s + itemFinalARS(it, cotizacionUsd), 0)
  const summary =
    incluidos.length > 0
      ? `${incluidos.length} ${incluidos.length === 1 ? 'ítem' : 'ítems'} · ${formatARS(totalCat)}`
      : null

  return (
    <Section
      id={`sec-cat-${categoria.id}`}
      icon={Tag}
      title={categoria.nombre}
      summary={summary}
      open={open}
      onOpenChange={onOpenChange}
      plain={plain}
      badge={
        incluidos.length > 0 ? (
          <Badge variant="secondary" className="tabular-nums">
            {incluidos.length}
          </Badge>
        ) : null
      }
    >
      <div className="space-y-3">
        {incluidos.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            cotizacionUsd={cotizacionUsd}
            productosCatalogo={productosCatalogo}
            onChange={(patch) => onChangeItem(item.id, patch)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}

        {disponibles.length > 0 && (
          <div>
            {incluidos.length > 0 && (
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Agregar de esta categoría
              </div>
            )}
            <div className="flex flex-col gap-2">
              {disponibles.map((ci) => {
                const precio = resolveMatrixPrice(ci, tipoAutoId, tiposAuto)
                return (
                  <button
                    key={ci.id}
                    type="button"
                    onClick={() => onToggleItem(ci)}
                    className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-left hover:border-primary hover:bg-accent"
                  >
                    <Plus className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">
                        {ci.titulo}
                      </span>
                      {ci.descripcion && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {ci.descripcion}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatMoney(precio)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onAddBlank(categoria.id)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" /> Ítem manual
        </button>
      </div>
    </Section>
  )
}
