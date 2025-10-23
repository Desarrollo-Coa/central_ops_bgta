import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { s3Client, getFileUrl } from '@/lib/s3-config'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen válida (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      )
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 5MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'))
    const uniqueId = uuidv4()
    
    const fileName = `novedades/imagenes/${uniqueId}${fileExtension}`
    const fileUrl = getFileUrl(fileName)

    console.log('Subiendo imagen a DigitalOcean Spaces:', {
      bucket: process.env.DO_SPACES_BUCKET,
      fileName,
      fileType: file.type,
      uniqueId,
      originalName,
      fullPath: fileUrl
    })

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: fileName,
        Body: buffer,
        ACL: 'public-read',
        ContentType: file.type
      })
    )

    console.log('Imagen subida exitosamente:', fileUrl)
    return NextResponse.json({ url: fileUrl })
  } catch (error: any) {
    console.error('Error al subir imagen:', error)
    return NextResponse.json(
      { error: `Error al subir imagen: ${error.message}` },
      { status: 500 }
    )
  }
} 