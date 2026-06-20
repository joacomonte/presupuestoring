import { useEffect, useRef, useState } from 'react'
import {
  Loader2,
  Plus,
  Building2,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Check,
  Package,
  FileText,
  Share2,
  Wrench,
  FolderTree,
  Sparkles,
  ChevronDown,
  Car,
  Dog,
  SprayCan,
  Trees,
  Camera,
} from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { MoneyInput } from '@/components/MoneyInput'
import { OnboardingPreview } from '@/components/OnboardingPreview'
import { OnboardingArrow } from '@/components/OnboardingArrow'
import { RUBROS } from '@/data/rubrosDemo'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAccount } from '@/store/useAccount'
import { listAccounts, createAccount, deleteAccount } from '@/lib/sync'
import { buildEmptyData } from '@/data/seed'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'

// Onboarding "preview-guiado": alterna pasos visuales (muestran un presupuesto de
// ejemplo resaltando la capa que se va a crear) con pasos de edición (listas planas).
//  1 nombre · 2 rubro (precarga demo o "de cero") · 3 preview-secciones
//  4 crear-secciones · 5 preview-servicios · 6 crear-servicios
//  7 preview-productos · 8 crear-productos
const STEPS = 8

// Icono por rubro para las cards del paso 2 (el catálogo vive en data/rubrosDemo).
const RUBRO_ICONS = {
  detailing: Car,
  'peluqueria-canina': Dog,
  limpieza: SprayCan,
  jardineria: Trees,
  fotografia: Camera,
}

// Slug válido para user_id (/^[a-z0-9_-]{1,64}$/). Agrega sufijo corto para evitar colisiones.
function slugFor(nombre) {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const suffix = uid().slice(0, 6).replace(/[^a-z0-9]/gi, '')
  return `${base || 'cuenta'}-${suffix}`
}

const newProducto = () => ({ id: uid('prod'), nombre: '', costo: { valor: 0, moneda: 'ARS' } })
const newServicio = () => ({ id: uid('item'), titulo: '', productoIds: [], categoriaId: null })
const newCategoria = () => ({ id: uid('cat'), nombre: '' })

// Fila de cuenta con hold-to-delete sobre la propia tarjeta: un tap rápido entra
// a la cuenta; al mantenerla presionada, la tarjeta se va llenando de destructivo
// de izquierda a derecha como una barra de carga y, al completar, borra. El hold
// es la confirmación deliberada (no hay diálogo extra).
const HOLD_MS = 1000
const TAP_MS = 220 // por debajo de esto, soltar cuenta como tap → entrar

