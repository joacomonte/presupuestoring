import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Layers,
  ListTree,
  Package,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SaveBar } from '@/components/SaveBar'
import { GeneralSettings } from '@/features/settings/GeneralSettings'
import { CatalogosSettings } from '@/features/settings/CatalogosSettings'
import { ProductosSettings } from '@/features/settings/ProductosSettings'
import { ServiciosSettings } from '@/features/settings/ServiciosSettings'
import { PaquetesSettings } from '@/features/settings/PaquetesSettings'
import { DataSettings } from '@/features/settings/DataSettings'

function OtrosSettings() {
  return (
    <div className="space-y-6">
      <GeneralSettings />
      <DataSettings />
    </div>
  )
}

const TABS = [
  { value: 'vehiculos', icon: ListTree, label: 'Vehículos', Content: CatalogosSettings },
  { value: 'paquetes', icon: Layers, label: 'Paquetes', Content: PaquetesSettings },
  { value: 'servicios', icon: Boxes, label: 'Servicios', Content: ServiciosSettings },
  { value: 'productos', icon: Package, label: 'Productos', Content: ProductosSettings },
  { value: 'otros', icon: SlidersHorizontal, label: 'Otros', Content: OtrosSettings },
]

// Lista de tabs con scroll horizontal y flechas que aparecen según haya más contenido a cada lado.
function TabScroller({ children }) {
  const ref = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * 120, behavior: 'smooth' })

  return (
    <div className="relative -mx-4">
      {!atStart && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Mostrar pestañas anteriores"
          className="absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-background via-background pl-1 pr-5 text-muted-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}
      <div
        ref={ref}
        className="touch-pan-x overflow-x-auto overflow-y-hidden border-b px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {!atEnd && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Mostrar más pestañas"
          className="absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-background via-background pl-5 pr-1 text-muted-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">Ajustes</h1>
      </div>

      <Tabs defaultValue="vehiculos">
        <TabScroller>
          <TabsList variant="line" className="h-auto w-auto justify-start gap-1">
            {TABS.map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="flex-none shrink-0 px-3 py-2">
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </TabScroller>

        {TABS.map(({ value, Content }) => (
          <TabsContent key={value} value={value} className="pt-4">
            <Content />
          </TabsContent>
        ))}
      </Tabs>

      <SaveBar />
    </div>
  )
}
