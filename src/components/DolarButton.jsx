import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/Field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useStore } from '@/store/useStore'
import { formatNumber } from '@/lib/format'
import { saveToDb } from '@/lib/sync'

// Acceso rápido a la cotización del dólar desde el header: muestra el valor y permite editarlo.
export function DolarButton() {
  const cotizacionUsd = useStore((s) => s.config.cotizacionUsd)
  const setCotizacionUsd = useStore((s) => s.setCotizacionUsd)
  const dirty = useStore((s) => s.dirty)
  const [saving, setSaving] = useState(false)

  const onSave = async () => {
    setSaving(true)
    try {
      await saveToDb()
      toast.success('Cotización guardada')
    } catch {
      toast.error('No se pudo guardar. Revisá la conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          id="btn-dolar"
          className="gap-1 font-medium text-muted-foreground"
          aria-label="Cotización del dólar"
        >
          <span>U$D</span>
          {formatNumber(cotizacionUsd)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <Field label="Cotización USD" htmlFor="set-cotizacion-header" hint="ARS por dólar">
          <div className="relative">
            <Input
              id="set-cotizacion-header"
              type="number"
              inputMode="numeric"
              autoFocus
              className="pr-10"
              value={cotizacionUsd || ''}
              onChange={(e) => setCotizacionUsd(e.target.value)}
            />
            <Button
              id="btn-guardar-cotizacion"
              type="button"
              size="icon"
              variant="ghost"
              className="absolute inset-y-0 right-0 h-full w-9 text-muted-foreground"
              onClick={onSave}
              disabled={saving || !dirty}
              aria-label="Guardar cotización"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </Button>
          </div>
        </Field>
      </PopoverContent>
    </Popover>
  )
}
