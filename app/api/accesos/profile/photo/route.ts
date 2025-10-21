import { NextRequest, NextResponse } from 'next/server';
import { uploadToSpaces } from '@/utils/uploadToSpaces';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
  try {
    // Verificar token JWT
    const authHeader = request.headers.get('authorization');
    
    // Obtener token del header o de cookies
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback: buscar token en cookies de vigilante
      const vigilanteTokenCookie = request.cookies.get('vigilante_token')?.value;
      if (vigilanteTokenCookie) {
        try {
          const sessionData = JSON.parse(vigilanteTokenCookie);
          token = sessionData.token;
        } catch (error) {
          console.error('Error parsing vigilante token:', error);
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    
    let colaboradorId: number;
    try {
      const { payload } = await jwtVerify(token, secret);
      colaboradorId = payload.id as number;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen válida (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 5MB' },
        { status: 400 }
      );
    }

    // Obtener foto anterior para eliminarla después
    const [colaboradores] = await pool.query(
      'SELECT foto_url FROM colaboradores WHERE id = ?',
      [colaboradorId]
    ) as [any[], any];

    const fotoAnterior = colaboradores[0]?.foto_url;

    // Convertir archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Optimizar imagen con sharp
    let optimizedBuffer: Buffer;
    let optimizedMimeType: string;
    let fileExtension: string;

    try {
      // Optimizar imagen: redimensionar a 400x400, convertir a WebP si es posible
      const optimizedImage = sharp(buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 }); // Convertir a WebP con calidad 80%

      optimizedBuffer = await optimizedImage.toBuffer();
      optimizedMimeType = 'image/webp';
      fileExtension = '.webp';
    } catch (optimizationError) {
      console.warn('Error optimizando imagen, usando original:', optimizationError);
      // Si falla la optimización, usar la imagen original
      optimizedBuffer = buffer;
      optimizedMimeType = file.type;
      fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    }

    // Generar nombre único para la imagen
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}${fileExtension}`;
    const folder = `colaboradores/${colaboradorId}`;

    // Subir nueva foto a DigitalOcean Spaces
          const nuevaFotoUrl = await uploadToSpaces(
      optimizedBuffer,
      fileName,
      optimizedMimeType,
      folder
    );

    // Actualizar URL en la base de datos
    const [updateResult] = await pool.query(
      'UPDATE colaboradores SET foto_url = ? WHERE id = ?',
      [nuevaFotoUrl, colaboradorId]
    ) as [any, any];

    // Verificar que la actualización fue exitosa
    if (updateResult.affectedRows === 0) {
      throw new Error('No se pudo actualizar la foto de perfil');
    }

    // Eliminar foto anterior si existe
    if (fotoAnterior) {
      try {
        // Extraer la clave del archivo anterior de la URL
        const urlParts = fotoAnterior.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        const oldFolder = `colaboradores/${colaboradorId}`;
        const oldKey = `${oldFolder}/${oldFileName}`;

        // Importar la función de eliminación
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        
        const s3Client = new S3Client({
          region: 'us-east-1',
          endpoint: process.env.DO_SPACES_ENDPOINT!.startsWith('http') 
            ? process.env.DO_SPACES_ENDPOINT 
            : `https://${process.env.DO_SPACES_ENDPOINT}`,
          credentials: {
            accessKeyId: process.env.DO_SPACES_KEY!,
            secretAccessKey: process.env.DO_SPACES_SECRET!,
          },
        });

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET!,
            Key: oldKey,
          })
        );

        console.log('Foto anterior eliminada:', oldKey);
      } catch (deleteError) {
        console.warn('Error eliminando foto anterior:', deleteError);
        // No fallar si no se puede eliminar la foto anterior
      }
    }

    console.log('Foto de perfil actualizada exitosamente:', {
      colaboradorId,
      fileName,
      nuevaFotoUrl,
      fotoAnterior,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(2) + '%'
    });

    return NextResponse.json({ 
      success: true,
      url: nuevaFotoUrl,
      fileName: fileName,
      optimized: optimizedMimeType === 'image/webp',
      message: 'Foto de perfil actualizada correctamente'
    });

  } catch (error: any) {
    console.error('Error al actualizar foto de perfil:', error);
    return NextResponse.json(
      { error: `Error al actualizar foto de perfil: ${error.message}` },
      { status: 500 }
    );
  }
} 