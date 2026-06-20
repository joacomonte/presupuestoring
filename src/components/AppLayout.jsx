import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { List, Settings, Home, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { AppLogo } from '@/components/AppLogo'
import { DolarButton } from '@/components/DolarButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStore } from '@/store/useStore'
import { useAccount } from '@/store/useAccount'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const nombre = useStore((s) => s.local.nombre)
  const user = useAccount((s) => s.user)
  const logout = useAccount((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const inForm = location.pathname.startsWith('/nuevo') || location.pathname.startsWith('/editar')

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                id="btn-cuenta-menu"
                className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {user === 'blaster' ? (
                  <Logo className="size-8" />
                ) : (
                  <AppLogo className="size-8" />
                )}
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold leading-tight">
                    <span className="truncate">{nombre || 'Presupuestos'}</span>
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem id="menu-inicio" onSelect={() => navigate('/')}>
                <Home className="size-4" />
                Ir al inicio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem id="menu-cerrar-sesion" onSelect={logout}>
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <DolarButton />

          {inForm && (
            <Button asChild size="sm" variant="outline" id="btn-lista-header">
              <Link to="/">
                <List className="size-4" />
                <span>Presupuestos</span>
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost" id="btn-ajustes" aria-label="Configuraciones">
            <NavLink
              to="/ajustes"
              className={({ isActive }) =>
                cn(isActive && 'bg-accent text-accent-foreground')
              }
            >
              <Settings className="size-5" />
              <span className="hidden sm:inline">Configuraciones</span>
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
