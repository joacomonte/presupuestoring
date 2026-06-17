// Stable-ish unique id generator for runtime-created entities.
export function uid(prefix = '') {
  const base =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return prefix ? `${prefix}_${base}` : base
}
