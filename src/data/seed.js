// Datos de ejemplo (seed) — PRD §10. Se cargan en localStorage al primer arranque.
import { IVA_DEFAULT } from '@/lib/calc'

export const SEED_VERSION = 3
export const STORAGE_KEY = 'presupuestoring'

// Helpers de moneda / delta
const mARS = (valor) => ({ valor, moneda: 'ARS' })
const mUSD = (valor) => ({ valor, moneda: 'USD' })
const dMonto = (money) => ({ modo: 'monto', monto: money })
const dPct = (pct) => ({ modo: 'pct', pct })

// Estado inicial de una cuenta nueva: vacío salvo lo que el usuario haya cargado
// en el alta (productos, servicios, secciones y plantillas).
export function buildEmptyData(
  nombre,
  productos = [],
  items = [],
  categorias = [],
  plantillas = []
) {
  return {
    seedVersion: SEED_VERSION,
    config: {
      cotizacionUsd: 1200,
      ivaPct: IVA_DEFAULT,
      plantillaDestacadaId: null,
      formaPagoDefaultId: null,
    },
    local: { nombre, telefono: '', direccion: '', email: '', logo: null },
    formasPago: [],
    categorias,
    productos,
    items,
    plantillas,
    presupuestos: [],
    nextNro: 1,
  }
}

// Normaliza datos de versiones viejas al modelo actual:
//  - matriz de precios por tipo de auto → precio único por ítem
//  - "paquetes" → "plantillas"; elimina "tipos de trabajo" (feature retirada).
export function migrateData(data) {
  if (!data || typeof data !== 'object') return data
  const out = { ...data }

  if (Array.isArray(out.items)) {
    out.items = out.items.map((it) => {
      if (it.precioVenta || !it.precios) return it
      const { precios, ...rest } = it
      // Toma el precio "base" (mediano / ×1) o el primero disponible.
      const base =
        precios.mediano || Object.values(precios).find(Boolean) || { valor: 0, moneda: 'ARS' }
      return { ...rest, precioVenta: { ...base } }
    })
  }

  // paquetes → plantillas
  if (out.plantillas == null && Array.isArray(out.paquetes)) out.plantillas = out.paquetes
  delete out.paquetes
  if (out.config && typeof out.config === 'object') {
    if (out.config.plantillaDestacadaId == null && out.config.paqueteDestacadoId != null) {
      out.config.plantillaDestacadaId = out.config.paqueteDestacadoId
    }
    delete out.config.paqueteDestacadoId
  }

  // Tipos de trabajo: feature retirada.
  delete out.tiposTrabajo
  delete out.tiposAuto

  return out
}

