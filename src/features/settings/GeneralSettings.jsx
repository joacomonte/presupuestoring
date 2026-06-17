import { Trash2, Upload } from 'lucide-react'
import { Field } from '@/components/Field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/store/useStore'
import { formatARS } from '@/lib/format'

export function GeneralSettings() {
  const config = useStore((s) => s.config)
  const setCotizacionUsd = useStore((s) => s.setCotizacionUsd)
  const setIvaPct = useStore((s) => s.setIvaPct)
  const setPaqueteDestacado = useStore((s) => s.setPaqueteDestacado)
  const paquetes = useStore((s) => s.paquetes)
  const local = useStore((s) => s.local)
  const setLocal = useStore((s) => s.setLocal)

  const onLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLocal({ logo: reader.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Cotización USD (ARS por dólar)"
          htmlFor="set-cotizacion"
          hint={`1 USD = ${formatARS(config.cotizacionUsd)}`}
        >
          <Input
            id="set-cotizacion"
            type="number"
            inputMode="numeric"
            value={config.cotizacionUsd || ''}
            onChange={(e) => setCotizacionUsd(e.target.value)}
          />
        </Field>
        <Field label="IVA (%)" htmlFor="set-iva">
          <Input
            id="set-iva"
            type="number"
            inputMode="numeric"
            value={config.ivaPct || ''}
            onChange={(e) => setIvaPct(e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Paquete preseleccionado al abrir un presupuesto nuevo"
        hint="Se carga automáticamente para agilizar (PRD §2.3)."
      >
        <Select
          value={config.paqueteDestacadoId || 'none'}
          onValueChange={(v) => setPaqueteDestacado(v === 'none' ? null : v)}
        >
          <SelectTrigger id="set-destacado" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ninguno</SelectItem>
            {paquetes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="border-t pt-4">
        <div className="mb-3 text-sm font-medium">Datos del local (encabezado del detalle)</div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {local.logo ? (
              <img
                src={local.logo}
                alt="Logo"
                className="size-16 rounded-lg border object-contain"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-lg border bg-muted text-xl font-bold text-muted-foreground">
                {(local.nombre || 'D').slice(0, 1)}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" size="sm">
                <label htmlFor="set-logo" className="cursor-pointer">
                  <Upload className="size-4" /> Subir logo
                  <input
                    id="set-logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onLogo}
                  />
                </label>
              </Button>
              {local.logo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setLocal({ logo: null })}
                >
                  <Trash2 className="size-4" /> Quitar
                </Button>
              )}
            </div>
          </div>

          <Field label="Nombre del local" htmlFor="set-nombre">
            <Input
              id="set-nombre"
              value={local.nombre}
              onChange={(e) => setLocal({ nombre: e.target.value })}
            />
          </Field>
          <Field label="Dirección" htmlFor="set-direccion">
            <Input
              id="set-direccion"
              value={local.direccion}
              onChange={(e) => setLocal({ direccion: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" htmlFor="set-telefono">
              <Input
                id="set-telefono"
                value={local.telefono}
                onChange={(e) => setLocal({ telefono: e.target.value })}
              />
            </Field>
            <Field label="Email / contacto" htmlFor="set-email">
              <Input
                id="set-email"
                value={local.email}
                onChange={(e) => setLocal({ email: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  )
}
