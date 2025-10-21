import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToSpaces } from '@/utils/uploadToSpaces';
import { deleteFromSpaces } from '@/utils/deleteFromSpaces';
import { ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('imagen') as File;
    const nombre = formData.get('nombre') as string;
    const descripcion = formData.get('descripcion') as string;
    const icono = formData.get('icono') as string;
    const activo = formData.get('activo') as string;
    const acepta_subrutas = formData.get('acepta_subrutas') as string;
    const ruta = formData.get('ruta') as string;

    console.log('Datos recibidos para edición:', {
      id,
      nombre,
      descripcion,
      icono,
      activo,
      acepta_subrutas,
      ruta,
      tieneImagen: !!file
    });

    let imagen_url = '';
    let oldImageUrl = '';
    
    // Obtener la URL de la imagen actual
    const [rows] = await pool.query(
      'SELECT imagen_url FROM modulos WHERE id = ?',
      [id]
    ) as [any[], any];
    
    if (rows.length > 0) {
      oldImageUrl = rows[0].imagen_url;
    }
    
    if (file) {
      console.log('Procesando nueva imagen...');
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = `${Date.now()}-${file.name}`;
              imagen_url = await uploadToSpaces(
        buffer,
        key,
        file.type,
        'modulos/rutas'
      );
      console.log('Nueva imagen subida:', imagen_url);

      // Si hay una imagen anterior, eliminarla
      if (oldImageUrl) {
        try {
          // Extraer la clave del archivo de la URL
          const oldKey = oldImageUrl.split('/').slice(-3).join('/');
          await deleteFromSpaces(oldKey);
          console.log('Imagen anterior eliminada:', oldKey);
        } catch (error) {
          console.error('Error al eliminar imagen anterior:', error);
          // No lanzamos el error para no interrumpir el proceso de actualización
        }
      }
    } else if (oldImageUrl) {
      // Si no hay nueva imagen, mantener la URL existente
      imagen_url = oldImageUrl;
      console.log('Manteniendo URL de imagen existente:', imagen_url);
    }

    // Eliminar la generación automática de ruta
    // const ruta = nombre.toLowerCase().replace(/\s+/g, '-');
    console.log('Ruta recibida:', ruta);

    const [result] = await pool.query(
      'UPDATE modulos SET nombre = ?, descripcion = ?, ruta = ?, imagen_url = ?, icono = ?, activo = ?, acepta_subrutas = ? WHERE id = ?',
      [nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas, id]
    ) as [ResultSetHeader, any];

    console.log('Resultado de la actualización:', result);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    const updatedModule = {
      id: parseInt(id),
      nombre,
      descripcion,
      ruta,
      imagen_url,
      icono,
      activo,
      acepta_subrutas
    };

    console.log('Módulo actualizado:', updatedModule);

    return NextResponse.json({
      success: true,
      data: updatedModule,
      message: 'Módulo actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar módulo', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    
    // Primero obtenemos la URL de la imagen
    const [rows] = await pool.query(
      'SELECT imagen_url FROM modulos WHERE id = ?',
      [id]
    ) as [any[], any];

    if (rows.length > 0 && rows[0].imagen_url) {
      try {
        // Extraer la clave del archivo de la URL
        const key = rows[0].imagen_url.split('/').slice(-3).join('/');
        await deleteFromSpaces(key);
        console.log('Imagen eliminada:', key);
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
        // No lanzamos el error para no interrumpir el proceso de eliminación
      }
    }

    const [result] = await pool.query(
      'DELETE FROM modulos WHERE id = ?',
      [id]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar módulo' },
      { status: 500 }
    );
  }
} 