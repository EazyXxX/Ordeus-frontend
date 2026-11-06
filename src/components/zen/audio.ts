const TARGET_SAMPLE_RATE = 16_000
const BYTES_PER_SAMPLE = 2
const WAV_HEADER_SIZE = 44

function writeText(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
}

function encodeWav(samples: Float32Array) {
  const dataSize = samples.length * BYTES_PER_SAMPLE
  const view = new DataView(new ArrayBuffer(WAV_HEADER_SIZE + dataSize))

  writeText(view, 0, 'RIFF')
  view.setUint32(4, WAV_HEADER_SIZE - 8 + dataSize, true)
  writeText(view, 8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, TARGET_SAMPLE_RATE, true)
  view.setUint32(28, TARGET_SAMPLE_RATE * BYTES_PER_SAMPLE, true)
  view.setUint16(32, BYTES_PER_SAMPLE, true)
  view.setUint16(34, 8 * BYTES_PER_SAMPLE, true)
  writeText(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(WAV_HEADER_SIZE + index * BYTES_PER_SAMPLE, clamped * 0x7fff, true)
  })
  return new Blob([view], { type: 'audio/wav' })
}

// Browsers record compressed audio. The server takes one simple format, so the
// recording is converted here: 16 kHz, mono, 16-bit WAV.
export async function toWav(recording: Blob) {
  const context = new AudioContext()
  try {
    const decoded = await context.decodeAudioData(await recording.arrayBuffer())
    const length = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE)
    const offline = new OfflineAudioContext(1, length, TARGET_SAMPLE_RATE)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    return encodeWav((await offline.startRendering()).getChannelData(0))
  } finally {
    void context.close()
  }
}
