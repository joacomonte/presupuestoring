# PRD — Generador de Presupuestos de Detailing

## 1. Objetivo
Permitir al local cargar un presupuesto de detailing mediante un formulario configurable, y generar un **detalle final imprimible/compartible** con numeración, fecha y datos del local.

## 2. Alcance
- **In:** Formulario de carga + vista de detalle + PDF + WhatsApp + configuración de catálogos + listado/edición de presupuestos guardados (localStorage).
- **Out (por ahora):** Login/multiusuario, facturación AFIP real, envío automático de email, base de datos (Neon llega después).

## 2.1 Stack técnico
- **React (última versión)** — aprovechando la optimización nativa del compilador (React Compiler), sin memoización manual.
- **Vite** como build/dev server.
- **Tailwind** + **shadcn/ui** para la UI.
- **Neon (Postgres)** como base de datos — **fase futura**; la v1 corre sobre localStorage (ver §7).
- **Filosofía de diseño:** prototipo super rápido, fácil de iterar. Priorizar velocidad de desarrollo y cambios baratos sobre arquitectura definitiva; componentes simples y directos.

## 2.2 Convenciones de UI
- **Selects de pocas opciones → "quick toggle" (segmented control / chips):** cuando un campo tiene pocas opciones (≈2–5), se muestran como botones/chips en línea para seleccionar con **un solo clic**, sin abrir dropdown. Aplica a: tipo de auto, forma de pago, tipo de descuento (% / monto), IVA on/off.
- **Alta inline de opciones simples:** los catálogos de **valor simple** (solo nombre, sin descripción — tipo de auto, forma de pago, etc.) se pueden **agregar desde el mismo form**, con un chip **"+"** al final que abre un mini-input en el lugar. El operador agrega la opción y la selecciona **sin salir del formulario**; queda persistida en el catálogo global. Si la lista crece mucho, degradar a combobox.
  - Los catálogos **con estructura** (ítems de servicio: título + descripción + precios + opciones) se siguen gestionando en **Ajustes**, no inline.
- **Mobile-first**: el form se usa desde el celular en el taller; targets táctiles grandes y cómodos.
- **Moneda ARS**: formato con separador de miles y sin decimales (`$45.000`).
- IDs en inputs/botones/diálogos (accesibilidad y referencia).

### 2.3 Carga rápida (defaults)
La velocidad de carga es prioridad. El form precarga valores por defecto en todo lo que pueda:
- **Tipo de auto** precarga los **precios** de cada ítem (matriz).
- **Opciones de ítem** arrancan en su **default** (ej. pulido = 1 paso).
- **Paquetes/combos** cargan varios ítems de una (atajo principal de carga).
- **IVA off** por defecto; tipo de descuento = "%".
- **Al abrir un presupuesto nuevo se preselecciona el paquete más vendido** (ej. "Lavado Premium") ya cargado; el operador ajusta/quita lo que no aplique.
- Lo más usado primero / preseleccionado; el operador solo ajusta lo que cambia.

## 3. Estructura del Formulario

> **Layout por secciones:** el form se divide en secciones plegables (Cliente · Vehículo · cada categoría de servicios · Cierre), navegables de forma independiente. El operador salta a la que necesita sin scrollear todo. Cada sección muestra si tiene algo cargado (chip/resumen breve). Esto prioriza la carga rápida.

> **Todo el formulario es opcional.** Ningún campo ni sección es obligatorio: el operador carga solo lo que necesita y puede generar el presupuesto igual. Lo único auto-generado es el N° y la fecha. Esto prioriza presupuestos rápidos y baja fricción.

> **Observaciones por bloque:** la mayoría de los bloques compatibles (cliente, vehículo, cada ítem de servicio y el cierre) incluyen un campo libre **"Observaciones"** opcional, para notas puntuales. Se muestran en el detalle junto a su bloque.

### 3.1 Cliente
| Campo | Notas |
|---|---|
| Nombre / Razón social | |
| Teléfono | Se usa también para el botón de WhatsApp (§4.2) |
| Email | |
| Datos de facturación | Bloque **colapsable**, **texto libre** (un campo de notas de facturación) |
| Observaciones | Texto libre |

### 3.2 Vehículo
| Campo | Notas |
|---|---|
| Descripción | Texto libre (ej. "Ford Focus") |
| Patente | |
| Tipo de auto | **Combobox** con opciones editables (chico, mediano, pickup…). Permite **agregar opción inline** desde el mismo combobox. Catálogo editable en Ajustes. |
| Estado actual | Texto libre |
| Observaciones | Texto libre |

