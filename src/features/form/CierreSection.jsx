import { Receipt } from 'lucide-react'
import { Section } from '@/components/Section'
import { Field } from '@/components/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { QuickToggle } from '@/components/QuickToggle'
import { formatARS } from '@/lib/format'

const TIPO_OPTS = [
  { value: '%', label: '%' },
  { value: 'monto', label: '$ Monto' },
]

export function CierreSection({
  presupuesto,
  onChange,
  formasPago,
  onAddFormaPago,
  totals,
  open,
  onOpenChange,
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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Bonificación / descuento</span>
            {totals.descuento > 0 && (
              <span className="text-sm font-semibold tabular-nums text-emerald-600">
                −{formatARS(totals.descuento)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <QuickToggle
              id="desc-tipo"
              size="sm"
              options={TIPO_OPTS}
              value={presupuesto.descuento.tipo}
              onChange={(tipo) => patchDescuento({ tipo })}
            />
            <Input
              id="desc-valor"
              type="number"
              inputMode="numeric"
              min={0}
              value={presupuesto.descuento.valor || ''}
              onChange={(e) => patchDescuento({ valor: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-28"
            />
          </div>
        </div>

        {/* Seña / anticipo */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Seña / anticipo</span>
            {totals.sena > 0 && (
              <span className="text-right text-xs text-muted-foreground">
                Seña {formatARS(totals.sena)} · Saldo {formatARS(totals.saldo)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <QuickToggle
              id="sena-tipo"
              size="sm"
              options={TIPO_OPTS}
              value={presupuesto.sena.tipo}
              onChange={(tipo) => patchSena({ tipo })}
            />
            <Input
              id="sena-valor"
              type="number"
              inputMode="numeric"
              min={0}
              value={presupuesto.sena.valor || ''}
              onChange={(e) => patchSena({ valor: Number(e.target.value) || 0 })}
              placeholder="0"
              className="w-28"
            />
          </div>
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
