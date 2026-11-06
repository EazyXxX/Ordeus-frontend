import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

export type Capture = {
  id: string
  text: string
  status: 'pending' | 'processing' | 'failed'
  error: string
  createdAt: string
}

const POLL_INTERVAL_MS = 2_000

const isActive = (capture: Capture) => capture.status !== 'failed'

type CapturesOptions = {
  queryKey: QueryKey
  fetchCaptures: () => Promise<Capture[]>
  // What to refresh once the model finishes a capture.
  resultKey: QueryKey
  doneMessage: string
  failedMessage: string
}

// Polls while the model is working.
export function useCaptures({ queryKey, fetchCaptures, resultKey, doneMessage, failedMessage }: CapturesOptions) {
  const queryClient = useQueryClient()
  const { data: captures = [] } = useQuery({
    queryKey,
    queryFn: fetchCaptures,
    refetchInterval: (query) => (query.state.data?.some(isActive) ? POLL_INTERVAL_MS : false),
  })

  const active = captures.filter(isActive).length
  const failed = captures.filter((capture) => capture.status === 'failed')
  const previous = useRef({ active, failed: failed.length })
  const messages = useRef({ resultKey, doneMessage, failedMessage })

  useEffect(() => {
    const finished = previous.current.active - active
    if (finished > 0) {
      const newlyFailed = failed.length - previous.current.failed
      if (newlyFailed > 0) toast.error(messages.current.failedMessage)
      if (finished > newlyFailed) toast.success(messages.current.doneMessage)
      void queryClient.invalidateQueries({ queryKey: messages.current.resultKey })
    }
    previous.current = { active, failed: failed.length }
  }, [active, failed.length, queryClient])

  return { active, failed }
}
