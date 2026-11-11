import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { t } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

type ImageViewerProps = {
  urls: string[]
  start: number
  onClose: () => void
}

// Pictures of a note one at a time, full size. Arrow keys flip through them.
export function ImageViewer({ urls, start, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(start)
  const many = urls.length > 1
  const go = (step: number) => setIndex((current) => (current + step + urls.length) % urls.length)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[95svh] w-auto max-w-[95vw] flex-col items-center gap-3 p-3 sm:max-w-[95vw]"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') go(-1)
          if (event.key === 'ArrowRight') go(1)
        }}
      >
        <DialogTitle className="sr-only">{t('image.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('image.counter', { index: index + 1, total: urls.length })}</DialogDescription>
        <img src={urls[index]} alt="" className="max-h-[82svh] max-w-full rounded-md object-contain" />
        {many && (
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon-sm" aria-label={t('image.previous')} onClick={() => go(-1)}>
              <ChevronLeft />
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {t('image.counter', { index: index + 1, total: urls.length })}
            </span>
            <Button variant="outline" size="icon-sm" aria-label={t('image.next')} onClick={() => go(1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
