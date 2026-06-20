import { create } from 'zustand'

// Cuenta/negocio seleccionado. No es seguridad real: solo elige qué datos cargar.
const KEY = 'pr-account'

// Lee el user_id elegido. Lo usa sync.js para armar la URL de /api/state.
export const getAccountUser = () => localStorage.getItem(KEY) || null

export const useAccount = create((set) => ({
  user: getAccountUser(),
  setUser: (user) => {
    localStorage.setItem(KEY, user)
    set({ user })
  },
  logout: () => {
    localStorage.removeItem(KEY)
    set({ user: null })
  },
}))
