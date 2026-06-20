import { useState } from 'react'
import { ArrowLeft, Package, PencilLine, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { materializeItem } from '@/lib/budget'
import { itemFinalARS } from '@/lib/calc'
import { formatARS } from '@/lib/format'
import { explicarMultiplicador } from '@/components/MultiplicadorInput'

// Paso previo a la creación del presupuesto:
//  1. Nombre del cliente.
//  2. Tipo de trabajo (multiplica el total) — opcional, solo si hay tipos definidos.
//  3. Paquete predefinido (precarga ítems) o manual (arranca vacío).
export function CrearWizard({
  tiposTrabajo,
  paquetes,
  paqueteDestacadoId,
  ctx,
  cotizacionUsd,
  onComplete,
}) {
  const usaTipoTrabajo = (tiposTrabajo || []).length > 0
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState('')
  const [tipoTrabajo, setTipoTrabajo] = useState(null)

  // Paso final (paquete) es 2 si no hay tipos de trabajo, 3 si los hay.
  const stepPaquete = usaTipoTrabajo ? 3 : 2

  // Resumen del paquete: ítems incluidos y costo estimado (con el multiplicador elegido).
  const resumenPaquete = (paq) => {
    const itemsCat = (paq.itemIds || [])
      .map((iid) => ctx.items.find((c) => c.id === iid))
      .filter(Boolean)
    const titulos = itemsCat.map((ci) => ci.titulo)
    const mult = Number(tipoTrabajo?.multiplicador) || 1
    const estimadoARS =
      itemsCat.reduce((s, ci) => s + itemFinalARS(materializeItem(ci, ctx), cotizacionUsd), 0) *
      mult
    return { titulos, estimadoARS }
  }

  if (step === 1) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setStep(usaTipoTrabajo ? 2 : stepPaquete)
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

  if (usaTipoTrabajo && step === 2) {
    const elegir = (tt) => {
      setTipoTrabajo(tt)
      setStep(stepPaquete)
    }
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">¿Qué tipo de trabajo es?</h2>
          <p className="text-sm text-muted-foreground">
            Multiplica el total. Es opcional: podés no incluirlo.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            id="wiz-tt-ninguno"
            onClick={() => elegir(null)}
            className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-accent"
          >
            <span className="font-medium">No incluir</span>
          </button>
          {tiposTrabajo.map((t) => (
            <button
              key={t.id}
              id={`wiz-tt-${t.id}`}
              type="button"
              onClick={() => elegir({ id: t.id, nombre: t.nombre, multiplicador: t.multiplicador })}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary hover:bg-accent"
            >
              <Gauge className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-tight">{t.nombre}</span>
                <span className="block text-xs text-muted-foreground">
                  {Number(t.multiplicador)}× · {explicarMultiplicador(t.multiplicador)}
                </span>
              </span>
            </button>
          ))}
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">¿Paquete o desde cero?</h2>
        <p className="text-sm text-muted-foreground">
          Elegí un combo predefinido o armalo manualmente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {paquetes.map((paq) => {
          const { titulos, estimadoARS } = resumenPaquete(paq)
          return (
            <button
              key={paq.id}
              id={`wiz-paq-${paq.id}`}
              type="button"
              onClick={() => onComplete(nombre, tipoTrabajo, paq)}
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
          onClick={() => onComplete(nombre, tipoTrabajo, null)}
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
        onClick={() => setStep(usaTipoTrabajo ? 2 : 1)}
        aria-label="Volver al paso anterior"
      >
        <ArrowLeft className="size-5" />
        Volver
      </Button>
    </div>
  )
}
