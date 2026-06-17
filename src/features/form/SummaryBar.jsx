import { useState } from 'react'
import { ChevronUp, FileCheck2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { QuickToggle } from '@/components/QuickToggle'
import { formatARS } from '@/lib/format'
import { cn } from '@/lib/utils'

const TIPO_OPTS = [
  { value: '%', label: '%' },
  { value: 'monto', label: '$' },
]

function Row({ label, value, strong, accent, onClick }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-1 text-sm',
        onClick && 'cursor-pointer rounded px-1 hover:bg-accent'
      )}
      onClick={onClick}
    >
      <span className={cn(strong ? 'font-medium' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          strong && 'font-semibold',
          accent === 'pos' && 'text-emerald-600',
          accent === 'neg' && 'text-destructive'
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function SummaryBar({
  presupuesto,
  totals,
  itemsResumen,
  onPatch,
  onGenerar,
  onJumpToItem,
  saving,
}) {
  const [expanded, setExpanded] = useState(false)

  const patchDescuento = (patch) =>
    onPatch({ descuento: { ...presupuesto.descuento, ...patch } })
  const patchSena = (patch) => onPatch({ sena: { ...presupuesto.sena, ...patch } })

  const jump = (id) => {
    setExpanded(false)
    onJumpToItem(id)
  }

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setExpanded(false)}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-xl px-3 pb-3">
          {/* Panel expandido */}
          {expanded && (
            <div className="mb-2 max-h-[68svh] overflow-y-auto rounded-2xl border bg-background p-4 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Resumen</span>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Cerrar resumen"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Ítems (tap para editar) */}
              {itemsResumen.length > 0 ? (
                <div className="mb-2 border-b pb-2">
                  {itemsResumen.map((it) => (
                    <Row
                      key={it.id}
                      label={it.titulo || 'Ítem sin título'}
                      value={formatARS(it.finalARS)}
                      onClick={() => jump(it.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="mb-2 border-b pb-2 text-sm text-muted-foreground">
                  Todavía no agregaste ítems.
                </p>
              )}

              <Row label="Subtotal" value={formatARS(totals.subtotal)} />

              {/* Bonificación a ojo */}
              <div className="my-2 rounded-lg bg-muted/50 p-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium">Bonificación</span>
                  {totals.descuento > 0 && (
                    <span className="text-sm font-semibold tabular-nums text-emerald-600">
                      −{formatARS(totals.descuento)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <QuickToggle
                    size="sm"
                    options={TIPO_OPTS}
                    value={presupuesto.descuento.tipo}
                    onChange={(tipo) => patchDescuento({ tipo })}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={presupuesto.descuento.valor || ''}
                    onChange={(e) =>
                      patchDescuento({ valor: Number(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="h-8 w-24"
                  />
                </div>
              </div>

              {/* IVA */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  IVA ({totals.ivaPct}%)
                </span>
                <div className="flex items-center gap-2">
                  {presupuesto.ivaActivo && (
                    <span className="text-sm tabular-nums">
                      +{formatARS(totals.iva)}
                    </span>
                  )}
                  <Switch
                    checked={presupuesto.ivaActivo}
                    onCheckedChange={(ivaActivo) => onPatch({ ivaActivo })}
                  />
                </div>
              </div>

              <div className="my-1 border-t" />
              <Row label="Total" value={formatARS(totals.total)} strong />

              {/* Seña */}
              <div className="my-2 rounded-lg bg-muted/50 p-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium">Seña / anticipo</span>
                  {totals.sena > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Saldo {formatARS(totals.saldo)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <QuickToggle
                    size="sm"
                    options={TIPO_OPTS}
                    value={presupuesto.sena.tipo}
                    onChange={(tipo) => patchSena({ tipo })}
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={presupuesto.sena.valor || ''}
                    onChange={(e) => patchSena({ valor: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 w-24"
                  />
                </div>
              </div>

              {/* Vista operador */}
              <div className="mt-2 rounded-lg border border-dashed p-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Vista operador (interno)
                </div>
                <Row label="Costos" value={formatARS(totals.costo)} />
                <Row
                  label="Ganancia"
                  value={formatARS(totals.ganancia)}
                  strong
                  accent={totals.ganancia >= 0 ? 'pos' : 'neg'}
                />
                <Row label="Margen" value={`${Math.round(totals.margenPct)}%`} />
              </div>
            </div>
          )}

          {/* Barra compacta */}
          <div className="flex items-stretch gap-2 rounded-2xl border bg-background p-2 shadow-lg">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex flex-1 items-center gap-2 rounded-xl px-3 py-1.5 text-left hover:bg-accent"
            >
              <ChevronUp
                className={cn(
                  'size-5 shrink-0 text-muted-foreground transition-transform',
                  expanded && 'rotate-180'
                )}
              />
              <span className="min-w-0">
                <span className="block text-[11px] leading-none text-muted-foreground">
                  Total {itemsResumen.length > 0 && `· ${itemsResumen.length} ítems`}
                </span>
                <span className="block text-lg font-bold leading-tight tabular-nums">
                  {formatARS(totals.total)}
                </span>
              </span>
            </button>
            <Button
              type="button"
              id="btn-generar"
              size="lg"
              className="shrink-0"
              onClick={onGenerar}
              disabled={saving}
            >
              <FileCheck2 className="size-4" />
              Generar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
