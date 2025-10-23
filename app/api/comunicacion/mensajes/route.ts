import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { uploadToSpaces } from '@/utils/uploadToSpaces';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('📨 [COMUNICACION] Recibiendo mensaje...');
    
    // Obtener token de las cookies (principal o vigilante)
    let token = request.cookies.get('token')?.value;
    
    // Si no hay token principal, intentar con token de vigilante
    if (!token) {
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

    // Verificar el token JWT
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que el token es válido (cualquier tipo de token autenticado)
      if (!payload) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 500 }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const contenido = formData.get('contenido') as string;
    const tipoMensaje = formData.get('tipoMensaje') as string; // 'texto' | 'audio'
    const idCumplido = formData.get('idCumplido') as string;
    const latitud = formData.get('latitud') as string;
    const longitud = formData.get('longitud') as string;
    const audioFile = formData.get('audioFile') as File | null;

    if (!contenido || !idCumplido) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    let audioUrl = null;
    let duracion = null;

    // Si es un mensaje de audio, procesar el archivo
    if (tipoMensaje === 'audio' && audioFile) {
      try {
        // Leer el archivo como buffer
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generar nombre único para el archivo
        const extension = audioFile.name.split('.').pop() || 'wav';
        const uuid = uuidv4();
        const fileName = `comunicacion_${idCumplido}_${uuid}.${extension}`;

        // Subir archivo a DigitalOcean Spaces
        audioUrl = await uploadToSpaces(
          buffer,
          fileName,
          audioFile.type || 'audio/wav',
          'comunicacion/audio'
        );

        // Calcular duración del audio (aproximada)
        duracion = Math.ceil(audioFile.size / 16000); // Estimación aproximada
      } catch (error) {
        console.error('Error procesando archivo de audio:', error);
        return NextResponse.json(
          { error: 'Error al procesar el archivo de audio' },
          { status: 500 }
        );
      }
    }

    // Obtener el tipo de archivo para mensajes de reporte
    let tipoArchivoId = null;
    
    if (tipoMensaje === 'audio') {
      // Buscar tipo de archivo para audio de reporte (AR)
      const [tiposAudio] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM tipo_archivo WHERE codigo = "AR" AND activo = TRUE'
      );
      if (tiposAudio.length > 0) {
        tipoArchivoId = tiposAudio[0].id;
      }
    } else {
      // Buscar tipo de archivo para mensaje de reporte (MR)
      const [tiposMensaje] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM tipo_archivo WHERE codigo = "MR" AND activo = TRUE'
      );
      if (tiposMensaje.length > 0) {
        tipoArchivoId = tiposMensaje[0].id;
      }
    }

    if (!tipoArchivoId) {
      return NextResponse.json(
        { error: 'Tipo de archivo no encontrado' },
        { status: 404 }
      );
    }

    // Insertar mensaje en la tabla file_rc
    const [result] = await pool.query(
      `INSERT INTO file_rc (
        id_cumplido,
        tipo_id,
        url,
        latitud,
        longitud,
        descripcion,
        id_usuario
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idCumplido,
        tipoArchivoId,
        audioUrl,
        latitud || null,
        longitud || null,
        contenido,
        null // id_usuario (se puede obtener del token si es necesario)
      ]
    );

    const mensajeId = (result as any).insertId;

    console.log('✅ [COMUNICACION] Mensaje guardado exitosamente:', {
      id: mensajeId,
      tipo: tipoMensaje,
      tieneAudio: !!audioUrl
    });

    return NextResponse.json({ 
      success: true,
      mensajeId,
      audioUrl
    });

  } catch (error) {
    console.error('Error al guardar mensaje de comunicación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📨 [COMUNICACION] Obteniendo mensajes...');
    
    // Obtener token de las cookies (principal o vigilante)
    let token = request.cookies.get('token')?.value;
    
    // Si no hay token principal, intentar con token de vigilante
    if (!token) {
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

    // Verificar el token JWT
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que el token es válido (cualquier tipo de token autenticado)
      if (!payload) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const idCumplido = searchParams.get('idCumplido');

    if (!idCumplido) {
      return NextResponse.json(
        { error: 'ID de cumplido requerido' },
        { status: 400 }
      );
    }

    // Obtener mensajes de la base de datos usando la tabla file_rc
    const [mensajes] = await pool.query<RowDataPacket[]>(
      `SELECT 
        fr.id,
        fr.descripcion as contenido,
        ta.codigo,
        m.nombre as medio,
        fr.url as audio_url,
        fr.latitud,
        fr.longitud,
        fr.fecha_creacion,
        c.id_colaborador,
        col.nombre as colaborador_nombre,
        col.apellido as colaborador_apellido,
        CASE 
          WHEN ta.codigo = 'AR' THEN 'audio'
          WHEN ta.codigo = 'MR' THEN 'texto'
          ELSE 'texto'
        END as tipo_mensaje
       FROM file_rc fr
       JOIN cumplidos c ON fr.id_cumplido = c.id_cumplido
       LEFT JOIN colaboradores col ON c.id_colaborador = col.id
       JOIN tipo_archivo ta ON fr.tipo_id = ta.id
       JOIN medios m ON ta.medio_id = m.id
       WHERE fr.id_cumplido = ?
       AND ta.codigo IN ('AR', 'MR')
       AND ta.activo = TRUE
       ORDER BY fr.fecha_creacion ASC`,
      [idCumplido]
    );

    console.log('✅ [COMUNICACION] Mensajes obtenidos:', mensajes.length);

    return NextResponse.json({ mensajes });

  } catch (error) {
    console.error('Error al obtener mensajes de comunicación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 