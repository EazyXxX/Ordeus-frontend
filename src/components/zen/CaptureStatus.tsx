import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import type { Capture } from './useCaptures'

type CaptureStatusProps = {
  active: number
  failed: Capture[]
  activeLabel: string
  failedLabel: string
  queryKey: QueryKey
  onRetry: (id: string) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  // Saves the text as it is, without the model. Only the diary offers it.
  onKeep?: (id: string) => Promise<unknown>
  // Refreshed after onKeep, where the kept text shows up.
  keptKey?: QueryKey
}

// A cut-off answer is what a local model gives when the entry does not fit its
// context, so the author gets a hint instead of a parser error.
function describeError(error: string) {
  return error.includes('unexpected end of JSON') ? t('zen.tooLong') : error
}

export function CaptureStatus({
  active,
  failed,
  activeLabel,
  failedLabel,
  queryKey,
  onRetry,
  onDelete,
  onKeep,
  keptKey,
}: CaptureStatusProps) {
  const queryClient = useQueryClient()
  const { mutate: run } = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      if (keptKey) void queryClient.invalidateQueries({ queryKey: keptKey })
    },
  })

  if (active === 0 && failed.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {active > 0 && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {activeLabel}: {active}
        </p>
      )}
      {failed.map((capture) => (
        <div key={capture.id} role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="line-clamp-3 text-sm whitespace-pre-wrap">
            {capture.text || t('zen.photosOnly', { count: capture.images ?? 0 })}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {failedLabel} {describeError(capture.error)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => run(() => onRetry(capture.id))}>
              {t('common.retry')}
            </Button>
            {onKeep && (
              <Button size="sm" variant="outline" onClick={() => run(() => onKeep(capture.id))}>
                {t('zen.keepAsIs')}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => run(() => onDelete(capture.id))}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