### 3.3 Servicios (categorías)
Las **categorías son editables** (CRUD desde Ajustes): el operador puede renombrarlas, reordenarlas, agregar nuevas o eliminar las que no use. Vienen con un set por defecto, todas opcionales — se puede armar un presupuesto con una, varias o ninguna:
1. Lavado exterior
2. Limpieza interior
3. Limpieza de motor
4. Detailing
5. Tratamientos
6. Extras

**Cada categoría** contiene ítems configurables. **Modelo de precio: precio por servicio.** Cada ítem se cobra como un único **precio de venta** (lo que ve y paga el cliente); los productos y la mano de obra son **costos internos** que solo sirven para calcular la ganancia.

**Moneda (ARS o USD):** cada precio se puede cargar en **ARS o USD** (toggle por precio). Cada ítem/producto guarda su moneda; ej. lavados en ARS, cerámico en USD. Los precios en USD se convierten a ARS con la **cotización configurada** (§5) para sumar y mostrar (ver §4 y §6).

**Cada ítem** tiene:
- **Título** (ej. "Lavado simple")
- **Descripción** (ej. "Incluye X, Y, Z")
- **Precio de venta por tipo de auto** (matriz): cada ítem guarda un precio según el tipo de auto (Chico, Mediano, SUV…). Al elegir el tipo de auto del vehículo, el form **precarga** el precio correspondiente (editable por presupuesto).
- **Costos internos** (solo operador, para la ganancia):
  - **Productos utilizados** (lista del catálogo): cada uno aporta su **costo**.
  - **Mano de obra**: monto (costo de trabajo).
  - **Ganancia del ítem** = `precio de venta − Σ costos de productos − mano de obra`.
- **Opciones / variantes** (ver §3.3.1): parámetros configurables del ítem (ej. pasadas de pulido) que pueden ajustar el precio.
- **Observaciones** (opcional): nota libre del ítem.

> La **bonificación es a nivel total** (no por ítem ni por producto) — ver §3.4.

> Los ítems se administran desde **Ajustes** (CRUD de título + descripción + matriz de precios + productos/MO de costo + opciones). En el formulario el operador selecciona/activa los que aplican a ese presupuesto.

### 3.3.1 Opciones / variantes por ítem
Para hacer el presupuesto más detallado sin multiplicar ítems, cada ítem puede tener **opciones**: un parámetro con varios valores, donde cada valor puede sumar/restar precio. Se renderiza como **quick-toggle** (§2.2) y **siempre arranca en un default** para no frenar la carga.

Tipos de opción:
- **Selección** (quick-toggle): un valor entre varios, cada uno con delta. Modelo: `{ tipo: 'select', nombre, valores[] { label, deltaPrecio }, default }`.
- **Add-ons** (toggles múltiples): cada uno suma su precio si se activa. Modelo: `{ tipo: 'addons', nombre, opciones[] { label, deltaPrecio, default: bool } }`.
- **Cantidad** (stepper): multiplica un precio unitario. Modelo: `{ tipo: 'cantidad', nombre, precioUnitario, default }`.

Ejemplos (seed):
- **Pasadas de pulido** (select) — `1 paso (base) · 2 pasos (+$30.000) · 3 pasos (+$85.000)` — default: 1 paso.
- **Capas de cerámico** (select) — `1 capa (base) · 2 capas (+$80.000) · 3 capas (+$140.000)` — default: 1 capa.
- **Add-ons del cerámico** (addons) — `Vidrios (+$25.000) · Llantas (+$30.000) · Ópticas (+$15.000)` — default: todos off.
- **Cantidad de butacas** (cantidad) — tratamiento de cuero, `precio unitario $9.000`, default 2 (delanteras).
- **Tipo de pintura** (select) — pulido/tratamientos, `Sólido (base) · Metalizado (base) · Mate (+15%)` — default: Sólido.

El precio final del ítem = precio base (por tipo de auto) + Σ deltas/cantidades de las opciones elegidas.

### 3.4 Cierre del presupuesto
| Campo | Notas |
|---|---|
| Tiempo estimado total | Texto libre |
| Forma de pago | **Lista editable** (catálogo en Ajustes) mostrada como **quick-toggle** (§2.2): Efectivo, Transferencia, Tarjeta, etc. |
| **Seña / anticipo** | Opcional, en **% o monto fijo** sobre el total. En el detalle se muestra la seña y el **saldo restante** (total − seña). |
| Garantía | Texto libre |
| Observaciones | Texto libre (aparece en el detalle) |
| **Bonificación / descuento (total)** | Opcional, en **% o monto fijo** sobre el subtotal. Es la **única bonificación, a nivel total** (no por ítem ni producto). En el detalle se muestra el subtotal y la línea de bonificación/descuento, dejando ver el regalo. |

