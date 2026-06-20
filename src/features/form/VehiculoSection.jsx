import { Car } from 'lucide-react'
import { Section } from '@/components/Section'
import { Field } from '@/components/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function VehiculoSection({
  vehiculo,
  onChange,
  open,
  onOpenChange,
  plain,
}) {
  const summary = vehiculo.descripcion || null

  return (
    <Section
      id="sec-vehiculo"
      icon={Car}
      title="Vehículo"
      summary={summary}
      open={open}
      onOpenChange={onOpenChange}
      plain={plain}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Descripción" htmlFor="veh-desc">
            <Input
              id="veh-desc"
              value={vehiculo.descripcion}
              onChange={(e) => onChange({ descripcion: e.target.value })}
              placeholder="Ej. Ford Focus"
            />
          </Field>
          <Field label="Patente" htmlFor="veh-patente">
            <Input
              id="veh-patente"
              value={vehiculo.patente}
              onChange={(e) => onChange({ patente: e.target.value.toUpperCase() })}
              placeholder="AB123CD"
            />
          </Field>
        </div>

        <Field label="Estado actual" htmlFor="veh-estado">
          <Textarea
            id="veh-estado"
            value={vehiculo.estado}
            onChange={(e) => onChange({ estado: e.target.value })}
            placeholder="Ej. rayones en puerta delantera, tapizado manchado…"
            rows={2}
          />
        </Field>

        <Field label="Observaciones" htmlFor="veh-obs">
          <Textarea
            id="veh-obs"
            value={vehiculo.observaciones}
            onChange={(e) => onChange({ observaciones: e.target.value })}
            placeholder="Notas del vehículo (opcional)"
            rows={2}
          />
        </Field>
      </div>
    </Section>
  )
}
