export const MAX_NOTE_IMAGES = 10

// Phone photos are 4–8 MB. Shrunk to this size they stay sharp on any screen
// and take a tenth of the space on the server.
const MAX_SIDE = 2560
const KEEP_BYTES = 1.5 * 1024 * 1024
const KEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const imageUrl = (id: string) => `/api/diary/images/${id}`

export const isImage = (file: File) => file.type.startsWith('image/')

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85))
}

// A GIF stays as it is, so it keeps moving. A picture the browser cannot open
// goes as it is too, and the server says whether it takes it.
export async function prepareImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= KEEP_BYTES && KEPT_TYPES.includes(file.type)) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  // Older Safari quietly makes a PNG when asked for WebP, which is far larger.
  const webp = await toBlob(canvas, 'image/webp')
  if (webp?.type === 'image/webp') return webp
  return (await toBlob(canvas, 'image/jpeg')) ?? file
}
