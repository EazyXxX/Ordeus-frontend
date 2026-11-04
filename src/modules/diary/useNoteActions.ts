import { useMutation, useQueryClient } from '@tanstack/react-query'

import * as api from './api'
import { LIBRARY_KEY, type Note, type NoteInput } from './api'

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
    saveNote: (note: Note | null, input: NoteInput) =>
      save(() => (note ? api.updateNote(note.id, input) : api.createNote(input))),
    removeNote: (note: Note) => save(() => api.deleteNote(note.id)),
  }
}
