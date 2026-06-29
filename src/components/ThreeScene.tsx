import { useRef } from 'react'
import { useSunGrassScene } from '../hooks/useSunGrassScene'

export function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useSunGrassScene(mountRef)

  return <div ref={mountRef} className="three-stage" aria-hidden="true" />
}
