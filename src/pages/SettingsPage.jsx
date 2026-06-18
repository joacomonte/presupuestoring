import { ArrowLeft, Boxes, Database, ListTree, Package, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SaveBar } from '@/components/SaveBar'
import { GeneralSettings } from '@/features/settings/GeneralSettings'
import { CatalogosSettings } from '@/features/settings/CatalogosSettings'
import { ProductosSettings } from '@/features/settings/ProductosSettings'
import { ItemsSettings } from '@/features/settings/ItemsSettings'
import { DataSettings } from '@/features/settings/DataSettings'

const TABS = [
  { value: 'general', icon: SlidersHorizontal, label: 'General', Content: GeneralSettings },
  { value: 'catalogos', icon: ListTree, label: 'Catálogos', Content: CatalogosSettings },
  { value: 'productos', icon: Package, label: 'Productos', Content: ProductosSettings },
  { value: 'items', icon: Boxes, label: 'Ítems', Content: ItemsSettings },
  { value: 'datos', icon: Database, label: 'Datos', Content: DataSettings },
]

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

      <Tabs defaultValue="general">
        <TabsList
          variant="line"
          className="-mx-4 h-auto w-auto justify-start gap-1 overflow-x-auto border-b px-4"
        >
          {TABS.map(({ value, icon: Icon, label }) => (
            <TabsTrigger key={value} value={value} className="flex-none shrink-0 px-3 py-2">
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

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
