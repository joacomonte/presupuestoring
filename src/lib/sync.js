import { useStore } from '@/store/useStore'
import { getAccountUser } from '@/store/useAccount'

// Usuario/negocio actual: se deriva de la cuenta seleccionada (useAccount).
const apiFor = (user) => `/api/state?user=${encodeURIComponent(user)}`

// Lista las cuentas existentes (user_id + nombre) desde la DB.
export async function listAccounts() {
  const res = await fetch('/api/state?list=1')
  if (!res.ok) throw new Error('No se pudieron cargar las cuentas')
  const { accounts } = await res.json()
  return accounts || []
}

// Crea una cuenta nueva guardando su estado inicial en la DB.
export async function createAccount(user, data) {
  const res = await fetch(apiFor(user), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error('No se pudo crear la cuenta')
}

// Elimina una cuenta y todos sus datos de la DB.
export async function deleteAccount(user) {
  const res = await fetch(apiFor(user), { method: 'DELETE' })
  if (!res.ok) throw new Error('No se pudo eliminar la cuenta')
}

// Keys de presupuestos → auto-guardan. El resto (config, local, catálogos, ítems,
// paquetes) son "ajustes" y se guardan con el botón manual.
const BUDGET_KEYS = ['presupuestos', 'nextNro']
const SETTINGS_KEYS = ['config', 'local', 'tiposTrabajo', 'formasPago', 'categorias', 'productos', 'items', 'paquetes']

// Mientras hidratamos desde la DB no queremos marcar dirty ni re-disparar guardado.
let hydrating = false
let autoSaveTimer = null

export async function loadFromDb() {
  const user = getAccountUser()
  if (!user) return
  try {
    const res = await fetch(apiFor(user))
    if (!res.ok) return
    const { data } = await res.json()
    if (data) {
      hydrating = true
      useStore.getState().importData(data)
      hydrating = false
      useStore.setState({ dirty: false })
    }
  } catch (e) {
    // Sin conexión / error: nos quedamos con lo que haya en localStorage.
    console.error('loadFromDb', e)
  }
}

export async function saveToDb() {
  const user = getAccountUser()
  if (!user) return
  const data = useStore.getState().exportData()
  const res = await fetch(apiFor(user), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error('save failed')
  useStore.setState({ dirty: false })
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null
    saveToDb().catch((e) => console.error('autoSave', e))
  }, 800)
}

// Suscripción única (se registra al importar el módulo).
useStore.subscribe((state, prev) => {
  if (hydrating) return
  const settingsChanged = SETTINGS_KEYS.some((k) => state[k] !== prev[k])
  const budgetChanged = BUDGET_KEYS.some((k) => state[k] !== prev[k])
  if (settingsChanged && !state.dirty) useStore.setState({ dirty: true })
  if (budgetChanged) scheduleAutoSave()
})
