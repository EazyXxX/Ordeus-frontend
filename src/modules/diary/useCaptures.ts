import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { CAPTURES_KEY, fetchCaptures, LIBRARY_KEY, type Capture } from './api'

const POLL_INTERVAL_MS = 2_000

const isActive = (capture: Capture) => capture.status !== 'failed'

// Polls while the model is working and refreshes the notes when it finishes.
export function useCaptures() {
  const queryClient = useQueryClient()
  const { data: captures = [] } = useQuery({
    queryKey: CAPTURES_KEY,
    queryFn: fetchCaptures,
    refetchInterval: (query) => (query.state.data?.some(isActive) ? POLL_INTERVAL_MS : false),
  })

  const active = captures.filter(isActive).length
  const previousActive = useRef(active)
  useEffect(() => {
    if (active < previousActive.current) {
      void queryClient.invalidateQueries({ queryKey: LIBRARY_KEY })
    }
    previousActive.current = active
  }, [active, queryClient])

  return { active, failed: captures.filter((capture) => capture.status === 'failed') }
}
