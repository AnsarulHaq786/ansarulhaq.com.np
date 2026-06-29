import { type RefObject, useEffect } from 'react'
import * as THREE from 'three'

export function useSunGrassScene(mountRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xdaf5ff, 8, 22)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 1.1, 10)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const pointer = new THREE.Vector2(0, 0)

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 40, 40),
      new THREE.MeshBasicMaterial({
        color: '#ffd35c',
      }),
    )
    sun.position.set(3.2, 2.2, -4.6)
    scene.add(sun)

    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 40, 40),
      new THREE.MeshBasicMaterial({
        color: '#fff0a8',
        transparent: true,
        opacity: 0.26,
      }),
    )
    sunGlow.position.copy(sun.position)
    scene.add(sunGlow)

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.32, 5.4),
      new THREE.MeshStandardMaterial({
        color: '#3e9f38',
        roughness: 0.82,
        metalness: 0,
      }),
    )
    ground.position.set(0, -3.16, 0)
    scene.add(ground)

    const grassBlades = new THREE.Group()
    const bladeGeometry = new THREE.ConeGeometry(0.025, 0.24, 4)
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: '#5ac44a',
      roughness: 0.9,
    })

    for (let index = 0; index < 140; index += 1) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
      blade.position.set((Math.random() - 0.5) * 8.4, -2.86, (Math.random() - 0.5) * 5)
      blade.rotation.set(
        (Math.random() - 0.5) * 0.32,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.42,
      )
      grassBlades.add(blade)
    }
    scene.add(grassBlades)

    scene.add(new THREE.HemisphereLight(0xfff3b0, 0x6abf57, 2.2))

    const keyLight = new THREE.DirectionalLight(0xfff0b8, 4.2)
    keyLight.position.set(3.5, 4, 5)
    scene.add(keyLight)

    const redLight = new THREE.PointLight('#ff3868', 22, 14)
    redLight.position.set(-3, 1, 3)
    scene.add(redLight)

    function resize() {
      const { width, height } = mount.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
    }

    let frameId = 0
    const clock = new THREE.Clock()

    function animate() {
      const elapsed = clock.getElapsedTime()

      sun.position.x += (3.2 + pointer.x * 0.16 - sun.position.x) * 0.035
      sun.position.y += (2.2 - pointer.y * 0.12 - sun.position.y) * 0.035
      sunGlow.position.copy(sun.position)
      sunGlow.scale.setScalar(1 + Math.sin(elapsed * 0.9) * 0.035)
      grassBlades.rotation.y = Math.sin(elapsed * 0.35) * 0.012

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      mount.removeChild(renderer.domElement)
      ground.geometry.dispose()
      ;(ground.material as THREE.Material).dispose()
      sun.geometry.dispose()
      ;(sun.material as THREE.Material).dispose()
      sunGlow.geometry.dispose()
      ;(sunGlow.material as THREE.Material).dispose()
      bladeGeometry.dispose()
      bladeMaterial.dispose()
      renderer.dispose()
    }
  }, [mountRef])
}
