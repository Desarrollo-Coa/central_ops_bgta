import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const rawEndpoint = process.env.DO_SPACES_ENDPOINT!;
const spacesEndpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;
const s3 = new S3Client({
  region: "nyc3",
  endpoint: spacesEndpoint,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

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

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ACL: "public-read",
      ContentType: mimeType,
    })
  );
  return `${spacesEndpoint.replace(/^https?:\/\//, 'https://')}/${bucket}/${key}`;
} 