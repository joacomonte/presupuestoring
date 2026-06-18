import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
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
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useStore } from '@/store/useStore'

export function DataSettings() {
  const categorias = useStore((s) => s.categorias)
  const bumpPrices = useStore((s) => s.bumpPrices)

  const [pct, setPct] = useState('')
  const [scope, setScope] = useState('all')
  const [confirmBump, setConfirmBump] = useState(false)

  const doBump = () => {
    const valor = Number(pct)
    if (!valor) {
      toast.error('Ingresá un porcentaje')
      return
    }
    bumpPrices({ pct: valor, categoriaId: scope === 'all' ? null : scope })
    toast.success(`Precios actualizados ${valor > 0 ? '+' : ''}${valor}%`)
    setPct('')
    setConfirmBump(false)
  }

  return (
    <div className="space-y-6">
      {/* Actualización masiva */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4" /> Actualización masiva de precios
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Sube o baja los precios de venta un %. No modifica costos internos.
        </p>
        <div className="flex items-end gap-2">
          <Field label="Porcentaje (%)" htmlFor="bump-pct" className="w-28">
            <Input
              id="bump-pct"
              type="number"
              inputMode="numeric"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              placeholder="Ej. 15"
            />
          </Field>
          <Field label="Alcance" className="flex-1">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id="bump-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el catálogo</SelectItem>
                {[...categorias]
                  .sort((a, b) => a.orden - b.orden)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <Button onClick={() => setConfirmBump(true)}>Aplicar</Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmBump}
        onOpenChange={setConfirmBump}
        title="Actualizar precios"
        description={`Se ${Number(pct) >= 0 ? 'aumentarán' : 'reducirán'} los precios de venta un ${pct}% (${scope === 'all' ? 'todo el catálogo' : 'una categoría'}). Los presupuestos ya guardados no se modifican.`}
        confirmLabel="Aplicar"
        onConfirm={doBump}
      />
    </div>
  )
}
