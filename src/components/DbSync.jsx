import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { loadFromDb } from '@/lib/sync'

// Baja el estado de la DB (gana la DB) antes de renderizar la app.
export function DbSync({ children }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    loadFromDb().finally(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return children
}
