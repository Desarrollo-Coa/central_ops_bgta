import { S3Client } from '@aws-sdk/client-s3';

// Configuración centralizada para DigitalOcean Spaces
const s3Config = {
  region: process.env.DO_SPACES_REGION!,
  endpoint: process.env.DO_SPACES_ENDPOINT!.startsWith('http')
    ? process.env.DO_SPACES_ENDPOINT!
    : `https://${process.env.DO_SPACES_ENDPOINT!}`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false,
};

// Cliente S3 centralizado
export const s3Client = new S3Client(s3Config);

// Configuración exportada para casos especiales
export const s3ConfigData = s3Config;

// Función helper para obtener la URL completa de un archivo
export function getFileUrl(fileName: string, folder?: string): string {
  const bucket = process.env.DO_SPACES_BUCKET!;
  const endpoint = s3ConfigData.endpoint;
  const path = folder ? `${folder}/${fileName}` : fileName;
  return `${endpoint}/${bucket}/${path}`;
}
