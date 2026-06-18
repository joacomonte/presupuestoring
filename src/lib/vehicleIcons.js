import {
  Car,
  CarFront,
  CarTaxiFront,
  Truck,
  Van,
  Motorbike,
  Scooter,
  createLucideIcon,
} from 'lucide-react'

// Iconos custom para tipos que lucide no cubre (mismo estilo line-art 24x24).
const Cuatri = createLucideIcon('cuatri', [
  ['circle', { cx: '5.5', cy: '17', r: '2.5', key: 'c1' }],
  ['circle', { cx: '18.5', cy: '17', r: '2.5', key: 'c2' }],
  ['path', { d: 'M6 14.5 7.5 9h9l1.5 5.5', key: 'p1' }],
  ['path', { d: 'M7.5 9 9 6h6l1.5 3', key: 'p2' }],
  ['path', { d: 'M8 6h8', key: 'p3' }],
])

const MotoCross = createLucideIcon('moto-cross', [
  ['circle', { cx: '5', cy: '17', r: '3', key: 'c1' }],
  ['circle', { cx: '19', cy: '17', r: '3', key: 'c2' }],
  ['path', { d: 'm5 17 3-6h5l2 3h2', key: 'p1' }],
  ['path', { d: 'M8 11 7 8h3', key: 'p2' }],
  ['path', { d: 'M17 11h4', key: 'p3' }],
  ['path', { d: 'M19 14v-3', key: 'p4' }],
])

// Moto deportiva: carenado bajo, cola levantada y caída hacia el frente.
const MotoDeportiva = createLucideIcon('moto-deportiva', [
  ['circle', { cx: '5', cy: '17', r: '3', key: 'c1' }],
  ['circle', { cx: '19', cy: '17', r: '3', key: 'c2' }],
  ['path', { d: 'M5 17 9 12h4', key: 'p1' }],
  ['path', { d: 'm13 12 5-2 1 5', key: 'p2' }],
  ['path', { d: 'm8 12 1-2 3 1', key: 'p3' }],
])

// Auto deportivo: silueta baja tipo cuña, techo bajo y trompa caída.
const AutoDeportivo = createLucideIcon('auto-deportivo', [
  ['circle', { cx: '7', cy: '16', r: '2', key: 'c1' }],
  ['circle', { cx: '17', cy: '16', r: '2', key: 'c2' }],
  ['path', { d: 'M9 16h6', key: 'p1' }],
  [
    'path',
    {
      d: 'M2.5 16a1 1 0 0 1-.5-.9c0-.6.4-1.1 1-1.3l3.5-1.1 2.5-2.1c.4-.3.9-.5 1.4-.5h2.2c.5 0 1 .2 1.4.5L17 13l3.3.6c.7.2 1.2.8 1.2 1.6a1 1 0 0 1-1 .9',
      key: 'p2',
    },
  ],
])

// Set curado de iconos para tipos de vehículo.
// La clave se persiste en tiposAuto[].icono.
export const VEHICLE_ICONS = {
  car: Car, // auto chico
  'car-front': CarFront, // auto grande
  'auto-deportivo': AutoDeportivo, // auto deportivo
  'car-taxi': CarTaxiFront, // premium / alta gama
  truck: Truck, // pickup
  van: Van, // pickup enorme / camioneta
  motorbike: Motorbike, // moto naked / común
  'moto-deportiva': MotoDeportiva, // moto deportiva
  'moto-cross': MotoCross,
  scooter: Scooter,
  cuatri: Cuatri,
}

export const DEFAULT_VEHICLE_ICON = 'car'

export function getVehicleIcon(key) {
  return VEHICLE_ICONS[key] || VEHICLE_ICONS[DEFAULT_VEHICLE_ICON]
}
