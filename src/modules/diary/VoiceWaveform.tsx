import { useEffect, useRef } from 'react'

const BAR_WIDTH = 3
const BAR_GAP = 3
const MIN_BAR_HEIGHT = 2
const SAMPLE_INTERVAL_MS = 50
const FFT_SIZE = 1024
// Speech rarely fills the full range, so quiet levels are scaled up to be visible.
const LEVEL_GAIN = 5

function measureLevel(analyser: AnalyserNode, samples: Float32Array<ArrayBuffer>) {
  analyser.getFloatTimeDomainData(samples)
  const power = samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length
  return Math.min(1, Math.sqrt(power) * LEVEL_GAIN)
}

function draw(canvas: HTMLCanvasElement, levels: number[]) {
  const context = canvas.getContext('2d')
  if (!context) return

  const scale = window.devicePixelRatio
  const { clientWidth: width, clientHeight: height } = canvas
  canvas.width = width * scale
  canvas.height = height * scale
  context.scale(scale, scale)
  context.fillStyle = getComputedStyle(canvas).color

  // The newest sound is on the right, and older sound scrolls to the left.
  const step = BAR_WIDTH + BAR_GAP
  const visible = levels.slice(-Math.ceil(width / step))
  visible.forEach((level, index) => {
    const barHeight = Math.max(MIN_BAR_HEIGHT, level * height)
    const x = width - (visible.length - index) * step
    context.beginPath()
    context.roundRect(x, (height - barHeight) / 2, BAR_WIDTH, barHeight, BAR_WIDTH / 2)
    context.fill()
  })
}

export function VoiceWaveform({ stream }: { stream: MediaStream }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const audio = new AudioContext()
    const analyser = audio.createAnalyser()
    analyser.fftSize = FFT_SIZE
    audio.createMediaStreamSource(stream).connect(analyser)

    const samples = new Float32Array(analyser.fftSize)
    const levels: number[] = []
    const sampler = window.setInterval(() => {
      levels.push(measureLevel(analyser, samples))
      if (canvas.current) draw(canvas.current, levels)
    }, SAMPLE_INTERVAL_MS)

    return () => {
      window.clearInterval(sampler)
      void audio.close()
    }
  }, [stream])

  return <canvas ref={canvas} aria-hidden className="h-10 w-full text-destructive" />
}
