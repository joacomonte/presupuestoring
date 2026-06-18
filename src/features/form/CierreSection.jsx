import { Receipt } from 'lucide-react'
import { Section } from '@/components/Section'
import { Field } from '@/components/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { QuickToggle } from '@/components/QuickToggle'
import { MontoUnidad } from '@/components/MontoUnidad'
import { formatARS } from '@/lib/format'

export function CierreSection({
  presupuesto,
  onChange,
  formasPago,
  onAddFormaPago,
  totals,
  open,
  onOpenChange,
  plain,
}) {
  const summary =
    [
      presupuesto.formaPago,
      totals.descuento > 0 ? `Desc -${formatARS(totals.descuento)}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || null

  const patchDescuento = (patch) =>
    onChange({ descuento: { ...presupuesto.descuento, ...patch } })
  const patchSena = (patch) => onChange({ sena: { ...presupuesto.sena, ...patch } })

  return (
    <Section
      id="sec-cierre"
      icon={Receipt}
      title="Cierre"
      summary={summary}
      open={open}
      onOpenChange={onOpenChange}
      plain={plain}
    >
      <div className="space-y-4">
        <Field label="Forma de pago">
          <QuickToggle
            id="forma-pago"
            options={formasPago.map((f) => ({ value: f.nombre, label: f.nombre }))}
            value={presupuesto.formaPago}
            onChange={(v) => onChange({ formaPago: v })}
            allowAdd
            onAddOption={(name) => {
              onAddFormaPago(name)
              return name
            }}
            addPlaceholder="Forma de pago"
          />
        </Field>

        <Field label="Tiempo estimado total" htmlFor="cierre-tiempo">
          <Input
            id="cierre-tiempo"
            value={presupuesto.tiempoEstimado}
            onChange={(e) => onChange({ tiempoEstimado: e.target.value })}
            placeholder="Ej. 2 días hábiles"
          />
        </Field>

        {/* Bonificación / descuento (a nivel total) */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-0.5 text-sm font-medium">Bonificación / descuento</div>
          <p className="mb-2 text-xs text-muted-foreground">
            Descuento sobre el subtotal
          </p>
          <MontoUnidad
            id="desc"
            tipo={presupuesto.descuento.tipo}
            valor={presupuesto.descuento.valor}
            onTipoChange={(tipo) => patchDescuento({ tipo })}
            onValorChange={(valor) => patchDescuento({ valor })}
          />
          {totals.descuento > 0 && (
            <p className="mt-2 text-sm font-semibold tabular-nums text-emerald-600">
              −{formatARS(totals.descuento)} de descuento
            </p>
          )}
        </div>

        {/* Seña / anticipo */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-0.5 text-sm font-medium">Seña / anticipo</div>
          <p className="mb-2 text-xs text-muted-foreground">
            Lo que paga por adelantado
          </p>
          <MontoUnidad
            id="sena"
            tipo={presupuesto.sena.tipo}
            valor={presupuesto.sena.valor}
            onTipoChange={(tipo) => patchSena({ tipo })}
            onValorChange={(valor) => patchSena({ valor })}
          />
          {totals.sena > 0 && (
            <p className="mt-2 text-sm tabular-nums">
              Seña <span className="font-semibold">{formatARS(totals.sena)}</span>
              <span className="text-muted-foreground">
                {' · '}Saldo {formatARS(totals.saldo)}
              </span>
            </p>
          )}
        </div>

        {/* IVA */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="iva-switch" className="text-sm font-medium">
              IVA ({totals.ivaPct}%)
            </Label>
            <p className="text-xs text-muted-foreground">
              {presupuesto.ivaActivo
                ? `+${formatARS(totals.iva)}`
                : 'Desactivado (sin IVA)'}
            </p>
          </div>
          <Switch
            id="iva-switch"
            checked={presupuesto.ivaActivo}
            onCheckedChange={(ivaActivo) => onChange({ ivaActivo })}
          />
        </div>

        <Field label="Garantía" htmlFor="cierre-garantia">
          <Textarea
            id="cierre-garantia"
            value={presupuesto.garantia}
            onChange={(e) => onChange({ garantia: e.target.value })}
            placeholder="Ej. 6 meses sobre el tratamiento cerámico"
            rows={2}
          />
        </Field>

        <Field label="Observaciones" htmlFor="cierre-obs">
          <Textarea
            id="cierre-obs"
            value={presupuesto.observaciones}
            onChange={(e) => onChange({ observaciones: e.target.value })}
            placeholder="Aparecen en el detalle (opcional)"
            rows={2}
          />
        </Field>
      </div>
    </Section>
  )
}