export function buildSeed() {
  const config = {
    cotizacionUsd: 1200,
    ivaPct: IVA_DEFAULT,
    plantillaDestacadaId: 'lavado-premium',
    formaPagoDefaultId: null,
  }

  const local = {
    nombre: 'Blaster Detailing',
    telefono: '+54 9 11 5555-1234',
    direccion: 'Av. Siempreviva 1234, CABA',
    email: '',
    logo: null,
  }

  const formasPago = [
    { id: 'efectivo', nombre: 'Efectivo' },
    { id: 'transferencia', nombre: 'Transferencia' },
    { id: 'debito', nombre: 'Tarjeta de débito' },
    { id: 'credito', nombre: 'Tarjeta de crédito' },
    { id: 'cripto', nombre: 'USDT/cripto' },
  ]

  const categorias = [
    { id: 'lavado-exterior', nombre: 'Lavado exterior', orden: 1 },
    { id: 'limpieza-interior', nombre: 'Limpieza interior', orden: 2 },
    { id: 'limpieza-motor', nombre: 'Limpieza de motor', orden: 3 },
    { id: 'detailing', nombre: 'Detailing', orden: 4 },
    { id: 'tratamientos', nombre: 'Tratamientos', orden: 5 },
    { id: 'extras', nombre: 'Extras', orden: 6 },
  ]

  const productos = [
    { id: 'shampoo-ph', nombre: 'Shampoo pH neutro', marca: 'Sonax', costo: mARS(4500) },
    { id: 'cera-liquida', nombre: 'Cera líquida', marca: "Meguiar's", costo: mARS(9800) },
    { id: 'clay-bar', nombre: 'Clay bar (barra descontaminante)', marca: '3M', costo: mARS(7200) },
    { id: 'sellador-sintetico', nombre: 'Sellador sintético', marca: 'Soft99', costo: mARS(12500) },
    { id: 'ceramico-9h', nombre: 'Recubrimiento cerámico 9H', marca: 'Gyeon', costo: mARS(38000) },
    { id: 'apc', nombre: 'APC (limpiador multipropósito)', marca: 'Koch Chemie', costo: mARS(6300) },
    { id: 'acond-cuero', nombre: 'Acondicionador de cuero', marca: 'CarPro', costo: mARS(11000) },
    { id: 'renovador-plasticos', nombre: 'Renovador de plásticos', marca: 'Sonax', costo: mARS(5400) },
    { id: 'desengrasante-motor', nombre: 'Desengrasante de motor', marca: '3M', costo: mARS(5900) },
    { id: 'pasta-pulido', nombre: 'Pasta de pulido', marca: 'Menzerna', costo: mARS(14700) },
    { id: 'microfibras', nombre: 'Microfibras (pack)', marca: 'genérico', costo: mARS(3800) },
  ]

  const items = [
    // Lavado exterior
    {
      id: 'lavado-simple',
      categoriaId: 'lavado-exterior',
      titulo: 'Lavado simple',
      descripcion: 'Prelavado, shampoo, secado con microfibra.',
      precioVenta: mARS(18000),
      productoIds: ['shampoo-ph', 'microfibras'],
      manoObra: mARS(6000),
      opciones: [],
    },
    {
      id: 'lavado-encerado',
      categoriaId: 'lavado-exterior',
      titulo: 'Lavado + encerado',
      descripcion: 'Lavado completo + aplicación de cera de protección.',
      precioVenta: mARS(28000),
      productoIds: ['shampoo-ph', 'cera-liquida', 'microfibras'],
      manoObra: mARS(9000),
      opciones: [],
    },
    // Limpieza interior
    {
      id: 'interior-basico',
      categoriaId: 'limpieza-interior',
      titulo: 'Interior básico',
      descripcion: 'Aspirado, limpieza de plásticos y tableros.',
      precioVenta: mARS(22000),
      productoIds: ['apc', 'renovador-plasticos', 'microfibras'],
      manoObra: mARS(8000),
      opciones: [],
    },
    {
      id: 'interior-profundo',
      categoriaId: 'limpieza-interior',
      titulo: 'Interior profundo',
      descripcion: 'Aspirado, tapizados, alfombras, plásticos y vidrios.',
      precioVenta: mARS(40000),
      productoIds: ['apc', 'microfibras'],
      manoObra: mARS(15000),
      opciones: [],
    },
    {
      id: 'tratamiento-cuero',
      categoriaId: 'limpieza-interior',
      titulo: 'Tratamiento de cuero',
      descripcion: 'Limpieza e hidratación de butacas de cuero.',
      precioVenta: mARS(35000),
      productoIds: ['acond-cuero'],
      manoObra: mARS(12000),
      opciones: [
        {
          id: 'butacas',
          tipo: 'cantidad',
          nombre: 'Cantidad de butacas',
          precioUnitario: mARS(9000),
          default: 2,
        },
      ],
    },
    // Limpieza de motor
    {
      id: 'lavado-motor',
      categoriaId: 'limpieza-motor',
      titulo: 'Lavado de motor',
      descripcion: 'Desengrase y detallado del vano motor.',
      precioVenta: mARS(25000),
      productoIds: ['desengrasante-motor', 'renovador-plasticos'],
      manoObra: mARS(10000),
      opciones: [],
    },
    // Detailing
    {
      id: 'descontaminacion',
      categoriaId: 'detailing',
      titulo: 'Descontaminación',
      descripcion: 'Clay bar + descontaminado químico de pintura.',
      precioVenta: mARS(38000),
      productoIds: ['clay-bar', 'apc'],
      manoObra: mARS(14000),
      opciones: [],
    },
    {
      id: 'pulido-pintura',
      categoriaId: 'detailing',
      titulo: 'Pulido de pintura',
      descripcion: 'Corrección de pintura.',
      precioVenta: mARS(65000),
      productoIds: ['pasta-pulido', 'microfibras'],
      manoObra: mARS(25000),
      opciones: [
        {
          id: 'pasadas',
          tipo: 'select',
          nombre: 'Pasadas de pulido',
          valores: [
            { id: '1', label: '1 paso', delta: dMonto(mARS(0)) },
            { id: '2', label: '2 pasos', delta: dMonto(mARS(30000)) },
            { id: '3', label: '3 pasos', delta: dMonto(mARS(85000)) },
          ],
          defaultId: '1',
        },
        {
          id: 'tipo-pintura',
          tipo: 'select',
          nombre: 'Tipo de pintura',
          valores: [
            { id: 'solido', label: 'Sólido', delta: dMonto(mARS(0)) },
            { id: 'metalizado', label: 'Metalizado', delta: dMonto(mARS(0)) },
            { id: 'mate', label: 'Mate', delta: dPct(15) },
          ],
          defaultId: 'solido',
        },
      ],
    },
    // Tratamientos
    {
      id: 'sellador',
      categoriaId: 'tratamientos',
      titulo: 'Sellador sintético',
      descripcion: 'Protección ~6 meses.',
      precioVenta: mARS(35000),
      productoIds: ['sellador-sintetico'],
      manoObra: mARS(12000),
      opciones: [],
    },
    {
      id: 'ceramico',
      categoriaId: 'tratamientos',
      titulo: 'Cerámico 9H',
      descripcion: 'Recubrimiento cerámico de larga durabilidad.',
      precioVenta: mUSD(100),
      productoIds: ['ceramico-9h'],
      manoObra: mARS(45000),
      opciones: [
        {
          id: 'capas',
          tipo: 'select',
          nombre: 'Capas',
          valores: [
            { id: '1', label: '1 capa', delta: dMonto(mUSD(0)) },
            { id: '2', label: '2 capas', delta: dMonto(mUSD(65)) },
            { id: '3', label: '3 capas', delta: dMonto(mUSD(115)) },
          ],
          defaultId: '1',
        },
        {
          id: 'addons',
          tipo: 'addons',
          nombre: 'Add-ons',
          opciones: [
            { id: 'vidrios', label: 'Vidrios', delta: dMonto(mUSD(20)), default: false },
            { id: 'llantas', label: 'Llantas', delta: dMonto(mUSD(25)), default: false },
            { id: 'opticas', label: 'Ópticas', delta: dMonto(mUSD(12)), default: false },
          ],
        },
        {
          id: 'tipo-pintura',
          tipo: 'select',
          nombre: 'Tipo de pintura',
          valores: [
            { id: 'solido', label: 'Sólido', delta: dMonto(mARS(0)) },
            { id: 'metalizado', label: 'Metalizado', delta: dMonto(mARS(0)) },
            { id: 'mate', label: 'Mate', delta: dPct(15) },
          ],
          defaultId: 'solido',
        },
      ],
    },
    // Extras
    {
      id: 'renovado-plasticos',
      categoriaId: 'extras',
      titulo: 'Renovado de plásticos',
      descripcion: 'Restauración de plásticos exteriores opacos.',
      precioVenta: mARS(14000),
      productoIds: ['renovador-plasticos'],
      manoObra: mARS(5000),
      opciones: [],
    },
    {
      id: 'ozono',
      categoriaId: 'extras',
      titulo: 'Desinfección con ozono',
      descripcion: 'Eliminación de olores y bacterias.',
      precioVenta: mARS(18000),
      productoIds: [],
      manoObra: mARS(7000),
      opciones: [],
    },
  ]

  const plantillas = [
    {
      id: 'full-detail',
      nombre: 'Full Detail',
      itemIds: ['lavado-encerado', 'interior-profundo', 'descontaminacion', 'ceramico'],
    },
    {
      id: 'lavado-premium',
      nombre: 'Lavado Premium',
      itemIds: ['lavado-encerado', 'interior-basico', 'renovado-plasticos'],
    },
    {
      id: 'puesta-punto-interior',
      nombre: 'Puesta a punto interior',
      itemIds: ['interior-profundo', 'tratamiento-cuero', 'ozono'],
    },
  ]

  return {
    seedVersion: SEED_VERSION,
    config,
    local,
    formasPago,
    categorias,
    productos,
    items,
    plantillas,
    presupuestos: [],
    nextNro: 1,
  }
}
