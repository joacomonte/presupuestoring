import { neon } from '@neondatabase/serverless'

// Neon (Postgres). La integración de Vercel inyecta DATABASE_URL.
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL)

// Sin caracteres ambiguos (0/o, 1/l). 32^7 ≈ 34 mil millones de combinaciones.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
function genId(n = 7) {
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

// Crea la tabla una sola vez (idempotente). Se memoiza entre invocaciones calientes.
let ready
function ensureTable() {
  if (!ready) {
    ready = sql`CREATE TABLE IF NOT EXISTS shares (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`
  }
  return ready
}

export default async function handler(req, res) {
  try {
    await ensureTable()

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const payload = body?.data
      if (!payload) return res.status(400).json({ error: 'bad request' })
      const id = genId()
      await sql`INSERT INTO shares (id, payload) VALUES (${id}, ${JSON.stringify(payload)})`
      return res.status(200).json({ id })
    }

    if (req.method === 'GET') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'missing id' })
      const rows = await sql`SELECT payload FROM shares WHERE id = ${id}`
      if (!rows.length) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(rows[0].payload)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server error' })
  }
}
