import imageCompression from 'browser-image-compression';

// Formatea el tamaño de archivo en una cadena legible
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Hook para optimizar y previsualizar imágenes
export function useImageOptimizer() {
  const optimizeAndPreview = async (
    file: File,
    options?: {
      maxSizeMB?: number;
      maxWidthOrHeight?: number;
    }
  ): Promise<{ optimizedFile: File; previewUrl: string }> => {
    try {
      const optimizedFile = await imageCompression(file, {
        maxSizeMB: options?.maxSizeMB || 0.5,
        maxWidthOrHeight: options?.maxWidthOrHeight || 1200,
        useWebWorker: true,
      });
      const previewUrl = URL.createObjectURL(optimizedFile);
      return { optimizedFile, previewUrl };
    } catch (error) {
      console.error('Error en useImageOptimizer:', error);
      throw error;
    }
  };

  return { optimizeAndPreview };
} 