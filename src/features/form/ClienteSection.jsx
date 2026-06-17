import { useState } from 'react'
import { ChevronDown, User } from 'lucide-react'
import { Section } from '@/components/Section'
import { Field } from '@/components/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function ClienteSection({ cliente, onChange, open, onOpenChange }) {
  const [factOpen, setFactOpen] = useState(!!cliente.facturacion)
  const summary = cliente.nombre || cliente.telefono || null

  return (
    <Section
      id="sec-cliente"
      icon={User}
      title="Cliente"
      summary={summary}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-3">
        <Field label="Nombre / Razón social" htmlFor="cli-nombre">
          <Input
            id="cli-nombre"
            value={cliente.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            placeholder="Ej. Juan Pérez"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Teléfono" htmlFor="cli-tel" hint="Se usa para WhatsApp">
            <Input
              id="cli-tel"
              type="tel"
              inputMode="tel"
              value={cliente.telefono}
              onChange={(e) => onChange({ telefono: e.target.value })}
              placeholder="+54 9 11 ..."
            />
          </Field>
          <Field label="Email" htmlFor="cli-email">
            <Input
              id="cli-email"
              type="email"
              value={cliente.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </Field>
        </div>

        <Collapsible open={factOpen} onOpenChange={setFactOpen}>
          <CollapsibleTrigger className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            Datos de facturación
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              id="cli-facturacion"
              value={cliente.facturacion}
              onChange={(e) => onChange({ facturacion: e.target.value })}
              placeholder="CUIT, razón social, condición IVA, domicilio fiscal…"
              rows={3}
            />
          </CollapsibleContent>
        </Collapsible>

        <Field label="Observaciones" htmlFor="cli-obs">
          <Textarea
            id="cli-obs"
            value={cliente.observaciones}
            onChange={(e) => onChange({ observaciones: e.target.value })}
            placeholder="Notas del cliente (opcional)"
            rows={2}
          />
        </Field>
      </div>
    </Section>
  )
}
