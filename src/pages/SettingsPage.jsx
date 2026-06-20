import { useEffect, useRef, useState } from 'react'
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Layers,
  Tags,
  Package,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SaveBar } from '@/components/SaveBar'
import { EjemplosDialog } from '@/components/EjemplosDialog'
import { GeneralSettings } from '@/features/settings/GeneralSettings'
import { ProductosSettings } from '@/features/settings/ProductosSettings'
import { SeccionesSettings } from '@/features/settings/SeccionesSettings'
import { ServiciosSettings } from '@/features/settings/ServiciosSettings'
import { PlantillasSettings } from '@/features/settings/PlantillasSettings'
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
  {
    value: 'plantillas',
    icon: Layers,
    label: 'Plantillas',
    desc: 'Presupuestos preconfigurados: definí qué secciones y servicios se cargan juntos al crear un presupuesto. Marcá una como Default para que aparezca elegida por defecto.',
    topic: 'plantillas',
    Content: PlantillasSettings,
  },
  {
    value: 'secciones',
    icon: Tags,
    label: 'Secciones',
    desc: 'Agrupan tus servicios para ordenarlos en el catálogo y en el presupuesto. Arrastrá para cambiar el orden; debajo de cada sección ves los servicios vinculados.',
    topic: 'secciones',
    Content: SeccionesSettings,
  },
  {
    value: 'servicios',
    icon: Boxes,
    label: 'Servicios',
    desc: 'Tu catálogo de servicios con su precio. Asigná cada uno a una sección y sumale los productos y variantes que correspondan.',
    topic: 'servicios',
    Content: ServiciosSettings,
  },
  {
    value: 'productos',
    icon: Package,
    label: 'Productos',
    desc: 'Insumos con su costo interno. Se asocian a los servicios para calcular tu costo y se listan en el presupuesto para que el cliente sepa qué se aplicó.',
    topic: 'productos',
    Content: ProductosSettings,
  },
  {
    value: 'otros',
    icon: SlidersHorizontal,
    label: 'Otros',
    desc: 'Ajustes generales: IVA, formas de pago, datos de tu local y manejo de la información guardada.',
    Content: OtrosSettings,
  },
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
      <div className="relative mb-3 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/')}
          aria-label="Volver a presupuestos"
        >
          <ChevronLeft className="size-4" />
          Volver
        </Button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Configuraciones
        </h1>
      </div>

      <Tabs defaultValue="plantillas">
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

        {TABS.map(({ value, desc, topic, Content }) => (
          <TabsContent key={value} value={value} className="pt-4">
            {desc && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">{desc}</p>
                {topic && (
                  <EjemplosDialog
                    topic={topic}
                    label="Ver más ejemplos"
                    variant="link"
                    className="h-auto p-0 text-xs text-primary"
                  />
                )}
              </div>
            )}
            <Content />
          </TabsContent>
        ))}
      </Tabs>

      <SaveBar />
    </div>
  )
}
