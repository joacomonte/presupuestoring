import { useState } from 'react'
import { ArrowLeft, Package, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getVehicleIcon } from '@/lib/vehicleIcons'
import { materializeItem } from '@/lib/budget'
import { itemFinalARS } from '@/lib/calc'
import { formatARS } from '@/lib/format'

// Paso previo a la creación del presupuesto:
//  1. Nombre del cliente (para identificar el presupuesto).
//  2. Tipo de vehículo (define los precios de cada ítem).
//  3. Paquete predefinido (precarga ítems) o manual (arranca vacío).
export function CrearWizard({ tiposAuto, paquetes, paqueteDestacadoId, ctx, cotizacionUsd, onComplete }) {
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState('')
  const [tipoAutoId, setTipoAutoId] = useState(null)

  // Resumen del paquete para el tipo de auto elegido: ítems incluidos (títulos)
  // y costo estimado (suma del precio final con opciones por defecto).
  const resumenPaquete = (paq) => {
    const itemsCat = (paq.itemIds || [])
      .map((iid) => ctx.items.find((c) => c.id === iid))
      .filter(Boolean)
    const titulos = itemsCat.map((ci) => ci.titulo)
    const estimadoARS = itemsCat.reduce(
      (s, ci) => s + itemFinalARS(materializeItem(ci, tipoAutoId, ctx), cotizacionUsd),
      0
    )
    return { titulos, estimadoARS }
  }

  if (step === 1) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setStep(2)
        }}
      >
        <div>
          <h2 className="text-base font-semibold">¿Para quién es?</h2>
          <p className="text-sm text-muted-foreground">
            Nombre del cliente para identificar el presupuesto.
          </p>
        </div>
        <Input
          id="wiz-nombre"
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Juan Pérez"
        />
        <Button id="wiz-nombre-continuar" type="submit" className="w-full">
          Continuar
        </Button>
      </form>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep(1)}
            aria-label="Volver al paso anterior"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-base font-semibold">¿Qué tipo de vehículo es?</h2>
            <p className="text-sm text-muted-foreground">
              Define los precios de cada ítem.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiposAuto.map((t) => {
            const Icon = getVehicleIcon(t.icono)
            return (
              <button
                key={t.id}
                id={`wiz-tipo-${t.id}`}
                type="button"
                onClick={() => {
                  setTipoAutoId(t.id)
                  setStep(3)
                }}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 text-center shadow-sm transition hover:border-primary hover:bg-accent"
              >
                <Icon className="size-7 text-muted-foreground" />
                <span className="font-medium leading-tight">{t.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep(2)}
          aria-label="Volver al paso anterior"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-base font-semibold">¿Paquete o desde cero?</h2>
          <p className="text-sm text-muted-foreground">
            Elegí un combo predefinido o armalo manualmente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {paquetes.map((paq) => {
          const { titulos, estimadoARS } = resumenPaquete(paq)
          return (
            <button
              key={paq.id}
              id={`wiz-paq-${paq.id}`}
              type="button"
              onClick={() => onComplete(nombre, tipoAutoId, paq)}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-accent"
            >
              <Package className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 font-medium">{paq.nombre}</span>
                  {paq.id === paqueteDestacadoId && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Más vendido
                    </span>
                  )}
                </span>
                {titulos.length > 0 && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {titulos.join(' · ')}
                  </span>
                )}
                {estimadoARS > 0 && (
                  <span className="mt-1 block text-sm font-medium">
                    Estimado: {formatARS(estimadoARS)}
                  </span>
                )}
              </span>
            </button>
          )
        })}

        <button
          id="wiz-manual"
          type="button"
          onClick={() => onComplete(nombre, tipoAutoId, null)}
          className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-accent"
        >
          <PencilLine className="size-6 shrink-0 text-muted-foreground" />
          <span className="font-medium">Empezar desde cero (manual)</span>
        </button>
      </div>
    </div>
  )
}
