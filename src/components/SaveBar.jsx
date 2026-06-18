import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { saveToDb } from '@/lib/sync'

// Barra flotante que aparece cuando hay cambios de ajustes sin guardar en la DB.
export function SaveBar() {
  const dirty = useStore((s) => s.dirty)
  const [saving, setSaving] = useState(false)

  if (!dirty) return null

  const onSave = async () => {
    setSaving(true)
    try {
      await saveToDb()
      toast.success('Cambios guardados')
    } catch {
      toast.error('No se pudo guardar. Revisá la conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <span className="text-sm text-muted-foreground">Tenés cambios sin guardar.</span>
        <Button id="btn-guardar-db" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar
        </Button>
      </div>
    </div>
  )
}
