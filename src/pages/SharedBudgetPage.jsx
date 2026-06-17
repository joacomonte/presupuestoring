import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DetailDocument } from '@/features/detail/DetailDocument'
import { computeTotals } from '@/lib/calc'
import { fetchShared } from '@/lib/share'

// Vista pública de solo-lectura del presupuesto. Trae los datos del backend por
// id (/ver/:id). No tiene chrome de la app (es para el cliente final).
export function SharedBudgetPage() {
  const { id } = useParams()
  // 'loading' | 'error' | { presupuesto, local }
  const [state, setState] = useState('loading')

  useEffect(() => {
    if (!id) {
      setState('error')
      return
    }
    let alive = true
    fetchShared(id)
      .then((d) => alive && setState(d || 'error'))
      .catch(() => alive && setState('error'))
    return () => {
      alive = false
    }
  }, [id])

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
        Link inválido o vencido. Pedí al taller que te lo reenvíe.
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