function AccountRow({ account, onSelect, onDelete, deleting }) {
  const [progress, setProgress] = useState(0) // 0..1 del hold actual
  const raf = useRef(0)
  const start = useRef(0)
  const done = useRef(false)

  const begin = (e) => {
    e.preventDefault()
    if (deleting) return
    done.current = false
    start.current = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start.current) / HOLD_MS)
      setProgress(p)
      if (p >= 1) {
        raf.current = 0
        done.current = true
        setProgress(0)
        onDelete()
      } else {
        raf.current = requestAnimationFrame(tick)
      }
    }
    raf.current = requestAnimationFrame(tick)
  }

  const end = () => {
    if (!raf.current) return // ya completó (borró)
    cancelAnimationFrame(raf.current)
    raf.current = 0
    const tap = performance.now() - start.current < TAP_MS
    setProgress(0)
    if (tap && !done.current) onSelect()
  }

  // El contenido se renderiza dos veces, en idéntico layout: la capa base con su
  // color normal y, encima, una copia en blanco recortada al ancho del relleno.
  // Así el contraste sigue al borde de la barra píxel a píxel, sin saltos.
  const content = (white) => (
    <>
      {deleting ? (
        <Loader2 className={cn('size-6 shrink-0 animate-spin', white ? 'text-white' : 'text-muted-foreground')} />
      ) : (
        <Building2 className={cn('size-6 shrink-0', white ? 'text-white' : 'text-muted-foreground')} />
      )}
      <span className={cn('truncate text-left font-medium', white && 'text-white')}>
        {account.nombre || account.user_id}
      </span>
    </>
  )

  return (
    <li>
      <Button
        variant="outline"
        className="relative h-auto w-full touch-none select-none justify-start gap-3 overflow-hidden py-4 text-base disabled:opacity-100"
        id={`btn-cuenta-${account.user_id}`}
        disabled={deleting}
        onPointerDown={begin}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
      >
        {/* Relleno que crece de izquierda a derecha durante el hold */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-destructive"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Capa base (color normal) */}
        {content(false)}
        {/* Copia en blanco recortada al relleno: el texto sobre destructivo se ve blanco */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-start gap-3 overflow-hidden px-4 text-base"
          style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
        >
          {content(true)}
        </span>
      </Button>
    </li>
  )
}

// Pantalla de selección de cuenta (sin contraseña). Si no hay cuenta elegida,
// se muestra antes de cargar la app; al elegir/crear una, se entra a esa cuenta.
export function AccountGate() {
  const setUser = useAccount((s) => s.setUser)
  const [accounts, setAccounts] = useState(null)
  const [error, setError] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmAccount, setConfirmAccount] = useState(null) // cuenta pendiente de borrar

  // Wizard
  const [creating, setCreating] = useState(false)
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState('')
  const [productos, setProductos] = useState([])
  const [servicios, setServicios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [rubro, setRubro] = useState(null) // 'cero' | id de rubro | null (sin elegir)
  const [busy, setBusy] = useState(false)
  const [kbInset, setKbInset] = useState(0)
  const nombreRef = useRef(null)

  const load = () => {
    setError(false)
    setAccounts(null)
    listAccounts()
      .then(setAccounts)
      .catch(() => setError(true))
  }

  useEffect(() => {
    load()
  }, [])

  // En mobile el teclado se superpone sobre el footer (en iOS el viewport de layout
  // no se achica). Medimos el alto del teclado con visualViewport y lo agregamos como
  // padding inferior al footer, así el botón de continuar sube por encima del teclado
  // sin tocar el alto del wizard (que sigue siendo el de la pantalla completa).
  useEffect(() => {
    if (!creating) return
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      setKbInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      setKbInset(0)
    }
  }, [creating])

  useEffect(() => {
    if (creating && step === 1) {
      const t = setTimeout(() => nombreRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [creating, step])

  const openWizard = () => {
    setNombre('')
    setProductos([])
    setServicios([])
    setCategorias([])
    setRubro(null)
    setStep(1)
    setCreating(true)
  }

  const back = () => (step > 1 ? setStep((s) => s - 1) : setCreating(false))
  const next = () => setStep((s) => Math.min(STEPS, s + 1))

  // Paso 2: el rubro elegido precarga las tres listas (editables luego). "Empezar de
  // cero" deja todo vacío. En ambos casos se marca `rubro` para habilitar Siguiente.
  const elegirRubro = (r) => {
    setRubro(r.id)
    setCategorias(r.categorias.map((n) => ({ ...newCategoria(), nombre: n })))
    setServicios(r.servicios.map((t) => ({ ...newServicio(), titulo: t })))
    setProductos(r.productos.map((n) => ({ ...newProducto(), nombre: n })))
  }
  const empezarDeCero = () => {
    setRubro('cero')
    setCategorias([])
    setServicios([])
    setProductos([])
  }

  const hasCategoria = categorias.some((c) => c.nombre.trim())
  const hasServicio = servicios.some((s) => s.titulo.trim())
  // Preview del rubro elegido (undefined si "de cero" → el preview va borroneado).
  const rubroData = RUBROS.find((r) => r.id === rubro)
  // Obligatorios: elegir rubro/cero (2) y editar secciones (4) y servicios (6).
  // Los previews (3/5/7) y productos (8) se pueden saltar.
  const nextDisabled =
    (step === 1 && !nombre.trim()) ||
    (step === 2 && !rubro) ||
    (step === 4 && !hasCategoria) ||
    (step === 6 && !hasServicio)

  const crear = async () => {
    const nom = nombre.trim()
    if (!nom || busy) return
    setBusy(true)
    try {
      const prods = productos
        .filter((p) => p.nombre.trim())
        .map((p) => ({ id: p.id, nombre: p.nombre.trim(), marca: '', costo: p.costo }))
      const prodIds = new Set(prods.map((p) => p.id))
      const cats = categorias
        .filter((c) => c.nombre.trim())
        .map((c, idx) => ({ id: c.id, nombre: c.nombre.trim(), orden: idx + 1 }))
      const catIds = new Set(cats.map((c) => c.id))
      const items = servicios
        .filter((s) => s.titulo.trim())
        .map((s) => ({
          id: s.id,
          categoriaId: catIds.has(s.categoriaId) ? s.categoriaId : null,
          titulo: s.titulo.trim(),
          descripcion: '',
          precioVenta: { valor: 0, moneda: 'ARS' },
          productoIds: s.productoIds.filter((id) => prodIds.has(id)),
          manoObra: { valor: 0, moneda: 'ARS' },
          opciones: [],
        }))
      // El rubro elegido en el paso 2 solo precarga el catálogo (secciones/
      // servicios/productos); las plantillas van vacías y se configuran luego
      // dentro de la app.
      const id = slugFor(nom)
      await createAccount(id, buildEmptyData(nom, prods, items, cats, []))
      setUser(id)
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  const deleteAccountNow = async (a) => {
    if (deletingId) return
    setDeletingId(a.user_id)
    try {
      await deleteAccount(a.user_id)
      load()
    } catch {
      setError(true)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm space-y-5 rounded-xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo className="size-20" />
          <h1 className="text-xl font-semibold tracking-tight">Presupuestoring</h1>
          <p className="text-sm text-muted-foreground">
            Armá presupuestos profesionales para tu negocio y compartilos con tus clientes en
            minutos.
          </p>
        </div>

        <ul className="space-y-2.5">
          {[
            { icon: Package, text: 'Cargá tus productos y servicios' },
            { icon: FileText, text: 'Armá presupuestos en minutos' },
            { icon: Share2, text: 'Compartilos con tus clientes' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-[1.15rem]" />
              </span>
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-center text-sm text-destructive">
            Hubo un problema con las cuentas. Reintentá más tarde.
          </p>
        )}

        {/* Mientras carga (accounts === null) ya mostramos el toggle: la lista carga
            en background y el spinner solo aparece al expandir. */}
        {!error && (accounts === null || accounts.length > 0) && (
          <Collapsible className="space-y-2">
            <CollapsibleTrigger
              id="btn-ver-negocios"
              className="group flex w-full items-center justify-center gap-1.5 py-1 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-muted-foreground"
            >
              Ya tengo un negocio
              <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {accounts === null ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {accounts.map((a) => (
                      <AccountRow
                        key={a.user_id}
                        account={a}
                        deleting={deletingId === a.user_id}
                        onSelect={() => setUser(a.user_id)}
                        onDelete={() => setConfirmAccount(a)}
                      />
                    ))}
                  </ul>
                  <p className="text-center text-xs text-muted-foreground/70">
                    Tocá para entrar · mantené presionado para eliminar
                  </p>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {accounts && accounts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Todavía no hay cuentas. Creá la primera.
          </p>
        )}

        <Button className="h-auto w-full gap-2 py-4 text-base" id="btn-nueva-cuenta" onClick={openWizard}>
          <Plus className="size-5" />
          Empezar de cero
        </Button>
      </div>

      {/* Wizard de alta: ocupa toda la pantalla y entra deslizando desde la derecha. */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background transition-transform duration-300 ease-out',
          creating ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        )}
        aria-hidden={!creating}
      >
        <div className="mx-auto flex h-svh w-full max-w-md flex-col">
          <header className="flex items-center gap-2 px-5 pt-5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              id="btn-volver-cuenta"
              disabled={busy}
              onClick={back}
              aria-label={step === 1 ? 'Cancelar' : 'Paso anterior'}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex flex-1 items-center gap-1.5" aria-label={`Paso ${step} de ${STEPS}`}>
              {Array.from({ length: STEPS }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i < step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {step}/{STEPS}
            </span>
          </header>

          {/* Track horizontal: cada paso ocupa el ancho completo. */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
            >
              {/* Paso 1: nombre */}
              <section className="flex h-full w-full shrink-0 flex-col justify-center gap-10 overflow-y-auto px-6 py-8">
                <div className="flex flex-col items-center gap-5 text-center">
                  <span className="flex size-24 items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/15">
                    <AppLogo className="size-16" />
                  </span>
                  <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-wide text-primary">Empecemos</p>
                    <h2 className="text-3xl font-semibold leading-tight tracking-tight">
                      ¿Cómo se llama tu negocio?
                    </h2>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre-cuenta" className="sr-only">
                    Nombre del negocio
                  </Label>
                  <Input
                    id="nombre-cuenta"
                    ref={nombreRef}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Servicios Montech"
                    className="h-14 rounded-xl text-center text-lg font-medium shadow-sm"
                  />
                  <Button
                    type="button"
                    id="btn-siguiente-cuenta-paso1"
                    disabled={nextDisabled}
                    className="h-12 w-full gap-2 text-base"
                    onClick={next}
                  >
                    Siguiente
                    <ArrowRight className="size-5" />
                  </Button>
                </div>
              </section>

              {/* Paso 2: elegir rubro (precarga demo) o empezar de cero */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">¿Arrancamos con un ejemplo?</h2>
                  <p className="text-base text-foreground">
                    Elegí un rubro parecido al tuyo y te precargamos todo de ejemplo. Después lo
                    editás.
                  </p>
                </div>

                {/* Empezar de cero: botón grande arriba de la lista */}
                <button
                  type="button"
                  id="btn-rubro-cero"
                  onClick={empezarDeCero}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                    rubro === 'cero'
                      ? 'border-primary bg-primary/5'
                      : 'border-dashed hover:bg-muted/50'
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Plus className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Crear todo de cero</span>
                    <span className="block text-xs text-muted-foreground">
                      Armá tus secciones, servicios y productos a mano.
                    </span>
                  </span>
                  {rubro === 'cero' && <Check className="size-5 shrink-0 text-primary" />}
                </button>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  o usá un ejemplo
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-2">
                  {RUBROS.map((r) => {
                    const Icon = RUBRO_ICONS[r.id]
                    const selected = rubro === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        id={`btn-rubro-${r.id}`}
                        onClick={() => elegirRubro(r)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                          selected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                          {Icon && <Icon className="size-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{r.nombre}</span>
                          <span className="block text-xs text-muted-foreground">
                            {r.categorias.length} secciones · {r.servicios.length} servicios ·{' '}
                            {r.productos.length} productos
                          </span>
                        </span>
                        {selected && <Check className="size-5 shrink-0 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Paso 3: preview — secciones */}
              <section className="flex h-full w-full shrink-0 flex-col overflow-y-auto px-5 py-6">
                <div className="relative flex flex-col gap-5">
                  <div className="space-y-2">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FolderTree className="size-6" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">Así se ve un presupuesto</h2>
                    <p className="text-base text-foreground">
                      Esto es lo que recibe tu cliente. Se divide en{' '}
                      <strong id="kw-secciones" className="font-semibold">secciones</strong>, los
                      bloques marcados acá. En el próximo paso las creás.
                    </p>
                  </div>
                  <OnboardingPreview
                    nombre={nombre}
                    highlight="secciones"
                    data={rubroData?.preview}
                    total={rubroData?.total}
                    blur={rubro === 'cero'}
                    targetId="tgt-secciones"
                  />
                  <OnboardingArrow fromId="kw-secciones" toId="tgt-secciones" deps={`${rubro}-${step}`} />
                </div>
              </section>

              {/* Paso 4: crear secciones (lista plana) */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FolderTree className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Creá tus secciones</h2>
                  <p className="text-base text-foreground">
                    Los bloques en que se divide el presupuesto: "Lavado", "Materiales", "Diseño".
                    Creá al menos una.
                  </p>
                </div>

                <div className="space-y-2">
                  {categorias.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Input
                        aria-label={`Nombre de la sección ${i + 1}`}
                        value={c.nombre}
                        onChange={(e) =>
                          setCategorias((list) =>
                            list.map((x) => (x.id === c.id ? { ...x, nombre: e.target.value } : x))
                          )
                        }
                        placeholder={`Sección ${i + 1}`}
                        className="h-11 flex-1 text-base"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar sección ${i + 1}`}
                        onClick={() => setCategorias((list) => list.filter((x) => x.id !== c.id))}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2"
                  id="btn-agregar-categoria"
                  onClick={() => setCategorias((l) => [...l, newCategoria()])}
                >
                  <Plus className="size-4" />
                  Agregar sección
                </Button>
              </section>

              {/* Paso 5: preview — servicios */}
              <section className="flex h-full w-full shrink-0 flex-col overflow-y-auto px-5 py-6">
                <div className="relative flex flex-col gap-5">
                  <div className="space-y-2">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Wrench className="size-6" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">Ahora, los servicios</h2>
                    <p className="text-base text-foreground">
                      Dentro de cada sección van los{' '}
                      <strong id="kw-servicios" className="font-semibold">servicios</strong>: lo que
                      ofrecés y cobrás. En el próximo paso los creás.
                    </p>
                  </div>
                  <OnboardingPreview
                    nombre={nombre}
                    highlight="servicios"
                    data={rubroData?.preview}
                    total={rubroData?.total}
                    blur={rubro === 'cero'}
                    targetId="tgt-servicios"
                  />
                  <OnboardingArrow fromId="kw-servicios" toId="tgt-servicios" deps={`${rubro}-${step}`} />
                </div>
              </section>

              {/* Paso 6: crear servicios (lista plana) */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wrench className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Creá tus servicios</h2>
                  <p className="text-base text-foreground">
                    Lo que ofrecés y cobrás: "Lavado simple", "Corte de pelo", "Cambio de aceite".
                    Creá al menos uno.
                  </p>
                </div>

                <div className="space-y-2">
                  {servicios.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <Input
                        aria-label={`Nombre del servicio ${i + 1}`}
                        value={s.titulo}
                        onChange={(e) =>
                          setServicios((list) =>
                            list.map((x) => (x.id === s.id ? { ...x, titulo: e.target.value } : x))
                          )
                        }
                        placeholder={`Servicio ${i + 1}`}
                        className="h-11 flex-1 text-base"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar servicio ${i + 1}`}
                        onClick={() => setServicios((list) => list.filter((x) => x.id !== s.id))}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2"
                  id="btn-agregar-servicio"
                  onClick={() => setServicios((l) => [...l, newServicio()])}
                >
                  <Plus className="size-4" />
                  Agregar servicio
                </Button>
              </section>

              {/* Paso 7: preview — productos */}
              <section className="flex h-full w-full shrink-0 flex-col overflow-y-auto px-5 py-6">
                <div className="relative flex flex-col gap-5">
                  <div className="space-y-2">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Package className="size-6" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">Por último, los productos</h2>
                    <p className="text-base text-foreground">
                      Cada servicio puede usar{' '}
                      <strong id="kw-productos" className="font-semibold">productos</strong>: los
                      insumos con su costo, para saber tu rentabilidad. En el próximo paso los creás.
                    </p>
                  </div>
                  <OnboardingPreview
                    nombre={nombre}
                    highlight="productos"
                    data={rubroData?.preview}
                    total={rubroData?.total}
                    blur={rubro === 'cero'}
                    targetId="tgt-productos"
                  />
                  <OnboardingArrow fromId="kw-productos" toId="tgt-productos" deps={`${rubro}-${step}`} />
                </div>
              </section>

              {/* Paso 8: crear productos (lista plana, con costo) */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Package className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Creá tus productos</h2>
                  <p className="text-base text-foreground">
                    Los insumos o materiales que usás y <strong>cuánto te cuestan</strong> (no el
                    precio de venta): shampoo, tinta, repuestos.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estos costos son solo para tu análisis interno de rentabilidad: no se muestran
                    en el presupuesto. El monto es opcional, lo podés cargar después.
                  </p>
                </div>

                <div className="space-y-3">
                  {productos.map((p, i) => (
                    <div key={p.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`Nombre del producto ${i + 1}`}
                          value={p.nombre}
                          onChange={(e) =>
                            setProductos((list) =>
                              list.map((x) => (x.id === p.id ? { ...x, nombre: e.target.value } : x))
                            )
                          }
                          placeholder={`Producto ${i + 1}`}
                          className="h-11 flex-1 text-base"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Quitar producto ${i + 1}`}
                          onClick={() => setProductos((list) => list.filter((x) => x.id !== p.id))}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                      <MoneyInput
                        value={p.costo}
                        onChange={(costo) =>
                          setProductos((list) =>
                            list.map((x) => (x.id === p.id ? { ...x, costo } : x))
                          )
                        }
                        className="h-11"
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2"
                  id="btn-agregar-producto"
                  onClick={() => setProductos((l) => [...l, newProducto()])}
                >
                  <Plus className="size-4" />
                  Agregar producto
                </Button>
              </section>
            </div>
          </div>

          <footer
            className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            style={kbInset ? { paddingBottom: kbInset } : undefined}
          >
            {step === 1 ? null : step < STEPS ? (
              <Button
                type="button"
                id="btn-siguiente-cuenta"
                disabled={nextDisabled}
                className="h-12 w-full gap-2 text-base"
                onClick={next}
              >
                Siguiente
                <ArrowRight className="size-5" />
              </Button>
            ) : (
              <Button
                type="button"
                id="btn-crear-cuenta"
                disabled={!nombre.trim() || busy}
                className="h-12 w-full gap-2 text-base"
                onClick={crear}
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                Crear y entrar
              </Button>
            )}
          </footer>
        </div>
      </div>

      {/* Confirmación de borrado: el hold "arma" la acción y este diálogo la confirma. */}
      <AlertDialog
        open={!!confirmAccount}
        onOpenChange={(open) => !open && setConfirmAccount(null)}
      >
        <AlertDialogContent id="dialog-borrar-cuenta">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar la cuenta {confirmAccount?.nombre || confirmAccount?.user_id}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se borran todos sus datos (presupuestos, productos y ajustes). Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id="btn-cancelar-borrar">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirmar-borrar"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const a = confirmAccount
                setConfirmAccount(null)
                if (a) deleteAccountNow(a)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
