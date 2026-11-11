import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

/**
 * Zoom pela rodinha do mouse (ou pinça do touchpad) proporcional e suave: cada “clique” da rodinha
 * aproxima/afasta uns 14%, seja qual for o zoom atual, mirando onde está o mouse.
 * (O zoom da biblioteca soma um valor fixo vezes o deltaY: um clique pulava do mínimo ao máximo.)
 */
export function fatorDaRoda(deltaY: number, deltaMode = 0, pinca = false) {
  const dy = deltaMode === 1 ? deltaY * 33 : deltaMode === 2 ? deltaY * 400 : deltaY
  const limitado = Math.max(-150, Math.min(150, dy))
  return Math.exp(-limitado * (pinca ? 0.01 : 0.0015))
}

export function ligarZoomSuave(ref: ReactZoomPanPinchRef | null, min: number, max: number): () => void {
  const el = ref?.instance.wrapperComponent
  if (!ref || !el) return () => {}
  const aoRodar = (e: WheelEvent) => {
    e.preventDefault()
    const { scale, positionX, positionY } = ref.instance.state
    const novo = Math.max(min, Math.min(max, scale * fatorDaRoda(e.deltaY, e.deltaMode, e.ctrlKey)))
    if (Math.abs(novo - scale) < 1e-4) return
    const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, k = novo / scale
    ref.setTransform(mx - (mx - positionX) * k, my - (my - positionY) * k, novo, 0)
  }
  el.addEventListener('wheel', aoRodar, { passive: false })
  return () => el.removeEventListener('wheel', aoRodar)
}
