import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import * as api from './api'
import { DAYS_KEY, type Day } from './api'

const POLL_INTERVAL_MS = 2_000

const isWorking = ({ summaryStatus }: Day) => summaryStatus === 'pending' || summaryStatus === 'processing'

export function useDays() {
  const query = useQuery({
    queryKey: DAYS_KEY,
    queryFn: api.fetchDays,
    refetchInterval: (state) => (state.state.data?.some(isWorking) ? POLL_INTERVAL_MS : false),
  })
  const byDate = useMemo(() => new Map((query.data ?? []).map((day) => [day.date, day])), [query.data])
  return { ...query, byDate }
}
