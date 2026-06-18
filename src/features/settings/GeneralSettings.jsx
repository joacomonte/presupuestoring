import { Plus, Trash2 } from 'lucide-react'
import { Field } from '@/components/Field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store/useStore'

export function GeneralSettings() {
  const config = useStore((s) => s.config)
  const setIvaPct = useStore((s) => s.setIvaPct)
  const setFormaPagoDefault = useStore((s) => s.setFormaPagoDefault)
  const local = useStore((s) => s.local)
  const setLocal = useStore((s) => s.setLocal)
  const formasPago = useStore((s) => s.formasPago)
  const addFormaPago = useStore((s) => s.addFormaPago)
  const updateFormaPago = useStore((s) => s.updateFormaPago)
  const removeFormaPago = useStore((s) => s.removeFormaPago)

  return (
    <div className="space-y-5">
      <Field label="IVA (%)" htmlFor="set-iva">
        <Input
          id="set-iva"
          type="number"
          inputMode="numeric"
          value={config.ivaPct || ''}
          onChange={(e) => setIvaPct(e.target.value)}
        />
      </Field>

      <div className="border-t pt-4">
        <div className="mb-3 text-sm font-medium">Formas de pago</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Marcá con el badge la forma de pago preseleccionada al abrir un presupuesto nuevo.
        </p>
        <div className="space-y-2">
          {formasPago.map((f) => {
            const isDefault = config.formaPagoDefaultId === f.id
            return (
              <div key={f.id} className="flex items-center gap-2">
                <Input
                  value={f.nombre}
                  onChange={(e) => updateFormaPago(f.id, { nombre: e.target.value })}
                  className="flex-1"
                />
                <Badge asChild variant={isDefault ? 'default' : 'outline'}>
                  <button
                    type="button"
                    onClick={() => setFormaPagoDefault(isDefault ? null : f.id)}
                    aria-pressed={isDefault}
                    className={`shrink-0 cursor-pointer ${isDefault ? '' : 'text-muted-foreground'}`}
                  >
                    Default
                  </button>
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFormaPago(f.id)}
                  aria-label="Eliminar forma de pago"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addFormaPago('Nueva forma')}
        >
          <Plus className="size-4" /> Agregar
        </Button>
      </div>

      <div className="border-t pt-4">
        <div className="mb-3 text-sm font-medium">Datos del local (encabezado del detalle)</div>
        <div className="space-y-3">
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