### 3.5 Resumen en vivo y calibración
Mientras se carga el presupuesto, un **panel de resumen siempre visible** (sticky al pie en mobile, lateral en desktop) va mostrando el acumulado en tiempo real:
- **Total acumulado** (lo que pagaría el cliente) actualizándose con cada ítem/opción.
- **Costos y ganancia** (vista operador): para ver al instante si cierra el número.
- **Bonificación "a ojo"**: control para meter una bonificación/descuento (% o monto) y **ver el total y la ganancia recalcularse al instante**, hasta calibrar el precio que cierra. Es la misma bonificación a nivel total de §3.4.
- **Saltar a editar**: desde el resumen, tocar cualquier línea/ítem lleva directo a su **campo o sección** en el form para modificarlo rápido (scroll + foco en el input).

## 4. Vista de Detalle (post-submit)
Al enviar el formulario se muestra un resumen con:
- **Datos del local** (logo, dirección, contacto)
- **N° de presupuesto** (correlativo simple autoincremental, arranca en 1, padding visual `#0001`) + **fecha de emisión** (auto)
- Datos del cliente y del vehículo
- Servicios seleccionados, agrupados por categoría: **título + descripción + precio**. Los productos/MO **no** se muestran al cliente.
- Tiempo estimado, forma de pago, garantía
- Observaciones
- Todos los importes se muestran en **ARS** (los cargados en USD se convierten con la cotización configurada). Se aclara la **cotización usada** y, opcionalmente, el equivalente en USD.
- **Subtotal** = suma de precios de los servicios (convertidos a ARS).
- **Bonificación / descuento** (si se cargó): se resta del subtotal y se muestra como línea (regalo visible).
- **IVA opcional** (toggle): por defecto **OFF** (sin IVA / "en negro"). Si está ON, se calcula y discrimina.
- **Total** = subtotal − descuento (+ IVA si aplica).
- **Seña / anticipo** (si se cargó) y **saldo restante** = total − seña.
- **Vista operador (interno):** además muestra costos totales (productos + mano de obra) y **ganancia** del presupuesto. El cliente ve solo precios/total.

### 4.1 Exportar a PDF
- Botón **"Descargar PDF"** que genera un PDF del detalle, listo para enviar al cliente (WhatsApp/email).
- El PDF es la **versión cliente**: incluye datos del local, N° y fecha, vehículo, servicios con precios y total. **No incluye costos ni ganancia.**
- Generación **client-side** (consistente con localStorage, sin backend).
- **Enfoque:** HTML→PDF (html2pdf / jsPDF + html2canvas) — captura el detalle tal como se ve en pantalla.

### 4.2 Enviar por WhatsApp
- Botón **"Enviar por WhatsApp"** que abre `wa.me/<teléfono>` con un mensaje precargado (saludo + N° de presupuesto + total).
- Usa el teléfono cargado en §3.1; si no hay, abre WhatsApp sin destinatario para elegir contacto.
- El PDF se adjunta manualmente (limitación de la API web de WhatsApp). El mensaje precargado da el contexto.

## 5. Configuración (Ajustes)
- **Cotización del USD** (valor de cambio configurable, editable cuando se mueve el dólar). Se usa para convertir a ARS todos los precios cargados en USD.
- CRUD de **categorías de servicio** (nombre + orden)
- CRUD de **tipos de auto**
- CRUD de **formas de pago** (lista para el quick-toggle del cierre)
- CRUD de **ítems de servicio** por categoría: título + descripción + **matriz de precios por tipo de auto** + productos/MO de costo
- CRUD de **productos** (nombre + marca + **costo**), reutilizables en los ítems
- CRUD de **paquetes/combos** (§5.1)
- **Actualización masiva de precios:** subir/bajar todo el catálogo (o una categoría) un **%**, para seguir la inflación sin editar ítem por ítem
- **Export / Import de datos a JSON** (§5.2)
- **Datos del local** (logo, dirección, contacto) para el encabezado del detalle

### 5.1 Paquetes / combos
- Un paquete agrupa **varios ítems** que se venden juntos (ej. "Full detail" = pulido 1 paso + interior profundo + cerámico 1 capa).
- Al elegir un paquete en el form, **carga todos sus ítems de una** (luego se pueden editar/quitar).

