// Catálogo de rubros para el onboarding. Al elegir uno en el paso 2 se precargan
// estas secciones / servicios / productos (todo editable en los pasos siguientes).
// Son listas planas: la asignación servicio→sección y producto→servicio se hace
// luego dentro de la app. Los costos arrancan en 0 (el usuario los completa).
//
// `preview` es la maqueta ilustrativa (secciones → servicios con precio y productos
// usados) que muestran los pasos de preview, ya armada y con un total de ejemplo.
export const RUBROS = [
  {
    id: 'detailing',
    nombre: 'Detailing de autos',
    categorias: ['Lavado exterior', 'Limpieza interior', 'Tratamientos'],
    servicios: ['Lavado simple', 'Lavado + encerado', 'Limpieza interior completa', 'Pulido de pintura', 'Cerámico 9H'],
    productos: ['Shampoo pH neutro', 'Cera líquida', 'APC', 'Recubrimiento cerámico'],
    total: '$223.000',
    preview: [
      {
        seccion: 'Lavado exterior',
        servicios: [
          { titulo: 'Lavado simple', precio: '$18.000', productos: ['Shampoo pH', 'Microfibras'] },
          { titulo: 'Lavado + encerado', precio: '$28.000', productos: ['Cera líquida', 'Shampoo pH'] },
        ],
      },
      {
        seccion: 'Limpieza interior',
        servicios: [
          { titulo: 'Interior básico', precio: '$22.000', productos: ['APC', 'Renovador'] },
          { titulo: 'Tratamiento de cuero', precio: '$35.000', productos: ['Acondicionador'] },
        ],
      },
      {
        seccion: 'Tratamientos',
        servicios: [{ titulo: 'Cerámico 9H', precio: '$120.000', productos: ['Recubrimiento cerámico'] }],
      },
    ],
  },
  {
    id: 'peluqueria-canina',
    nombre: 'Peluquería canina',
    categorias: ['Baño', 'Corte', 'Extras'],
    servicios: ['Baño y secado', 'Corte de raza', 'Corte de uñas', 'Limpieza de oídos'],
    productos: ['Shampoo hipoalergénico', 'Acondicionador', 'Perfume canino'],
    total: '$38.000',
    preview: [
      {
        seccion: 'Baño',
        servicios: [
          { titulo: 'Baño y secado', precio: '$9.000', productos: ['Shampoo hipoalergénico'] },
          { titulo: 'Baño medicado', precio: '$12.000', productos: ['Shampoo hipoalergénico', 'Acondicionador'] },
        ],
      },
      {
        seccion: 'Corte',
        servicios: [{ titulo: 'Corte de raza', precio: '$11.000', productos: ['Acondicionador'] }],
      },
      {
        seccion: 'Extras',
        servicios: [{ titulo: 'Spa + perfumado', precio: '$6.000', productos: ['Perfume canino'] }],
      },
    ],
  },
  {
    id: 'limpieza',
    nombre: 'Limpieza',
    categorias: ['Ambientes', 'Cocina y baños', 'Trabajos especiales'],
    servicios: ['Limpieza profunda de cocina', 'Lavado de alfombras', 'Vidrios en altura', 'Limpieza fin de obra'],
    productos: ['Detergente multiuso', 'Desinfectante', 'Bolsas de residuos'],
    total: '$88.000',
    preview: [
      {
        seccion: 'Ambientes',
        servicios: [
          { titulo: 'Limpieza por ambiente', precio: '$8.000', productos: ['Detergente multiuso'] },
          { titulo: 'Departamento completo', precio: '$25.000', productos: ['Detergente multiuso', 'Desinfectante'] },
        ],
      },
      {
        seccion: 'Cocina y baños',
        servicios: [{ titulo: 'Limpieza profunda de cocina', precio: '$15.000', productos: ['Desinfectante'] }],
      },
      {
        seccion: 'Trabajos especiales',
        servicios: [{ titulo: 'Limpieza fin de obra', precio: '$40.000', productos: ['Detergente multiuso', 'Bolsas de residuos'] }],
      },
    ],
  },
  {
    id: 'jardineria',
    nombre: 'Jardinería',
    categorias: ['Mantenimiento', 'Poda', 'Diseño'],
    servicios: ['Corte de césped', 'Poda de árboles', 'Diseño de cantero', 'Colocación de riego'],
    productos: ['Fertilizante', 'Semillas de césped', 'Combustible'],
    total: '$107.000',
    preview: [
      {
        seccion: 'Mantenimiento',
        servicios: [
          { titulo: 'Corte de césped', precio: '$12.000', productos: ['Combustible'] },
          { titulo: 'Mantenimiento mensual', precio: '$30.000', productos: ['Fertilizante', 'Combustible'] },
        ],
      },
      {
        seccion: 'Poda',
        servicios: [{ titulo: 'Poda de árboles', precio: '$20.000', productos: ['Combustible'] }],
      },
      {
        seccion: 'Diseño',
        servicios: [{ titulo: 'Diseño de cantero', precio: '$45.000', productos: ['Semillas de césped', 'Fertilizante'] }],
      },
    ],
  },
  {
    id: 'fotografia',
    nombre: 'Fotografía / eventos',
    categorias: ['Sesiones', 'Cobertura', 'Postproducción'],
    servicios: ['Sesión en estudio', 'Cobertura de evento', 'Edición y retoque', 'Álbum impreso'],
    productos: ['Impresiones', 'Álbum premium', 'Backup en nube'],
    total: '$190.000',
    preview: [
      {
        seccion: 'Sesiones',
        servicios: [{ titulo: 'Sesión en estudio', precio: '$40.000', productos: ['Backup en nube'] }],
      },
      {
        seccion: 'Cobertura',
        servicios: [{ titulo: 'Cobertura de evento', precio: '$90.000', productos: ['Backup en nube'] }],
      },
      {
        seccion: 'Postproducción',
        servicios: [
          { titulo: 'Edición y retoque', precio: '$25.000', productos: ['Backup en nube'] },
          { titulo: 'Álbum impreso', precio: '$35.000', productos: ['Impresiones', 'Álbum premium'] },
        ],
      },
    ],
  },
]
