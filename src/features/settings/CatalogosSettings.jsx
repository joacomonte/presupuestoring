import { createElement } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { VEHICLE_ICONS, getVehicleIcon } from '@/lib/vehicleIcons'
import { useStore } from '@/store/useStore'

function IconPicker({ value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          aria-label="Elegir icono"
        >
          {createElement(getVehicleIcon(value), { className: 'size-4' })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {Object.entries(VEHICLE_ICONS).map(([key, Icon]) => (
            <Button
              key={key}
              variant={key === value ? 'secondary' : 'ghost'}
              size="icon"
              className="size-9"
              onClick={() => onChange(key)}
              aria-label={`Icono ${key}`}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Bloque({ title, hint, children }) {
  return (
    <div>
      <div className="mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function FilaDelete({ onDelete }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={onDelete}
      aria-label="Eliminar"
    >
      <Trash2 className="size-4" />
    </Button>
  )
}

export function CatalogosSettings() {
  const tiposAuto = useStore((s) => s.tiposAuto)
  const addTipoAuto = useStore((s) => s.addTipoAuto)
  const updateTipoAuto = useStore((s) => s.updateTipoAuto)
  const removeTipoAuto = useStore((s) => s.removeTipoAuto)

  return (
    <div className="space-y-6">
      {/* Tipos de vehículos */}
      <Bloque
        title="Tipos de vehículos"
        hint="El multiplicador deriva precios de tipos sin valor explícito en la matriz."
      >
        <div className="space-y-2">
          {tiposAuto.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <IconPicker
                value={t.icono}
                onChange={(icono) => updateTipoAuto(t.id, { icono })}
              />
              <Input
                value={t.nombre}
                onChange={(e) => updateTipoAuto(t.id, { nombre: e.target.value })}
                placeholder="Nombre"
                className="flex-1"
              />
              <Input
                type="number"
                step="0.05"
                value={t.multiplicador}
                onChange={(e) =>
                  updateTipoAuto(t.id, { multiplicador: Number(e.target.value) || 0 })
                }
                className="w-20"
                aria-label="Multiplicador"
              />
              <FilaDelete onDelete={() => removeTipoAuto(t.id)} />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addTipoAuto('Nuevo tipo', 1)}
        >
          <Plus className="size-4" /> Agregar tipo
        </Button>
      </Bloque>
    </div>
  )
}
