import { useEffect, useRef, type PointerEvent } from 'react'

import { COLOR_HEX, COLORS } from '@/lib/colors'

const PARTICLES = 150
const SPECTRUM = COLORS.filter((color) => color !== 'gray').map((color) => COLOR_HEX[color])
const CYCLE_SECONDS = 11
const ASSEMBLE_AFTER = 0.7
const ASSEMBLE_SECONDS = 1.6
const SPIN = 0.14
const LINK_DISTANCE = 34
const POINTER_REACH = 80
const TAIL_SECONDS = 0.05
const ROAM_LIMIT = 1.2

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  lane: number
  color: string
  size: number
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLES }, (_, index) => {
    const position = index / PARTICLES
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      // Sorted by color along the ring: that is the order the chaos turns into.
      angle: position * Math.PI * 2,
      lane: Math.random() * 2 - 1,
      color: SPECTRUM[Math.floor(position * SPECTRUM.length)],
      size: 1.3 + Math.random() * 1.3,
    }
  })
}

// Thoughts in random order that sort themselves into a ring, the "O" of Ordeus.
export function OrderRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scatterRef = useRef(() => {})
  const pointerRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const particles = createParticles()
    let width = 0
    let height = 0
    let elapsed = 0
    let spin = 0
    let frame = 0
    let last = 0
    let visible = true

    const center = () => ({ x: width / 2, y: height / 2 })
    const radius = () => Math.min(width, height) * 0.38

    function target(particle: Particle) {
      const { x, y } = center()
      const distance = radius() + particle.lane * radius() * 0.11
      return {
        x: x + Math.cos(particle.angle + spin) * distance,
        y: y + Math.sin(particle.angle + spin) * distance,
      }
    }

    function spread() {
      const { x, y } = center()
      for (const particle of particles) {
        // The square root spreads them evenly over a disc, not bunched in the middle.
        const distance = Math.sqrt(Math.random()) * radius() * ROAM_LIMIT
        const direction = Math.random() * Math.PI * 2
        particle.x = x + Math.cos(direction) * distance
        particle.y = y + Math.sin(direction) * distance
      }
    }

    function scatter() {
      elapsed = 0
      for (const particle of particles) {
        const { x, y } = center()
        const direction = Math.atan2(particle.y - y, particle.x - x) + (Math.random() - 0.5) * 1.6
        const force = 120 + Math.random() * 260
        particle.vx += Math.cos(direction) * force
        particle.vy += Math.sin(direction) * force
      }
    }
    scatterRef.current = still ? () => {} : scatter

    function step(seconds: number) {
      elapsed += seconds
      if (elapsed > CYCLE_SECONDS) scatter()
      spin += SPIN * seconds

      const order = Math.min(1, Math.max(0, (elapsed - ASSEMBLE_AFTER) / ASSEMBLE_SECONDS))
      const eased = order * order * (3 - 2 * order)
      const damping = Math.exp(-seconds * (1.1 + eased * 3.4))
      const { x: middleX, y: middleY } = center()
      const pointer = pointerRef.current

      for (const particle of particles) {
        const goal = target(particle)
        const wander = 90 * (1 - eased)
        let forceX = (goal.x - particle.x) * eased * 14 + (middleX - particle.x) * 0.5 + (Math.random() - 0.5) * wander * 2
        let forceY = (goal.y - particle.y) * eased * 14 + (middleY - particle.y) * 0.5 + (Math.random() - 0.5) * wander * 2

        // Keeps the chaos round, so the canvas edge never shows as a square.
        const fromMiddle = Math.hypot(particle.x - middleX, particle.y - middleY)
        const limit = radius() * ROAM_LIMIT
        if (fromMiddle > limit) {
          forceX += (middleX - particle.x) * 9
          forceY += (middleY - particle.y) * 9
        }

        if (pointer) {
          const awayX = particle.x - pointer.x
          const awayY = particle.y - pointer.y
          const distance = Math.hypot(awayX, awayY) || 1
          if (distance < POINTER_REACH) {
            const push = ((POINTER_REACH - distance) / POINTER_REACH) * 2600
            forceX += (awayX / distance) * push
            forceY += (awayY / distance) * push
          }
        }

        particle.vx = (particle.vx + forceX * seconds) * damping
        particle.vy = (particle.vy + forceY * seconds) * damping
        particle.x += particle.vx * seconds
        particle.y += particle.vy * seconds
      }
    }

    function draw() {
      const dark = document.documentElement.classList.contains('dark')
      context!.clearRect(0, 0, width, height)
      context!.globalCompositeOperation = dark ? 'lighter' : 'source-over'

      context!.lineWidth = 0.6
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const first = particles[i]
          const second = particles[j]
          const distance = Math.hypot(first.x - second.x, first.y - second.y)
          if (distance > LINK_DISTANCE) continue
          context!.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.3
          context!.strokeStyle = first.color
          context!.beginPath()
          context!.moveTo(first.x, first.y)
          context!.lineTo(second.x, second.y)
          context!.stroke()
        }
      }

      context!.globalAlpha = 1
      context!.lineCap = 'round'
      for (const particle of particles) {
        // The tail grows with speed, and a dot at rest stays a dot.
        context!.strokeStyle = particle.color
        context!.lineWidth = particle.size * 2
        context!.beginPath()
        context!.moveTo(particle.x - particle.vx * TAIL_SECONDS, particle.y - particle.vy * TAIL_SECONDS)
        context!.lineTo(particle.x, particle.y)
        context!.stroke()
      }
    }

    function tick(now: number) {
      // A long pause, such as a hidden tab, must not become one huge jump.
      const seconds = Math.min(Math.max(now - last, 0) / 1000, 0.033)
      last = now
      step(seconds)
      draw()
      frame = requestAnimationFrame(tick)
    }

    function start() {
      if (still || frame || !visible || document.hidden) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    function stop() {
      cancelAnimationFrame(frame)
      frame = 0
    }

    function resize() {
      const box = canvas!.getBoundingClientRect()
      const scale = Math.min(window.devicePixelRatio, 2)
      const first = width === 0
      width = box.width
      height = box.height
      canvas!.width = Math.round(width * scale)
      canvas!.height = Math.round(height * scale)
      context!.setTransform(scale, 0, 0, scale, 0, 0)
      if (still) {
        for (const particle of particles) {
          const { x, y } = target(particle)
          Object.assign(particle, { x, y })
        }
        draw()
      } else if (first) {
        spread()
      }
    }

    const toggleVisible = ([entry]: IntersectionObserverEntry[]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    }
    const toggleHidden = () => (document.hidden ? stop() : start())

    const resizeObserver = new ResizeObserver(resize)
    const intersectionObserver = new IntersectionObserver(toggleVisible)
    resize()
    resizeObserver.observe(canvas)
    intersectionObserver.observe(canvas)
    document.addEventListener('visibilitychange', toggleHidden)
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', toggleHidden)
    }
  }, [])

  function trackPointer(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    pointerRef.current = { x: event.clientX - box.left, y: event.clientY - box.top }
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="size-full cursor-pointer touch-pan-y [mask-image:radial-gradient(circle_closest-side,black_80%,transparent_100%)]"
      onPointerMove={trackPointer}
      onPointerLeave={() => {
        pointerRef.current = null
      }}
      onPointerDown={() => scatterRef.current()}
    />
  )
}