### 5.2 Backup (Export / Import JSON)
- Botón para **exportar** todos los datos (catálogos + datos del local + presupuestos) a un archivo JSON.
- Botón para **importar** ese JSON y restaurar. Única red de seguridad mientras la persistencia sea localStorage.

### 5.3 Reset de localStorage (modo prototipo)
- Botón **"Resetear datos"** que limpia el localStorage y **recarga el seed por defecto** (§10). Sirve para evitar cache vieja al iterar y para volver a un estado limpio durante el prototipo.
- Pide **confirmación** (borra todo: catálogos, config y presupuestos).
- Opcional: **versionado del seed** — si la versión del seed guardada en localStorage es menor a la del código, ofrecer resetear/migrar al abrir (evita quedar con estructura vieja mientras se itera).

## 6. Reglas
- **Precio por servicio:** el cliente paga el precio de venta del ítem; productos y mano de obra son solo costo interno.
- **Ganancia del ítem** = `precio de venta − Σ costos de productos − mano de obra`. La ganancia total del presupuesto es la suma (vista interna del operador).
- **Costos y ganancia son internos**: nunca aparecen en el detalle que ve el cliente.
- **Bonificación a nivel total** (no por ítem ni producto): única línea de descuento/regalo sobre el subtotal, visible en el detalle.
- **Precio por tipo de auto:** al elegir el tipo de auto, los ítems precargan su precio según la matriz; editable por presupuesto.
- Agregar tipo de auto desde el combobox lo persiste en el catálogo global.
- Un presupuesto guardado **congela** precios, costos **y la cotización del USD** usada (snapshot), inmune a cambios posteriores.
- **Moneda:** solo ARS y USD. Cada precio/costo lleva su moneda; el sistema convierte USD→ARS con la cotización configurada. Cliente ve siempre ARS.
- **IVA opcional**, por defecto desactivado (modo "en negro").

## 7. Persistencia
- **Fase actual:** todo en **localStorage** (catálogos, datos del local, presupuestos).
- **Futuro:** migrar a base de datos. El modelo de datos se diseña pensando en esa migración.
- **Guardar presupuesto completo:** al generar, el presupuesto se persiste con **todo su contenido** (cliente, vehículo, ítems, productos, precios, mano de obra, descuento, etc.). Esto permite **reabrirlo y editarlo fácilmente** (ver §7.1). Los precios/costos quedan "congelados" en el presupuesto guardado, independientes de cambios posteriores en los catálogos.

### 7.1 Listado y edición
- Pantalla de **listado de presupuestos guardados** (N°, cliente, vehículo, fecha, total).
- Acciones: **abrir/editar**, **duplicar**, **eliminar**, regenerar PDF.
- Al editar, el formulario se precarga con todos los datos guardados.

## 8. Modelo de datos (borrador)
> Todo importe se modela como `{ valor, moneda: 'ARS'|'USD' }`.

- **Config**: cotizacionUsd (valor de cambio configurable)
- **Cliente**: nombre, telefono?, email?, facturacion?, observaciones?
- **Vehiculo**: descripcion, patente, tipoAutoId, estado?, observaciones?
- **TipoAuto**: id, nombre (catálogo)
- **FormaPago**: id, nombre (catálogo)
- **Categoria**: id, nombre, orden (catálogo editable)
- **ItemCatalogo**: id, categoriaId, titulo, descripcion, precios `{ [tipoAutoId]: precio }`, productoIds[], manoObra, opciones[] `{ nombre, valores[] {label, deltaPrecio}, default }` (catálogo)
- **Producto** (catálogo): id, nombre, marca, costo
- **Paquete** (catálogo): id, nombre, itemIds[]
- **PresupuestoItem** (snapshot): titulo, descripcion, precioVenta, opcionesElegidas[] `{ nombre, label, deltaPrecio }`, costos `{ productos[] {nombre, marca, costo}, manoObra }`, observaciones?
- **Presupuesto**: nro, fechaEmision, cliente, vehiculo, items[], tiempoEstimado, formaPago, garantia, observaciones, ivaActivo(bool), descuento `{ tipo: '%'|'monto', valor }`, sena `{ tipo: '%'|'monto', valor }`, cotizacionUsd (congelada)
- **Local**: logo, direccion, contacto

## 9. Features opcionales / futuro (no v1)
- Estados (borrador / enviado / aceptado / rechazado) + listado
- Numeración configurable (prefijo, año, padding)
- Cantidad/unidad por producto (para costo por consumo real)

## 10. Datos de ejemplo (seed) — para probar el form
> Valores inventados en ARS (referencia mediados 2026). Se precargan en localStorage al primer arranque para iterar rápido.

