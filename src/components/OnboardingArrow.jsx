import { useLayoutEffect, useRef, useState } from 'react'

// Flecha conectora medio rústica (trazo tembloroso, hecho a mano): arranca en la palabra
// clave de la descripción (`fromId`), baja con una curva suave y entra apuntando a la
// izquierda al primer elemento resaltado del preview (`toId`). Mide ambos elementos contra
// su contenedor relativo (el ancestro posicionado) y recalcula en resize / cambios (`deps`).
// Sin dependencias: dibuja su propio path SVG y lo "ensucia" con un filtro de ruido. Debe
// montarse dentro de un contenedor `relative` que contenga tanto el origen como el destino.
export function OnboardingArrow({ fromId, toId, deps }) {
  const svgRef = useRef(null)
  const [geo, setGeo] = useState(null)

  useLayoutEffect(() => {
    const wrap = svgRef.current?.parentElement
    if (!wrap) return
    const compute = () => {
      const from = document.getElementById(fromId)
      const to = document.getElementById(toId)
      if (!from || !to) return setGeo(null)
      const wb = wrap.getBoundingClientRect()
      const fb = from.getBoundingClientRect()
      const tb = to.getBoundingClientRect()
      setGeo({
        w: wb.width,
        h: wb.height,
        sx: fb.left + fb.width / 2 - wb.left, // origen: borde inferior, centro de la palabra
        sy: fb.bottom - wb.top + 2,
        tx: tb.right - wb.left, // destino: borde derecho, centro vertical del elemento
        ty: tb.top + tb.height / 2 - wb.top,
      })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(wrap)
    const from = document.getElementById(fromId)
    const to = document.getElementById(toId)
    if (from) ro.observe(from)
    if (to) ro.observe(to)
    window.addEventListener('resize', compute)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', compute)
    }
  }, [fromId, toId, deps])

  let line = ''
  let head = ''
  if (geo) {
    const { sx, sy, tx, ty } = geo
    const n = (v) => v.toFixed(1)
    // Punta sobre el borde derecho del destino, apuntando a la izquierda. Una sola curva
    // suave desde la palabra: baja un toque y barre hacia el elemento desde la derecha.
    const tipx = tx + 6
    const tipy = ty
    const c1x = sx + 6
    const c1y = sy + (tipy - sy) * 0.4
    const c2x = tipx + Math.max(70, (sx - tipx) * 0.45)
    const c2y = tipy + 12
    line = `M ${n(sx)} ${n(sy)} C ${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(tipx)} ${n(tipy)}`
    head = `M ${n(tipx + 11)} ${n(tipy - 7)} L ${n(tipx)} ${n(tipy)} L ${n(tipx + 11)} ${n(tipy + 6)}`
  }

  // id único de filtro por destino (evita colisiones entre los 3 pasos montados a la vez).
  const filterId = `arrow-rough-${toId}`

  return (
    <svg
      ref={svgRef}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 text-primary"
    >
      {/* Ruido fractal que desplaza el trazo: lo vuelve tembloroso, como hecho a mano. */}
      <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="5" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {geo && (
        <g filter={`url(#${filterId})`}>
          <path d={line} />
          <path d={head} />
        </g>
      )}
    </svg>
  )
}
