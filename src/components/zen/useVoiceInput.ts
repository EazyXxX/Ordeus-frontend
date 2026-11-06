import { useEffect, useRef, useState } from 'react'

import { request } from '@/lib/api'
import { toWav } from './audio'

const MAX_RECORDING_SECONDS = 600

const transcribeAudio = (wav: Blob) =>
  request<{ text: string }>('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wav,
  })

type Status = 'idle' | 'recording' | 'transcribing'

function describeError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') return 'Нет доступа к микрофону. Разрешите его в настройках браузера.'
    if (error.name === 'NotFoundError') return 'Микрофон не найден.'
  }
  return 'Не удалось распознать речь. Проверьте, что Ollama запущена и выбранная модель понимает аудио.'
}

export function useVoiceInput(onText: (text: string) => void) {
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const mounted = useRef(true)
  const deliver = useRef(onText)

  useEffect(() => {
    deliver.current = onText
  })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      window.clearInterval(timer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
    }
  }, [])

  async function transcribe(recording: Blob) {
    try {
      const { text } = await transcribeAudio(await toWav(recording))
      if (mounted.current && text) deliver.current(text)
    } catch (cause) {
      if (mounted.current) setError(describeError(cause))
    } finally {
      if (mounted.current) setStatus('idle')
    }
  }

  function stop() {
    window.clearInterval(timer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }

  async function start() {
    setError('')
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
      const pieces: Blob[] = []
      const mediaRecorder = new MediaRecorder(microphone)
      mediaRecorder.ondataavailable = (event) => pieces.push(event.data)
      mediaRecorder.onstop = () => {
        // Releasing the tracks turns off the system microphone indicator.
        microphone.getTracks().forEach((track) => track.stop())
        if (!mounted.current) return
        setStream(null)
        setStatus('transcribing')
        void transcribe(new Blob(pieces, { type: mediaRecorder.mimeType }))
      }
      mediaRecorder.start()
      recorder.current = mediaRecorder

      setStream(microphone)
      setSeconds(0)
      setStatus('recording')
      const startedAt = Date.now()
      timer.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        setSeconds(elapsed)
        if (elapsed >= MAX_RECORDING_SECONDS) stop()
      }, 1000)
    } catch (cause) {
      setError(describeError(cause))
    }
  }

  return { status, seconds, error, stream, start, stop, clearError: () => setError('') }
}