### Config
- **Cotización USD:** $1.200 (ARS por USD) — editable en Ajustes.

### Local
- **Nombre:** Detailing Studio AR · **Tel:** +54 9 11 5555-1234 · **Dir:** Av. Siempreviva 1234, CABA · **Logo:** placeholder

### Formas de pago
Efectivo · Transferencia · Tarjeta de débito · Tarjeta de crédito · USDT/cripto

### Tipos de auto (con multiplicador de precio sobre el precio base)
Chico (×0,85) · Mediano (×1,0 — base) · SUV (×1,25) · Pickup (×1,3) · Premium / Alta gama (×1,5)

> El seed usa un **precio base** (Mediano) por ítem y deriva el resto con el multiplicador. En la app cada precio queda explícito en la matriz y es editable.

### Categorías (orden)
1. Lavado exterior · 2. Limpieza interior · 3. Limpieza de motor · 4. Detailing · 5. Tratamientos · 6. Extras

### Productos (nombre — marca — costo)
- Shampoo pH neutro — Sonax — $4.500
- Cera líquida — Meguiar's — $9.800
- Clay bar (barra descontaminante) — 3M — $7.200
- Sellador sintético — Soft99 — $12.500
- Recubrimiento cerámico 9H — Gyeon — $38.000
- APC (limpiador multipropósito) — Koch Chemie — $6.300
- Acondicionador de cuero — CarPro — $11.000
- Renovador de plásticos — Sonax — $5.400
- Desengrasante de motor — 3M — $5.900
- Pasta de pulido — Menzerna — $14.700
- Microfibras (pack) — genérico — $3.800

### Ítems de servicio por categoría (título — descripción — **precio base** — costos internos: productos + MO)
> Precio base = tipo Mediano. Ganancia = precio − costos.

**Lavado exterior**
- *Lavado simple* — "Prelavado, shampoo, secado con microfibra." — **$18.000** — [Shampoo pH neutro, Microfibras] + MO $6.000
- *Lavado + encerado* — "Lavado completo + aplicación de cera de protección." — **$28.000** — [Shampoo, Cera líquida, Microfibras] + MO $9.000

**Limpieza interior**
- *Interior básico* — "Aspirado, limpieza de plásticos y tableros." — **$22.000** — [APC, Renovador de plásticos, Microfibras] + MO $8.000
- *Interior profundo* — "Aspirado, tapizados, alfombras, plásticos y vidrios." — **$40.000** — [APC, Microfibras] + MO $15.000
- *Tratamiento de cuero* — "Limpieza e hidratación de butacas de cuero." — **$35.000** — [Acondicionador de cuero] + MO $12.000 — *opción: Cantidad de butacas ($9.000 c/u, default 2)*

**Limpieza de motor**
- *Lavado de motor* — "Desengrase y detallado del vano motor." — **$25.000** — [Desengrasante de motor, Renovador de plásticos] + MO $10.000

**Detailing**
- *Descontaminación* — "Clay bar + descontaminado químico de pintura." — **$38.000** — [Clay bar, APC] + MO $14.000
- *Pulido de pintura* — "Corrección de pintura." — **$65.000** — [Pasta de pulido, Microfibras] + MO $25.000 — *opciones: Pasadas de pulido (1 base / 2 +$30.000 / 3 +$85.000, default 1) · Tipo de pintura (Sólido/Metalizado base · Mate +15%, default Sólido)*

**Tratamientos**
- *Sellador sintético* — "Protección ~6 meses." — **$35.000** — [Sellador sintético] + MO $12.000
- *Cerámico 9H* — "Recubrimiento cerámico de larga durabilidad." — **USD 100** (precio en USD) — [Recubrimiento cerámico 9H] + MO $45.000 — *opciones: Capas (1 base / 2 +USD 65 / 3 +USD 115, default 1) · Add-ons (Vidrios +USD 20 · Llantas +USD 25 · Ópticas +USD 12, default off) · Tipo de pintura (Sólido/Metalizado base · Mate +15%)*

**Extras**
- *Renovado de plásticos* — "Restauración de plásticos exteriores opacos." — **$14.000** — [Renovador de plásticos] + MO $5.000
- *Desinfección con ozono* — "Eliminación de olores y bacterias." — **$18.000** — [] + MO $7.000

### Paquetes / combos (seed)
- **Full Detail** = Lavado + encerado · Interior profundo · Descontaminación · Cerámico 9H (1 capa)
- **Lavado Premium** = Lavado + encerado · Interior básico · Renovado de plásticos
- **Puesta a punto interior** = Interior profundo · Tratamiento de cuero · Desinfección con ozono
