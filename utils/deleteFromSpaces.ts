import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-config";

export async function deleteFromSpaces(key: string): Promise<void> {
  const bucket = process.env.DO_SPACES_BUCKET!;

  console.log('🔧 deleteFromSpaces - Configuración:');
  console.log('  - Bucket:', bucket);
  console.log('  - Key:', key);
  console.log('  - Endpoint:', process.env.DO_SPACES_ENDPOINT);

  try {
    // Verificar si el archivo existe
    console.log('🔍 Verificando si el archivo existe...');
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    console.log('✅ Archivo encontrado, procediendo a eliminar...');

    // Eliminar el archivo
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    console.log('✅ Archivo eliminado exitosamente:', key);
  } catch (error: any) {
    if (error.name === 'NotFound') {
      console.warn('⚠️ El archivo no existe en Spaces:', key);
      return; // No es un error crítico si el archivo no existe
    }
    console.error('❌ Error en deleteFromSpaces:', {
      bucket,
      key,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`No se pudo eliminar el archivo ${key} del bucket ${bucket}: ${error.message}`);
  }
}