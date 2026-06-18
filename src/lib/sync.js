import { useStore } from '@/store/useStore'

// Usuario/negocio actual. Por ahora fijo; cuando haya multi-usuario, derivar del login.
const USER = 'blaster'
const API = `/api/state?user=${USER}`

// Keys de presupuestos → auto-guardan. El resto (config, local, catálogos, ítems,
// paquetes) son "ajustes" y se guardan con el botón manual.
const BUDGET_KEYS = ['presupuestos', 'nextNro']
const SETTINGS_KEYS = ['config', 'local', 'tiposAuto', 'formasPago', 'categorias', 'productos', 'items', 'paquetes']

// Mientras hidratamos desde la DB no queremos marcar dirty ni re-disparar guardado.
let hydrating = false
let autoSaveTimer = null

export async function loadFromDb() {
  try {
    const res = await fetch(API)
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
  const data = useStore.getState().exportData()
  const res = await fetch(API, {
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
