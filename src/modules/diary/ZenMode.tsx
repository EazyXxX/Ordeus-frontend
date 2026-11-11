import { useQueryClient } from '@tanstack/react-query'

import { t } from '@/i18n'
import { useCaptures } from '@/components/zen/useCaptures'
import { ZenComposer } from '@/components/zen/ZenComposer'
import { CAPTURES_KEY, createCapture, fetchCaptures, LIBRARY_KEY } from './api'
import { MAX_NOTE_IMAGES } from './images'

export function ZenMode() {
  const queryClient = useQueryClient()
  const { active } = useCaptures({
    queryKey: CAPTURES_KEY,
    fetchCaptures,
    resultKey: LIBRARY_KEY,
    doneMessage: t('diary.noteSaved'),
    failedMessage: t('diary.organizeFailed'),
  })

  return (
    <ZenComposer
      section="diary"
      heading={(name) => t('diary.zenHeading', { name })}
      placeholder={t('diary.zenPlaceholder')}
      idleStatus={t('diary.zenIdle')}
      activeStatus={(count) => t('diary.organizingCount', { count })}
      acceptedTitle={t('diary.accepted')}
      acceptedDescription={t('diary.acceptedText')}
      active={active}
      maxImages={MAX_NOTE_IMAGES}
      onSubmit={createCapture}
      onSent={() => queryClient.invalidateQueries({ queryKey: CAPTURES_KEY })}
    />
  )
}
