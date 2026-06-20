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
  Layers,
  Gauge,
} from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { MoneyInput } from '@/components/MoneyInput'
import { MultiplicadorInput } from '@/components/MultiplicadorInput'
import { EjemplosDialog } from '@/components/EjemplosDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccount } from '@/store/useAccount'
import { listAccounts, createAccount, deleteAccount } from '@/lib/sync'
import { buildEmptyData } from '@/data/seed'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'

const STEPS = 6

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
const newCombo = () => ({ id: uid('paq'), nombre: '', itemIds: [] })
const newTipoTrabajo = () => ({ id: uid('tt'), nombre: '', multiplicador: 1 })

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
export function AccountGate({ children }) {
  const { user, setUser } = useAccount()
  const [accounts, setAccounts] = useState(null)
  const [error, setError] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Wizard
  const [creating, setCreating] = useState(false)
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState('')
  const [productos, setProductos] = useState([])
  const [servicios, setServicios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [combos, setCombos] = useState([])
  const [tiposTrabajo, setTiposTrabajo] = useState([])
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
    if (!user) load()
  }, [user])

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

  // Al entrar, remontamos el árbol (key=user) para que DbSync recargue esa cuenta.
  if (user) return <div key={user} className="contents">{children}</div>

  const openWizard = () => {
    setNombre('')
    setProductos([])
    setServicios([])
    setCategorias([])
    setCombos([])
    setTiposTrabajo([])
    setStep(1)
    setCreating(true)
  }

  const back = () => (step > 1 ? setStep((s) => s - 1) : setCreating(false))
  const next = () => setStep((s) => Math.min(STEPS, s + 1))

  // Carga los ejemplos de un rubro como demo, reemplazando lo cargado en ese paso.
  const usarEjemplos = (topic, items) => {
    if (topic === 'productos') {
      setProductos(items.map((n) => ({ ...newProducto(), nombre: n })))
    } else if (topic === 'servicios') {
      setServicios(items.map((t) => ({ ...newServicio(), titulo: t })))
    } else if (topic === 'categorias') {
      setCategorias(items.map((n) => ({ ...newCategoria(), nombre: n })))
    } else if (topic === 'paquetes') {
      setCombos(items.map((n) => ({ ...newCombo(), nombre: n })))
    } else if (topic === 'tipos-trabajo') {
      setTiposTrabajo(
        items.map((s) => {
          const [nom, mult] = s.split('×')
          return { ...newTipoTrabajo(), nombre: nom.trim(), multiplicador: Number(mult) || 1 }
        })
      )
    }
  }
  const usar = (topic) => (items) => usarEjemplos(topic, items)

  const hasProducto = productos.some((p) => p.nombre.trim())
  const hasServicio = servicios.some((s) => s.titulo.trim())
  const nextDisabled =
    (step === 1 && !nombre.trim()) ||
    (step === 2 && !hasProducto) ||
    (step === 3 && !hasServicio)

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
      const itemIdsValidos = new Set(items.map((it) => it.id))
      const paqs = combos
        .filter((c) => c.nombre.trim())
        .map((c) => ({
          id: c.id,
          nombre: c.nombre.trim(),
          itemIds: c.itemIds.filter((id) => itemIdsValidos.has(id)),
        }))
      const tdt = tiposTrabajo
        .filter((t) => t.nombre.trim())
        .map((t) => ({
          id: t.id,
          nombre: t.nombre.trim(),
          multiplicador: Number(t.multiplicador) || 1,
        }))
      const id = slugFor(nom)
      await createAccount(id, buildEmptyData(nom, prods, items, cats, paqs, tdt))
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

        {accounts === null && !error && (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-destructive">
            Hubo un problema con las cuentas. Reintentá más tarde.
          </p>
        )}

        {accounts && accounts.length > 0 && (
          <ul className="space-y-2">
            {accounts.map((a) => (
              <AccountRow
                key={a.user_id}
                account={a}
                deleting={deletingId === a.user_id}
                onSelect={() => setUser(a.user_id)}
                onDelete={() => deleteAccountNow(a)}
              />
            ))}
          </ul>
        )}

        {accounts && accounts.length > 0 && (
          <p className="text-center text-xs text-muted-foreground/70">
            Tocá para entrar · mantené presionado para eliminar
          </p>
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
              <section className="flex h-full w-full shrink-0 flex-col justify-center gap-6 overflow-y-auto px-5 py-4">
                <div className="space-y-3">
                  <AppLogo className="size-14" />
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-semibold tracking-tight">¿Cómo se llama tu negocio?</h2>
                    <p className="text-sm text-muted-foreground">
                      Es el nombre que va a figurar en tus presupuestos. En los próximos pasos
                      cargamos tus productos y servicios — todo lo podés cambiar después.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre-cuenta">Nombre del negocio</Label>
                  <Input
                    id="nombre-cuenta"
                    ref={nombreRef}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Servicios Montech"
                    className="h-12 text-base"
                  />
                </div>
              </section>

              {/* Paso 2: productos */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Package className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Tus productos</h2>
                  <p className="text-sm text-muted-foreground">
                    Son los insumos o materiales que usás y su costo: shampoo, tinta, harina,
                    repuestos, telas. Sirven para saber tu rentabilidad en cada servicio. Cargá al
                    menos uno para seguir (o cargá un ejemplo desde la lista).
                  </p>
                  <EjemplosDialog topic="productos" onUsar={usar('productos')} />
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

              {/* Paso 3: servicios */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wrench className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Tus servicios</h2>
                  <p className="text-sm text-muted-foreground">
                    Es lo que ofrecés y cobrás: "Limpieza básica", "Corte de pelo", "Sesión de
                    fotos", "Cambio de aceite", "Torta personalizada". Marcá qué productos consume
                    cada uno para calcular su costo. Cargá al menos uno para seguir (o cargá un
                    ejemplo desde la lista).
                  </p>
                  <EjemplosDialog topic="servicios" onUsar={usar('servicios')} />
                </div>

                <div className="space-y-3">
                  {servicios.map((s, i) => {
                    const conNombre = productos.filter((p) => p.nombre.trim())
                    return (
                      <div key={s.id} className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center gap-2">
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

                        {conNombre.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              Productos utilizados en este servicio
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {conNombre.map((p) => {
                                const on = s.productoIds.includes(p.id)
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() =>
                                      setServicios((list) =>
                                        list.map((x) =>
                                          x.id === s.id
                                            ? {
                                                ...x,
                                                productoIds: on
                                                  ? x.productoIds.filter((id) => id !== p.id)
                                                  : [...x.productoIds, p.id],
                                              }
                                            : x
                                        )
                                      )
                                    }
                                    className={cn(
                                      'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
                                      on
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-background text-foreground hover:bg-accent'
                                    )}
                                  >
                                    {on && <Check className="size-3.5" />}
                                    {p.nombre.trim()}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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

              {/* Paso 4: categorías */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FolderTree className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Categorías</h2>
                  <p className="text-sm text-muted-foreground">
                    Son las secciones en las que se va a dividir el presupuesto. Agrupan tus
                    servicios para que el cliente lo lea ordenado: un detallador usa "Lavado" o
                    "Interior", un gasista "Materiales" o "Mano de obra", una diseñadora "Diseño" o
                    "Impresión". Creá las tuyas y asigná abajo los servicios que hiciste.
                  </p>
                  <EjemplosDialog topic="categorias" onUsar={usar('categorias')} />
                </div>

                <div className="space-y-2">
                  {categorias.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Input
                        aria-label={`Nombre de la categoría ${i + 1}`}
                        value={c.nombre}
                        onChange={(e) =>
                          setCategorias((list) =>
                            list.map((x) => (x.id === c.id ? { ...x, nombre: e.target.value } : x))
                          )
                        }
                        placeholder={`Categoría ${i + 1}`}
                        className="h-11 flex-1 text-base"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Quitar categoría ${i + 1}`}
                        onClick={() => {
                          setCategorias((list) => list.filter((x) => x.id !== c.id))
                          setServicios((list) =>
                            list.map((s) => (s.categoriaId === c.id ? { ...s, categoriaId: null } : s))
                          )
                        }}
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
                  Agregar categoría
                </Button>

                {/* Asignación de servicios a cada categoría */}
                {(() => {
                  const cats = categorias.filter((c) => c.nombre.trim())
                  const servs = servicios.filter((s) => s.titulo.trim())
                  if (!cats.length || !servs.length) return null
                  const setCat = (servId, catId) =>
                    setServicios((list) =>
                      list.map((s) =>
                        s.id === servId
                          ? { ...s, categoriaId: s.categoriaId === catId ? null : catId }
                          : s
                      )
                    )
                  return (
                    <div className="space-y-4 border-t pt-4">
                      <p className="text-sm font-medium">Asigná tus servicios</p>
                      {cats.map((c) => (
                        <div key={c.id} className="space-y-1.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            {c.nombre.trim()}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {servs.map((s) => {
                              const on = s.categoriaId === c.id
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => setCat(s.id, c.id)}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
                                    on
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'bg-background text-foreground hover:bg-accent'
                                  )}
                                >
                                  {on && <Check className="size-3.5" />}
                                  {s.titulo.trim()}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </section>

              {/* Paso 5: combos / paquetes */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Combos</h2>
                  <p className="text-sm text-muted-foreground">
                    Agrupá servicios que solés vender juntos para precargarlos de un toque al armar
                    un presupuesto. Es opcional: si no creás ninguno, no pasa nada.
                  </p>
                  <EjemplosDialog topic="paquetes" onUsar={usar('paquetes')} />
                </div>

                <div className="space-y-3">
                  {combos.map((c, i) => {
                    const servs = servicios.filter((s) => s.titulo.trim())
                    return (
                      <div key={c.id} className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            aria-label={`Nombre del combo ${i + 1}`}
                            value={c.nombre}
                            onChange={(e) =>
                              setCombos((list) =>
                                list.map((x) => (x.id === c.id ? { ...x, nombre: e.target.value } : x))
                              )
                            }
                            placeholder={`Combo ${i + 1}`}
                            className="h-11 flex-1 text-base"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={`Quitar combo ${i + 1}`}
                            onClick={() => setCombos((list) => list.filter((x) => x.id !== c.id))}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </div>

                        {servs.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              Servicios incluidos en este combo
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {servs.map((s) => {
                                const on = c.itemIds.includes(s.id)
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() =>
                                      setCombos((list) =>
                                        list.map((x) =>
                                          x.id === c.id
                                            ? {
                                                ...x,
                                                itemIds: on
                                                  ? x.itemIds.filter((id) => id !== s.id)
                                                  : [...x.itemIds, s.id],
                                              }
                                            : x
                                        )
                                      )
                                    }
                                    className={cn(
                                      'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
                                      on
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-background text-foreground hover:bg-accent'
                                    )}
                                  >
                                    {on && <Check className="size-3.5" />}
                                    {s.titulo.trim()}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2"
                  id="btn-agregar-combo"
                  onClick={() => setCombos((l) => [...l, newCombo()])}
                >
                  <Plus className="size-4" />
                  Agregar combo
                </Button>
              </section>

              {/* Paso 6: tipos de trabajo (multiplicador) */}
              <section className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto px-5 py-6">
                <div className="space-y-2">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Gauge className="size-6" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">Tipo de trabajo</h2>
                  <p className="text-sm text-muted-foreground">
                    Multiplican el total del presupuesto según el tamaño o la complejidad (auto
                    chico, SUV, casa…). Es opcional: si no creás ninguno, el presupuesto no muestra
                    este paso.
                  </p>
                  <EjemplosDialog topic="tipos-trabajo" onUsar={usar('tipos-trabajo')} />
                </div>

                <div className="space-y-3">
                  {tiposTrabajo.map((t, i) => (
                    <div key={t.id} className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`Nombre del tipo de trabajo ${i + 1}`}
                          value={t.nombre}
                          onChange={(e) =>
                            setTiposTrabajo((list) =>
                              list.map((x) => (x.id === t.id ? { ...x, nombre: e.target.value } : x))
                            )
                          }
                          placeholder="Ej. SUV, Perro grande, Casa"
                          className="h-11 flex-1 text-base"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Quitar tipo de trabajo ${i + 1}`}
                          onClick={() =>
                            setTiposTrabajo((list) => list.filter((x) => x.id !== t.id))
                          }
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                      <MultiplicadorInput
                        value={t.multiplicador}
                        onChange={(multiplicador) =>
                          setTiposTrabajo((list) =>
                            list.map((x) => (x.id === t.id ? { ...x, multiplicador } : x))
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2"
                  id="btn-agregar-tipo-trabajo"
                  onClick={() => setTiposTrabajo((l) => [...l, newTipoTrabajo()])}
                >
                  <Plus className="size-4" />
                  Agregar tipo de trabajo
                </Button>
              </section>
            </div>
          </div>

          <footer
            className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            style={kbInset ? { paddingBottom: kbInset } : undefined}
          >
            {step < STEPS ? (
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
    </div>
  )
}
