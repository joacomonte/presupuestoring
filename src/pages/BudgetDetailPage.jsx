import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Download, Link2, Loader2, MessageCircle, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { DetailDocument } from '@/features/detail/DetailDocument'
import { computeTotals } from '@/lib/calc'
import { buildWhatsappLink } from '@/lib/whatsapp'
import { buildShareUrl } from '@/lib/share'
import { formatARS, formatNro } from '@/lib/format'

export function BudgetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getBudget = useStore((s) => s.getBudget)
  const local = useStore((s) => s.local)
  const duplicateBudget = useStore((s) => s.duplicateBudget)
  const saveBudget = useStore((s) => s.saveBudget)

  const presupuesto = getBudget(id)
  const docRef = useRef(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (!presupuesto) {
      toast.error('Presupuesto no encontrado')
      navigate('/', { replace: true })
    }
  }, [presupuesto, navigate])

  if (!presupuesto) return null

  const totals = computeTotals(presupuesto)

  const handlePdf = async () => {
    setPdfLoading(true)
    try {
      // Carga diferida: las libs de PDF (~350KB) sólo se bajan al exportar.
      const { exportElementToPDF } = await import('@/lib/pdf')
      await exportElementToPDF(
        docRef.current,
        `presupuesto-${String(presupuesto.nro).padStart(4, '0')}.pdf`
      )
      toast.success('PDF generado')
    } catch (e) {
      toast.error('No se pudo generar el PDF')
      console.error(e)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      const url = buildShareUrl(presupuesto, local)
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado')
    } catch (e) {
      toast.error('No se pudo copiar el link')
      console.error(e)
    }
  }

  const handleWhatsapp = () => {
    const link = buildWhatsappLink({ ...presupuesto, __totalARS: totals.total }, local)
    window.open(link, '_blank')
  }

  const handleDuplicar = () => {
    const draft = duplicateBudget(presupuesto.id)
    if (!draft) return
    const saved = saveBudget(draft)
    toast.success(`Duplicado como ${formatNro(saved.nro)}`)
    navigate(`/editar/${saved.id}`)
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="flex-1 text-lg font-semibold">Presupuesto {formatNro(presupuesto.nro)}</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(`/editar/${presupuesto.id}`)}>
          <Pencil className="size-4" /> Editar
        </Button>
        <Button variant="outline" size="icon" onClick={handleDuplicar} aria-label="Duplicar">
          <Copy className="size-4" />
        </Button>
      </div>

      {/* Documento cliente (vista en pantalla) */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <DetailDocument presupuesto={presupuesto} local={local} totals={totals} />
      </div>

      {/* Template de PDF: render fijo a 760px fuera de pantalla. Es lo único que se
          captura, así el PDF sale igual en celu y en compu (no depende del viewport). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] top-0 w-[760px] bg-white"
      >
        <DetailDocument
          presupuesto={presupuesto}
          local={local}
          totals={totals}
          innerRef={docRef}
        />
      </div>

      {/* Vista operador (interno, NO va al PDF) */}
      <div className="mt-4 rounded-xl border border-dashed bg-card p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vista operador (interno)
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatARS(totals.subtotal)}</span>
          </div>
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
          El cliente no ve costos ni ganancia. No se incluyen en el PDF.
        </p>
      </div>

      {/* Acciones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl gap-2 px-4 py-3">
          <Button
            className="flex-1"
            variant="outline"
            onClick={handlePdf}
            disabled={pdfLoading}
            id="btn-pdf"
          >
            {pdfLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            PDF
          </Button>
          <Button className="flex-1" variant="outline" onClick={handleCopyLink} id="btn-link">
            <Link2 className="size-4" />
            Link
          </Button>
          <Button
            className="flex-1 bg-[#25D366] text-white hover:bg-[#1ebe5b]"
            onClick={handleWhatsapp}
            id="btn-whatsapp"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}
