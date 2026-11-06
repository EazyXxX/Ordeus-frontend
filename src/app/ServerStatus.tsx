import { useQuery } from '@tanstack/react-query'

import { t } from '@/i18n'
import { fetchHealth } from '@/lib/api'
import { cn } from '@/lib/utils'

const REFRESH_INTERVAL_MS = 10_000

export function ServerStatus() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  })

  const healthy = data?.database === 'up' && !isError
  const label = isPending
    ? t('server.checking')
    : isError
      ? t('server.down')
      : healthy
        ? t('server.up')
        : t('server.dbDown')

  return (
    <div role="status" title={label} className="flex h-8 items-center gap-2 px-2 text-xs text-muted-foreground">
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          isPending ? 'bg-muted-foreground' : healthy ? 'bg-emerald-500' : 'bg-red-500',
        )}
      />
      <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
    </div>
  )
}
