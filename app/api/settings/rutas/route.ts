import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { uploadToSpaces } from '@/utils/uploadToSpaces';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return (payload.role as string)?.toLowerCase() === 'administrador';
  } catch (error) {
    return false;
  }
}

export async function GET() {
  try {
    const [modules] = await pool.query(
      'SELECT * FROM modulos ORDER BY nombre'
    );
    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    return NextResponse.json(
      { error: 'Error al obtener módulos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('imagen') as File;
    const nombre = formData.get('nombre') as string;
    const descripcion = formData.get('descripcion') as string;
    const icono = formData.get('icono') as string;
    const activo = formData.get('activo') as string;
    const acepta_subrutas = formData.get('acepta_subrutas') as string;
    const ruta = formData.get('ruta') as string;

    console.log('Datos recibidos:', {
      nombre,
      descripcion,
      icono,
      activo,
      acepta_subrutas,
      ruta,
      tieneImagen: !!file
    });

    let imagen_url = '';
    
    if (file) {
      console.log('Procesando imagen...');
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = `${Date.now()}-${file.name}`;
      console.log('Key generada:', key);
              imagen_url = await uploadToSpaces(
        buffer,
        key,
        file.type,
        'modulos/rutas'
      );
      console.log('URL completa devuelta por DigitalOcean:', imagen_url);
      console.log('Componentes de la URL:', {
        bucket: process.env.DO_SPACES_BUCKET,
        endpoint: process.env.DO_SPACES_ENDPOINT,
        path: `modulos/rutas/${key}`
      });
    }

    console.log('Ruta recibida:', ruta);

    const [result] = await pool.query(
      'INSERT INTO modulos (nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas]
    ) as [ResultSetHeader, any];

    console.log('Resultado de la inserción:', result);

    if (result.affectedRows === 0) {
      console.error('No se pudo insertar el módulo');
      return NextResponse.json(
        { error: 'No se pudo crear el módulo' },
        { status: 500 }
      );
    }

    const newModule = {
      id: result.insertId,
      nombre,
      descripcion,
      ruta,
      imagen_url,
      icono,
      activo,
      acepta_subrutas
    };

    console.log('Módulo creado:', newModule);

    return NextResponse.json({ 
      success: true, 
      data: newModule,
      message: 'Módulo creado correctamente'
    });
  } catch (error) {
    console.error('Error al crear módulo:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 