import { useRef, useState } from 'react'
import { CloudDownload, CloudUpload, Download, Loader2, RotateCcw, TrendingUp, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { saveAppState, loadAppState } from '@/lib/cloud'
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
import { STORAGE_KEY } from '@/data/seed'

export function DataSettings() {
  const categorias = useStore((s) => s.categorias)
  const bumpPrices = useStore((s) => s.bumpPrices)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetData = useStore((s) => s.resetData)

  const [pct, setPct] = useState('')
  const [scope, setScope] = useState('all')
  const [confirmBump, setConfirmBump] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [cloudSaving, setCloudSaving] = useState(false)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [confirmCloudLoad, setConfirmCloudLoad] = useState(false)
  const fileRef = useRef(null)

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

  const doExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${STORAGE_KEY}-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Datos exportados')
  }

  const doCloudSave = async () => {
    setCloudSaving(true)
    try {
      await saveAppState(exportData())
      toast.success('Guardado en la nube')
    } catch (e) {
      toast.error(e.message || 'No se pudo guardar')
      console.error(e)
    } finally {
      setCloudSaving(false)
    }
  }

  const doCloudLoad = async () => {
    setCloudLoading(true)
    try {
      const data = await loadAppState()
      if (!data) {
        toast.error('No hay datos en la nube todavía')
        return
      }
      importData(data)
      toast.success('Cargado de la nube')
      setConfirmCloudLoad(false)
    } catch (e) {
      toast.error(e.message || 'No se pudo cargar')
      console.error(e)
    } finally {
      setCloudLoading(false)
    }
  }

  const doImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        importData(obj)
        toast.success('Datos importados')
      } catch (err) {
        toast.error(err.message || 'JSON inválido')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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

      {/* Backup */}
      <div className="border-t pt-4">
        <div className="mb-2 text-sm font-semibold">Backup (JSON)</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Exportá todos los datos (catálogos, local y presupuestos) o restaurá desde un archivo.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={doExport}>
            <Download className="size-4" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={doImport}
          />
        </div>
      </div>

      {/* Nube (Neon) */}
      <div className="border-t pt-4">
        <div className="mb-2 text-sm font-semibold">Nube</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Guardá todos los datos en la nube o traélos a este dispositivo. Cargar reemplaza
          todo lo que tengas acá.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={doCloudSave} disabled={cloudSaving} id="btn-cloud-save">
            {cloudSaving ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
            Guardar en la nube
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmCloudLoad(true)}
            disabled={cloudLoading}
            id="btn-cloud-load"
          >
            {cloudLoading ? <Loader2 className="size-4 animate-spin" /> : <CloudDownload className="size-4" />}
            Cargar de la nube
          </Button>
        </div>
      </div>

      {/* Reset */}
      <div className="border-t pt-4">
        <div className="mb-2 text-sm font-semibold">Modo prototipo</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Borra todo (catálogos, configuración y presupuestos) y recarga los datos de ejemplo.
        </p>
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw className="size-4" /> Resetear datos
        </Button>
      </div>

      <ConfirmDialog
        open={confirmBump}
        onOpenChange={setConfirmBump}
        title="Actualizar precios"
        description={`Se ${Number(pct) >= 0 ? 'aumentarán' : 'reducirán'} los precios de venta un ${pct}% (${scope === 'all' ? 'todo el catálogo' : 'una categoría'}). Los presupuestos ya guardados no se modifican.`}
        confirmLabel="Aplicar"
        onConfirm={doBump}
      />

      <ConfirmDialog
        open={confirmCloudLoad}
        onOpenChange={setConfirmCloudLoad}
        title="Cargar de la nube"
        description="Se reemplazarán TODOS los datos de este dispositivo (catálogos, configuración y presupuestos) por los guardados en la nube. Esta acción no se puede deshacer."
        confirmLabel="Cargar"
        destructive
        onConfirm={doCloudLoad}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Resetear todos los datos"
        description="Se borrarán catálogos, configuración y TODOS los presupuestos guardados, y se recargarán los datos de ejemplo. Esta acción no se puede deshacer."
        confirmLabel="Resetear"
        destructive
        onConfirm={() => {
          resetData()
          toast.success('Datos reseteados al seed')
          setConfirmReset(false)
        }}
      />
    </div>
  )
}
