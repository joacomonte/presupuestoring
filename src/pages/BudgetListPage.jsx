import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Copy,
  FileText,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useStore } from '@/store/useStore'
import { computeTotals } from '@/lib/calc'
import { formatARS, formatNro, formatFecha } from '@/lib/format'

export function BudgetListPage() {
  const navigate = useNavigate()
  const presupuestos = useStore((s) => s.presupuestos)
  const removeBudget = useStore((s) => s.removeBudget)
  const duplicateBudget = useStore((s) => s.duplicateBudget)
  const saveBudget = useStore((s) => s.saveBudget)

  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState(null)

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...presupuestos].sort((a, b) => (b.nro || 0) - (a.nro || 0))
    if (!q) return list
    return list.filter((p) =>
      [
        formatNro(p.nro),
        p.cliente?.nombre,
        p.cliente?.apodo,
        p.vehiculo?.descripcion,
        p.vehiculo?.patente,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [presupuestos, query])

  const handleDuplicar = (id) => {
    const draft = duplicateBudget(id)
    if (!draft) return
    const saved = saveBudget(draft)
    toast.success(`Duplicado como ${formatNro(saved.nro)}`)
    navigate(`/editar/${saved.id}`)
  }

  const handleDelete = () => {
    if (!toDelete) return
    removeBudget(toDelete.id)
    toast.success(`Presupuesto ${formatNro(toDelete.nro)} eliminado`)
    setToDelete(null)
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Presupuestos</h1>
      </div>

      {presupuestos.length > 0 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por N°, cliente, apodo, vehículo o patente"
            className="pl-9"
          />
        </div>
      )}

      {presupuestos.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted">
            <FileText className="size-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">Todavía no hay presupuestos</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Creá tu primer presupuesto desde el botón <span className="font-medium text-foreground">Nuevo</span> arriba a la derecha. Ya viene precargado el paquete más usado para ir rápido.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((p) => {
            const total = computeTotals(p).total
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/presupuesto/${p.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-muted px-2.5 py-1.5">
                    <span className="text-[10px] uppercase leading-none text-muted-foreground">
                      N°
                    </span>
                    <span className="text-sm font-bold tabular-nums leading-tight">
                      {String(p.nro).padStart(4, '0')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium leading-tight">
                      {p.cliente?.nombre || p.cliente?.apodo || 'Sin cliente'}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[p.vehiculo?.descripcion, p.vehiculo?.patente]
                        .filter(Boolean)
                        .join(' · ') || 'Sin vehículo'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFecha(p.fechaEmision)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold tabular-nums">{formatARS(total)}</div>
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label="Acciones"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/editar/${p.id}`)}>
                      <Pencil className="size-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicar(p.id)}>
                      <Copy className="size-4" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setToDelete(p)}
                    >
                      <Trash2 className="size-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin resultados para “{query}”.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar presupuesto"
        description={
          toDelete
            ? `Se eliminará el presupuesto ${formatNro(toDelete.nro)} de ${toDelete.cliente?.nombre || toDelete.cliente?.apodo || 'sin cliente'}. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
