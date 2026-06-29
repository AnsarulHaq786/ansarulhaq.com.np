import { useRef } from 'react'
import { useMagicCursor } from '../hooks/useMagicCursor'

export function MagicCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useMagicCursor(cursorRef, glowRef)

  return (
    <div className="magic-cursor" aria-hidden="true">
      <div ref={glowRef} className="cursor-glow" />
      <div ref={cursorRef} className="cursor-ring" />
    </div>
  )
}
