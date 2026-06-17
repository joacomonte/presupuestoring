import { ArrowLeft, Boxes, Database, ListTree, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/Section'
import { GeneralSettings } from '@/features/settings/GeneralSettings'
import { CatalogosSettings } from '@/features/settings/CatalogosSettings'
import { ItemsSettings } from '@/features/settings/ItemsSettings'
import { DataSettings } from '@/features/settings/DataSettings'

export function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-xl px-4 pb-12 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">Ajustes</h1>
      </div>

      <div className="space-y-3">
        <Section id="set-general" icon={SlidersHorizontal} title="General y datos del local" defaultOpen>
          <GeneralSettings />
        </Section>

        <Section
          id="set-catalogos"
          icon={ListTree}
          title="Catálogos (tipos, formas de pago, categorías, productos)"
          defaultOpen={false}
        >
          <CatalogosSettings />
        </Section>

        <Section
          id="set-items"
          icon={Boxes}
          title="Ítems de servicio y paquetes"
          defaultOpen={false}
        >
          <ItemsSettings />
        </Section>

        <Section
          id="set-data"
          icon={Database}
          title="Precios masivos, backup y reset"
          defaultOpen={false}
        >
          <DataSettings />
        </Section>
      </div>
    </div>
  )
}
