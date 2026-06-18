// Prueba la conexión a Neon y el flujo de la función: crear tabla, insertar,
// leer y borrar. Correr con: node --env-file=.env.local scripts/test-neon.mjs
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const id = 'test_' + Math.random().toString(36).slice(2, 8)
const payload = { v: 1, p: { nro: 999, cliente: { nombre: 'Prueba' } }, l: { nombre: 'Taller' } }

try {
  await sql`CREATE TABLE IF NOT EXISTS shares (
    id text PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`
  console.log('✓ tabla OK')

  await sql`INSERT INTO shares (id, payload) VALUES (${id}, ${JSON.stringify(payload)})`
  console.log('✓ insert OK (id:', id + ')')

  const rows = await sql`SELECT payload FROM shares WHERE id = ${id}`
  const back = rows[0]?.payload
  const ok = back?.p?.cliente?.nombre === 'Prueba'
  console.log(ok ? '✓ select OK, payload íntegro' : '✗ payload no coincide', back)

  await sql`DELETE FROM shares WHERE id = ${id}`
  console.log('✓ cleanup OK')

  console.log('\n🎉 Todo funciona contra Neon.')
} catch (e) {
  console.error('✗ ERROR:', e.message)
  process.exit(1)
}
