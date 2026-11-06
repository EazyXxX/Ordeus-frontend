import { useQueryClient } from '@tanstack/react-query'

import { useCaptures } from '@/components/zen/useCaptures'
import { ZenComposer } from '@/components/zen/ZenComposer'
import { CAPTURES_KEY, createCapture, fetchCaptures, LIBRARY_KEY } from './api'

export function ZenMode() {
  const queryClient = useQueryClient()
  const { active } = useCaptures({
    queryKey: CAPTURES_KEY,
    fetchCaptures,
    resultKey: LIBRARY_KEY,
    doneMessage: 'Запись в дневнике',
    failedMessage: 'Не удалось разобрать запись. Текст сохранён в разделе «Записи».',
  })

  return (
    <ZenComposer
      section="diary"
      heading={(name) => `О чём думаешь, ${name}?`}
      placeholder="Запиши всё, что в голове"
      idleStatus="Нейросеть сама разложит по папкам и тегам"
      activeStatus={(count) => `Раскладываю по полочкам: ${count}`}
      acceptedTitle="Запись принята"
      acceptedDescription="Нейросеть разложит её по папкам и тегам."
      active={active}
      onSubmit={createCapture}
      onSent={() => queryClient.invalidateQueries({ queryKey: CAPTURES_KEY })}
    />
  )
}
