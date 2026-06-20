import { useState } from 'react'
import { ArrowLeft, Package, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { materializeItem } from '@/lib/budget'
import { itemFinalARS } from '@/lib/calc'
import { formatARS } from '@/lib/format'

// Paso previo a la creación del presupuesto:
//  1. Nombre del cliente.
//  2. Plantilla predefinida (precarga ítems) o manual (arranca vacío).
export function CrearWizard({
  plantillas,
  plantillaDestacadaId,
  ctx,
  cotizacionUsd,
  onComplete,
}) {
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState('')

  // Resumen de la plantilla: ítems incluidos y costo estimado.
  const resumenPlantilla = (plt) => {
    const itemsCat = (plt.itemIds || [])
      .map((iid) => ctx.items.find((c) => c.id === iid))
      .filter(Boolean)
    const titulos = itemsCat.map((ci) => ci.titulo)
    const estimadoARS = itemsCat.reduce(
      (s, ci) => s + itemFinalARS(materializeItem(ci, ctx), cotizacionUsd),
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">¿Plantilla o desde cero?</h2>
        <p className="text-sm text-muted-foreground">
          Elegí una plantilla predefinida o armalo manualmente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {plantillas.map((plt) => {
          const { titulos, estimadoARS } = resumenPlantilla(plt)
          return (
            <button
              key={plt.id}
              id={`wiz-plt-${plt.id}`}
              type="button"
              onClick={() => onComplete(nombre, plt)}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-accent"
            >
              <Package className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 font-medium">{plt.nombre}</span>
                  {plt.id === plantillaDestacadaId && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Más usada
                    </span>
                  )}
                </span>
                {plt.descripcion && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {plt.descripcion}
                  </span>
                )}
                {titulos.length > 0 && (
                  <span className="mt-0.5 block text-xs text-muted-foreground/80">
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
          onClick={() => onComplete(nombre, null)}
          className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-accent"
        >
          <PencilLine className="size-6 shrink-0 text-muted-foreground" />
          <span className="font-medium">Empezar desde cero (manual)</span>
        </button>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => setStep(1)}
        aria-label="Volver al paso anterior"
      >
        <ArrowLeft className="size-5" />
        Volver
      </Button>
    </div>
  )
}
