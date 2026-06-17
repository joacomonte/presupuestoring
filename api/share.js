import { Redis } from '@upstash/redis'

// Vercel inyecta KV_REST_API_* (integración Marketplace) o UPSTASH_REDIS_REST_*
// según cómo se cree el store. Soportamos ambos nombres.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Sin caracteres ambiguos (0/o, 1/l). 32^7 ≈ 34 mil millones de combinaciones.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
function genId(n = 7) {
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const payload = body?.data
      if (!payload) return res.status(400).json({ error: 'bad request' })
      const id = genId()
      // @upstash/redis serializa el objeto a JSON solo; get lo devuelve parseado.
      await redis.set(`p:${id}`, payload)
      return res.status(200).json({ id })
    }

    if (req.method === 'GET') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'missing id' })
      const payload = await redis.get(`p:${id}`)
      if (!payload) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(payload)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server error' })
  }
}
