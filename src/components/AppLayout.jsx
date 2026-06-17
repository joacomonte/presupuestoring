import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Plus, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const nombre = useStore((s) => s.local.nombre)
  const location = useLocation()
  const inForm = location.pathname.startsWith('/nuevo') || location.pathname.startsWith('/editar')

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                {nombre || 'Presupuestos'}
              </span>
              <span className="block text-[11px] leading-tight text-muted-foreground">
                Presupuestos
              </span>
            </span>
          </Link>

          <div className="flex-1" />

          {!inForm && (
            <Button asChild size="sm" id="btn-nuevo-header">
              <Link to="/nuevo">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </Link>
            </Button>
          )}
          <Button asChild size="icon" variant="ghost" id="btn-ajustes" aria-label="Ajustes">
            <NavLink
              to="/ajustes"
              className={({ isActive }) =>
                cn(isActive && 'bg-accent text-accent-foreground')
              }
            >
              <Settings className="size-5" />
            </NavLink>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
