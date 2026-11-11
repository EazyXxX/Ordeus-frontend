import { useMutation, useQueryClient } from '@tanstack/react-query'

import * as api from './api'
import { LIBRARY_KEY, type ImageChanges, type Note, type NoteInput } from './api'
import { prepareImage } from './images'

export function useNoteActions() {
  const queryClient = useQueryClient()
  const { mutate: save, isError: saveFailed } = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LIBRARY_KEY })
    },
  })

  return {
    save,
    saveFailed,
    // A new note gets its pictures once it exists. They go one at a time, so a
    // slow connection is not asked for ten uploads at once.
    saveNote: (note: Note | null, input: NoteInput, images: ImageChanges = { added: [], removed: [] }) =>
      save(async () => {
        let id = note?.id
        if (id) await api.updateNote(id, input)
        else id = (await api.createNote(input)).id
        for (const removed of images.removed) await api.deleteImage(removed)
        for (const file of images.added) await api.uploadImage(id, await prepareImage(file))
      }),
    removeNote: (note: Note) => save(() => api.deleteNote(note.id)),
  }
}
