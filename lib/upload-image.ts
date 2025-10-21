/**
 * Uploads an image file for cement reports to Digital Ocean Spaces
 * @param file The file to upload
 * @returns Promise<string> The URL where the image was saved
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    // Validate file type
    if (!isValidImage(file)) {
      throw new Error('El archivo debe ser una imagen válida (JPEG, PNG, GIF, WebP)')
    }

    // Validate file size
    if (!isValidImageSize(file)) {
      throw new Error('La imagen no debe superar los 5MB')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/novedades/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al subir la imagen')
    }

    const data = await response.json()
    return data.url
  } catch (error: any) {
    console.error('Error al subir imagen:', error)
    throw new Error(`Error al subir imagen: ${error.message}`)
  }
}

/**
 * Validates if a file is a valid image
 * @param file The file to validate
 * @returns boolean Whether the file is a valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Validates image size (max 5MB)
 * @param file The file to validate
 * @returns boolean Whether the file size is valid
 */
export function isValidImageSize(file: File): boolean {
  const maxSize = 5 * 1024 * 1024 // 5MB
  return file.size <= maxSize
} 