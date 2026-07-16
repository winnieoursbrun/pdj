import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pdj26-pass'
const MAX_DIMENSION = 1400
const JPEG_QUALITY = 0.85

function load(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('lecture impossible'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image invalide'))
    img.src = src
  })
}

// Redimensionne côté client avant stockage en localStorage : une photo de
// billet peut peser plusieurs Mo, largement au-dessus du quota (~5 Mo).
async function resizeForStorage(file: File): Promise<string> {
  const original = await readAsDataURL(file)
  const img = await loadImage(original)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return original
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export function usePass() {
  const [pass, setPass] = useState<string | null>(load)

  const importFile = useCallback(async (file: File) => {
    const resized = await resizeForStorage(file)
    localStorage.setItem(STORAGE_KEY, resized)
    setPass(resized)
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPass(null)
  }, [])

  return { pass, importFile, clear }
}
