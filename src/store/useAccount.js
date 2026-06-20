import { create } from 'zustand'

// Cuenta/negocio seleccionado. No es seguridad real: solo elige qué datos cargar.
const KEY = 'pr-account'

// La cuenta vive en la URL: primer segmento del path (ej. /blaster-detailing/nuevo).
// 'ver' está reservado para el link público compartido, así que no es una cuenta.
// Fallback a localStorage para usos fuera de una request con cuenta en la URL.
export const accountFromPath = () => {
  const seg = window.location.pathname.split('/')[1] || ''
  return seg && seg !== 'ver' ? seg : ''
}

// Lee el user_id activo. Lo usa sync.js para armar la URL de /api/state.
export const getAccountUser = () => accountFromPath() || localStorage.getItem(KEY) || null

export const useAccount = create((set) => ({
  user: getAccountUser(),
  // Cambiar de cuenta cambia la URL base: recargamos para reinicializar el router
  // (basename) y bajar los datos de la cuenta nueva.
  setUser: (user) => {
    localStorage.setItem(KEY, user)
    window.location.assign(`/${user}`)
  },
  logout: () => {
    localStorage.removeItem(KEY)
    window.location.assign('/')
  },
}))
