import { useState } from 'react'
import { Lightbulb, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Ejemplos de ayuda por tópico, pensados para distintos rubros (la app es genérica).
// Cada tópico tiene un título, una bajada y una lista de rubros con ejemplos concretos.
const EJEMPLOS = {
  'tipos-trabajo': {
    titulo: 'Tipos de trabajo',
    bajada:
      'Un tipo de trabajo multiplica el total del presupuesto. Sirve para cobrar más según el tamaño o la complejidad, sin recargar precios ítem por ítem. Es opcional: si no elegís ninguno, no multiplica nada.',
    rubros: [
      {
        nombre: 'Detailing de autos',
        items: ['Auto chico ×1.0', 'SUV ×1.5', 'Pickup grande ×2.0'],
      },
      {
        nombre: 'Peluquería canina',
        items: ['Perro chico ×1.0', 'Perro mediano ×1.4', 'Perro grande ×1.8'],
      },
      {
        nombre: 'Limpieza',
        items: ['Monoambiente ×1.0', '3 ambientes ×1.6', 'Casa ×2.5'],
      },
      {
        nombre: 'Fotografía / eventos',
        items: ['Media jornada ×1.0', 'Jornada completa ×1.8', 'Cobertura 2 días ×3.2'],
      },
    ],
  },
  servicios: {
    titulo: 'Servicios',
    bajada:
      'Cada servicio es algo que ofrecés, con su precio y, opcionalmente, los productos que usa y variantes (cantidades, opciones a elegir).',
    rubros: [
      {
        nombre: 'Detailing de autos',
        items: ['Lavado simple', 'Pulido de pintura', 'Cerámico 9H'],
      },
      {
        nombre: 'Peluquería canina',
        items: ['Baño y secado', 'Corte de raza', 'Corte de uñas'],
      },
      {
        nombre: 'Limpieza',
        items: ['Limpieza profunda de cocina', 'Lavado de alfombras', 'Vidrios en altura'],
      },
      {
        nombre: 'Jardinería',
        items: ['Corte de césped', 'Poda de árboles', 'Diseño de cantero'],
      },
    ],
  },
  categorias: {
    titulo: 'Categorías',
    bajada: 'Agrupan tus servicios para ordenarlos en el presupuesto.',
    rubros: [
      {
        nombre: 'Detailing de autos',
        items: ['Lavado exterior', 'Limpieza interior', 'Tratamientos'],
      },
      {
        nombre: 'Peluquería canina',
        items: ['Baño', 'Corte', 'Extras'],
      },
      {
        nombre: 'Limpieza',
        items: ['Ambientes', 'Cocina y baños', 'Trabajos especiales'],
      },
    ],
  },
  productos: {
    titulo: 'Productos / insumos',
    bajada:
      'Insumos con su costo interno. Se asocian a los servicios para calcular tu costo y ganancia; el cliente ve qué se aplicó.',
    rubros: [
      {
        nombre: 'Detailing de autos',
        items: ['Shampoo pH neutro', 'Cera líquida', 'Recubrimiento cerámico'],
      },
      {
        nombre: 'Peluquería canina',
        items: ['Shampoo hipoalergénico', 'Acondicionador', 'Perfume canino'],
      },
      {
        nombre: 'Limpieza',
        items: ['Detergente multiuso', 'Desinfectante', 'Bolsas de residuos'],
      },
    ],
  },
  paquetes: {
    titulo: 'Paquetes / combos',
    bajada:
      'Combos de servicios que se precargan juntos al crear un presupuesto. Sirven para ofrecer lo más vendido en un toque.',
    rubros: [
      {
        nombre: 'Detailing de autos',
        items: ['Full Detail', 'Lavado Premium', 'Puesta a punto interior'],
      },
      {
        nombre: 'Peluquería canina',
        items: ['Baño completo', 'Spa canino', 'Pack mensual'],
      },
      {
        nombre: 'Limpieza',
        items: ['Limpieza express', 'Limpieza profunda', 'Fin de obra'],
      },
    ],
  },
}

export function EjemplosDialog({
  topic,
  label = 'Ver ejemplos',
  variant = 'secondary',
  className,
  onUsar,
}) {
  const [open, setOpen] = useState(false)
  const data = EJEMPLOS[topic]
  if (!data) return null

  const usar = (items) => {
    onUsar?.(items)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          id={`ver-ejemplos-${topic}`}
          className={cn('w-full', className)}
        >
          <Lightbulb className="size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data.titulo} — ejemplos</DialogTitle>
          <DialogDescription>{data.bajada}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {data.rubros.map((r) => (
            <div key={r.nombre} className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {r.nombre}
              </div>
              <ul className="space-y-1 text-sm font-medium text-foreground">
                {r.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              {onUsar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-2"
                  onClick={() => usar(r.items)}
                >
                  <Plus className="size-4" />
                  Agregar estos como demo
                </Button>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" id={`cerrar-ejemplos-${topic}`} className="w-full" size="lg">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
