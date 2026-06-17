import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DetailDocument } from '@/features/detail/DetailDocument'
import { computeTotals } from '@/lib/calc'
import { decodeShare } from '@/lib/share'

// Vista pública de solo-lectura del presupuesto. Los datos vienen en el #hash
// del link (sin backend). No tiene chrome de la app (es para el cliente final).
export function SharedBudgetPage() {
  const { hash } = useLocation()
  // 'loading' | 'error' | { presupuesto, local }
  const [state, setState] = useState('loading')

  useEffect(() => {
    const token = hash.replace(/^#/, '')
    if (!token) {
      setState('error')
      return
    }
    let alive = true
    decodeShare(token)
      .then((d) => alive && setState(d))
      .catch(() => alive && setState('error'))
    return () => {
      alive = false
    }
  }, [hash])

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-zinc-400">
        Cargando presupuesto…
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-zinc-500">
        Link inválido o incompleto. Pedí al taller que te lo reenvíe.
      </div>
    )
  }

  const { presupuesto, local } = state
  const totals = computeTotals(presupuesto)

  return (
    <div className="min-h-screen bg-zinc-100 py-4">
      <div className="mx-auto max-w-[760px] overflow-hidden rounded-xl border bg-white shadow-sm sm:my-4">
        <DetailDocument presupuesto={presupuesto} local={local} totals={totals} />
      </div>
    </div>
  )
}
