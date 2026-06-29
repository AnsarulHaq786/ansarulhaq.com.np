import { type RefObject, useEffect } from 'react'

export function useMagicCursor(
  cursorRef: RefObject<HTMLDivElement | null>,
  glowRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!cursorRef.current || !glowRef.current) return
    const cursor = cursorRef.current
    const glow = glowRef.current

    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const current = { ...target }
    const glowPosition = { ...target }
    let frameId = 0

    function handlePointerMove(event: PointerEvent) {
      target.x = event.clientX
      target.y = event.clientY
    }

    function animate() {
      current.x += (target.x - current.x) * 0.32
      current.y += (target.y - current.y) * 0.32
      glowPosition.x += (current.x - glowPosition.x) * 0.18
      glowPosition.y += (current.y - glowPosition.y) * 0.18

      cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`
      glow.style.transform = `translate3d(${glowPosition.x}px, ${glowPosition.y}px, 0) translate(-50%, -50%)`

      frameId = window.requestAnimationFrame(animate)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [cursorRef, glowRef])
}
