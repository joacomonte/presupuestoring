import { neon } from '@neondatabase/serverless'

// Neon (Postgres). Guarda TODO el estado de la app como un único JSON por usuario/negocio.
// Más adelante se puede normalizar en tablas; por ahora una fila por user_id.
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)

let ready
function ensureTable() {
  if (!ready) {
    ready = sql`CREATE TABLE IF NOT EXISTS app_state (
      user_id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
  }
  return ready
}

// Solo letras, números, guiones. Evita inyección por la clave.
function cleanUser(u) {
  return typeof u === 'string' && /^[a-z0-9_-]{1,64}$/i.test(u) ? u : null
}

export default async function handler(req, res) {
  try {
    await ensureTable()
    const user = cleanUser(req.query.user)
    if (!user) return res.status(400).json({ error: 'missing or invalid user' })

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const data = body?.data
      if (!data) return res.status(400).json({ error: 'bad request' })
      await sql`
        INSERT INTO app_state (user_id, data, updated_at)
        VALUES (${user}, ${JSON.stringify(data)}, now())
        ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM app_state WHERE user_id = ${user}`
      if (!rows.length) return res.status(200).json({ data: null })
      return res.status(200).json({ data: rows[0].data })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server error' })
  }
}
