import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, getFileUrl } from "@/lib/s3-config";

/**
 * Sube un archivo a DigitalOcean Spaces, permitiendo especificar una carpeta.
 * @param fileBuffer Buffer del archivo a subir
 * @param fileName Nombre del archivo (con extensión)
 * @param mimeType Tipo MIME del archivo
 * @param folder Carpeta opcional donde guardar el archivo
 * @returns URL pública del archivo subido
 */
export async function uploadToSpaces(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folder?: string
): Promise<string> {
  const bucket = process.env.DO_SPACES_BUCKET!;
  const key = folder ? `${folder.replace(/\\|\/+$/g, '')}/${fileName}` : fileName;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ACL: "public-read",
      ContentType: mimeType,
    })
  );
  
  return getFileUrl(fileName, folder);
} 