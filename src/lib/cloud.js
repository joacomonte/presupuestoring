// Sincronización manual de TODO el estado de la app con Neon (vía /api/state).

// Guarda el blob completo (lo que devuelve exportData()) en la nube.
export async function saveAppState(data) {
  const res = await fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error('No se pudo guardar en la nube')
}

// Trae el blob de la nube. Devuelve null si todavía no se guardó nada.
export async function loadAppState() {
  const res = await fetch('/api/state')
  if (res.status === 404) return null
  if (!res.ok) throw new Error('No se pudo cargar de la nube')
  return res.json()
}
