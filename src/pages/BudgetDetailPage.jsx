import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Link2, Loader2, MessageCircle, Pencil, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { DetailDocument } from '@/features/detail/DetailDocument'
import { computeTotals } from '@/lib/calc'
import { createShareLink, buildWhatsappText } from '@/lib/share'
import { formatARS, formatNro } from '@/lib/format'

export function BudgetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getBudget = useStore((s) => s.getBudget)
  const local = useStore((s) => s.local)

  const presupuesto = getBudget(id)
  const [shareOpen, setShareOpen] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const [waLoading, setWaLoading] = useState(false)

  useEffect(() => {
    if (!presupuesto) {
      toast.error('Presupuesto no encontrado')
      navigate('/', { replace: true })
    }
  }, [presupuesto, navigate])

  if (!presupuesto) return null

  const totals = computeTotals(presupuesto)

  const handleCopyLink = async () => {
    setLinkLoading(true)
    // El link se crea con un fetch al backend. En iOS, await + writeText pierde el
    // gesto del click; ClipboardItem con promesa copia cuando resuelve.
    const textPromise = createShareLink(presupuesto, local)
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textPromise.then((t) => new Blob([t], { type: 'text/plain' })),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(await textPromise)
      }
      toast.success('Link copiado')
      setShareOpen(false)
    } catch (e) {
      toast.error('No se pudo copiar el link')
      console.error(e)
    } finally {
      setLinkLoading(false)
    }
  }

  const handleWhatsapp = async () => {
    setWaLoading(true)
    // Abrimos una pestaña ya con el gesto del click; al resolver el link
    // navegamos esa pestaña a wa.me (iOS/Safari bloquean window.open async).
    const win = window.open('', '_blank')
    try {
      const link = await createShareLink(presupuesto, local)
      const url = `https://wa.me/?text=${encodeURIComponent(link)}`
      if (win) win.location.href = url
      else window.location.href = url
      setShareOpen(false)
    } catch (e) {
      if (win) win.close()
      toast.error('No se pudo compartir por WhatsApp')
      console.error(e)
    } finally {
      setWaLoading(false)
    }
  }

  const handleCopyText = async () => {
    try {
      const texto = buildWhatsappText(presupuesto, local, totals)
      await navigator.clipboard.writeText(texto)
      toast.success('Resumen copiado')
      setShareOpen(false)
    } catch (e) {
      toast.error('No se pudo copiar el resumen')
      console.error(e)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight">
            {presupuesto.cliente.nombre || 'Sin cliente'}
          </h1>
          <span className="text-xs text-muted-foreground">
            Presupuesto {formatNro(presupuesto.nro)}
          </span>
        </div>
      </div>

      {/* Documento cliente (vista en pantalla) */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <DetailDocument presupuesto={presupuesto} local={local} totals={totals} />
      </div>

      {/* Vista operador (interno) */}
      <div className="mt-4 rounded-xl border border-dashed bg-card p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vista operador (interno)
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatARS(totals.subtotalItems)}</span>
          </div>
          {totals.recargoTrabajo > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {presupuesto.tipoTrabajo?.nombre || 'Tipo de trabajo'}
              </span>
              <span className="tabular-nums">+{formatARS(totals.recargoTrabajo)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Costos (productos + MO)</span>
            <span className="tabular-nums">{formatARS(totals.costo)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Ganancia</span>
            <span
              className={`tabular-nums ${totals.ganancia >= 0 ? 'text-emerald-600' : 'text-destructive'}`}
            >
              {formatARS(totals.ganancia)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Margen</span>
            <span className="tabular-nums">{Math.round(totals.margenPct)}%</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          El cliente no ve costos ni ganancia. No se incluyen en el link.
        </p>
      </div>

      {/* Acciones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl gap-2 px-4 py-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/editar/${presupuesto.id}`)}
            id="btn-editar"
          >
            <Pencil className="size-4" />
            Editar
          </Button>
          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" id="btn-compartir">
                <Share2 className="size-4" />
                Compartir
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">Compartir presupuesto</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-16 text-lg [&_svg]:size-6"
                  onClick={handleCopyLink}
                  disabled={linkLoading}
                  id="btn-copiar-link"
                >
                  {linkLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Link2 />
                  )}
                  Copiar link
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-16 text-lg [&_svg]:size-6"
                  onClick={handleWhatsapp}
                  disabled={waLoading}
                  id="btn-compartir-whatsapp"
                >
                  {waLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <MessageCircle />
                  )}
                  Compartir por WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-16 text-lg [&_svg]:size-6"
                  onClick={handleCopyText}
                  id="btn-copiar-texto"
                >
                  <FileText />
                  Copiar como texto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
