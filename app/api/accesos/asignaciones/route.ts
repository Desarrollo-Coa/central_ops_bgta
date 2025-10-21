import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación para vigilantes
    const authHeader = request.headers.get('authorization');
    const negocioHashHeader = request.headers.get('x-negocio-hash');

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

    if (!negocioHashHeader) {
      return NextResponse.json(
        { error: 'Hash de negocio requerido' },
        { status: 400 }
      );
    }

    try {
      // Verificar el token JWT
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que es un token de vigilante
      if (payload.tipo !== 'vigilante') {
        return NextResponse.json(
          { error: 'Token inválido para vigilantes' },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Error al procesar el JSON del request' },
        { status: 400 }
      );
    }

    const { id_puesto, fecha, id_tipo_turno, id_colaborador } = body;

    console.log('Datos recibidos en asignaciones:', { id_puesto, fecha, id_tipo_turno, id_colaborador });

    if (!id_puesto || !fecha || !id_tipo_turno) {
      return NextResponse.json(
        { error: 'Se requieren id_puesto, fecha e id_tipo_turno' },
        { status: 400 }
      );
    }

    // Obtener el ID del colaborador desde el token si no se proporciona
    let colaboradorId = id_colaborador;
    if (colaboradorId === undefined || colaboradorId === null) {
      // Si se envía explícitamente null, mantenerlo como null (para quitar asignación)
      if (id_colaborador === null) {
        colaboradorId = null;
      } else {
        // Solo obtener del token si no se proporciona ningún valor
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
          const { payload } = await jwtVerify(token, secret);
          colaboradorId = payload.id as number;
        } catch (error) {
          console.error('Error obteniendo colaborador del token:', error);
          return NextResponse.json(
            { error: 'No se pudo obtener el ID del colaborador del token' },
            { status: 400 }
          );
        }
      }
    }

    // Validar que id_puesto e id_tipo_turno sean números
    if (isNaN(Number(id_puesto)) || isNaN(Number(id_tipo_turno))) {
      return NextResponse.json(
        { error: 'id_puesto e id_tipo_turno deben ser números válidos' },
        { status: 400 }
      );
    }

    let fechaFormateada;
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        throw new Error('Fecha inválida');
      }
      fechaFormateada = fechaObj.toISOString().split('T')[0];
    } catch (e) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    console.log('Verificando registro existente para:', { id_puesto, fechaFormateada, id_tipo_turno });

    // Verificar si ya existe un registro para este puesto, fecha y turno
    const [existing] = await pool.query(
      'SELECT id_cumplido FROM cumplidos WHERE id_puesto = ? AND fecha = ? AND id_tipo_turno = ?',
      [id_puesto, fechaFormateada, id_tipo_turno]
    ) as [any[], any];

    console.log('Registro existente encontrado:', existing);

    // VALIDACIÓN EXCLUSIVA PARA VIGILANTES: Verificar si el colaborador ya tiene otro turno asignado
    if (colaboradorId) {
      const [otrosTurnos] = await pool.query(
        'SELECT id_tipo_turno FROM cumplidos WHERE id_puesto = ? AND fecha = ? AND id_colaborador = ? AND id_tipo_turno != ?',
        [id_puesto, fechaFormateada, colaboradorId, id_tipo_turno]
      ) as [any[], any];

      console.log('Otros turnos del colaborador:', otrosTurnos);

      if (otrosTurnos && otrosTurnos.length > 0) {
        return NextResponse.json(
          { error: 'Ya tienes otro turno asignado. Debes quitar la asignación actual antes de asignar uno nuevo.' },
          { status: 400 }
        );
      }
    }

    if (existing && existing.length > 0) {
      // Si el colaborador es vacío/null, aplicar lógica de limpieza SOLO en actualización
      if (colaboradorId === undefined || colaboradorId === null || (typeof colaboradorId === 'string' && colaboradorId.trim() === '')) {
        const registroExistente = existing[0];
        console.log('Intentando quitar asignación para registro:', registroExistente.id_cumplido);
        
        // Verificar si hay notas asociadas al registro
        const [notas] = await pool.query(
          'SELECT id_nota FROM notas_cumplidos WHERE id_cumplido = ?',
          [registroExistente.id_cumplido]
        ) as [any[], any];
        
        console.log('Notas encontradas para el registro:', notas);
        
        if (!notas || notas.length === 0) {
          // Verificar si hay archivos asociados al cumplido
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const verifyUrl = `${baseUrl}/api/cumplidos/verificar-archivos?idCumplido=${registroExistente.id_cumplido}`;
            console.log('Verificando archivos:', verifyUrl);
            
            const archivosResponse = await fetch(verifyUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (archivosResponse.ok) {
              const archivosData = await archivosResponse.json();
              console.log('Verificación de archivos:', archivosData);
              
              if (archivosData.tieneArchivos) {
                return NextResponse.json({ 
                  success: false, 
                  error: 'No puedes quitar este turno porque ya tienes fotos o audios vinculados. Comunícate con la central para solicitar la eliminación.',
                  tieneArchivos: true,
                  totalArchivos: archivosData.totalArchivos
                }, { status: 400 });
              }
            } else {
              console.error('Error verificando archivos:', archivosResponse.status);
            }
          } catch (error) {
            console.error('Error al verificar archivos:', error);
            // Por seguridad, si no se puede verificar, no permitir eliminar
            return NextResponse.json({ 
              success: false, 
              error: 'No se pudo verificar los archivos asociados. Comunícate con la central para solicitar la eliminación.',
              errorVerificacion: true
            }, { status: 400 });
          }
          
          // Si no hay archivos, proceder con la eliminación
          console.log('Eliminando registro completo por no tener notas ni archivos');
          
          await pool.query(
            'DELETE FROM cumplidos WHERE id_cumplido = ?',
            [registroExistente.id_cumplido]
          );
          return NextResponse.json({ success: true, deleted: true, id_cumplido: registroExistente.id_cumplido, message: 'Asignación removida correctamente' });
        } else {
          // Si hay notas, verificar archivos antes de limpiar el colaborador
          console.log('Registro tiene notas, verificando archivos antes de limpiar colaborador');
          
          // Verificar si hay archivos asociados al cumplido
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const verifyUrl = `${baseUrl}/api/cumplidos/verificar-archivos?idCumplido=${registroExistente.id_cumplido}`;
            console.log('Verificando archivos (con notas):', verifyUrl);
            
            const archivosResponse = await fetch(verifyUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (archivosResponse.ok) {
              const archivosData = await archivosResponse.json();
              console.log('Verificación de archivos (con notas):', archivosData);
              
              if (archivosData.tieneArchivos) {
                return NextResponse.json({ 
                  success: false, 
                  error: 'No puedes quitar este turno porque ya tienes fotos o audios vinculados. Comunícate con la central para solicitar la eliminación.',
                  tieneArchivos: true,
                  totalArchivos: archivosData.totalArchivos
                }, { status: 400 });
              }
            } else {
              console.error('Error verificando archivos (con notas):', archivosResponse.status);
            }
          } catch (error) {
            console.error('Error al verificar archivos (con notas):', error);
            // Por seguridad, si no se puede verificar, no permitir limpiar
            return NextResponse.json({ 
              success: false, 
              error: 'No se pudo verificar los archivos asociados. Comunícate con la central para solicitar la eliminación.',
              errorVerificacion: true
            }, { status: 400 });
          }
          
          // Si no hay archivos, proceder con la limpieza del colaborador
          console.log('Limpiando colaborador por no tener archivos');
          
          await pool.query(
            'UPDATE cumplidos SET id_colaborador = NULL WHERE id_cumplido = ?',
            [registroExistente.id_cumplido]
          );
          return NextResponse.json({ success: true, id_cumplido: registroExistente.id_cumplido, message: 'Colaborador removido pero registro conservado por tener notas' });
        }
      }
      // Si no, actualizar normalmente
      const registroExistente = existing[0];
      console.log('Actualizando asignación para registro:', registroExistente.id_cumplido, 'con colaborador:', colaboradorId);
      await pool.query(
        `UPDATE cumplidos 
         SET id_colaborador = ?
         WHERE id_puesto = ? AND fecha = ? AND id_tipo_turno = ?`,
        [colaboradorId || null, id_puesto, fechaFormateada, id_tipo_turno]
      );
      return NextResponse.json({ 
        success: true, 
        id_cumplido: registroExistente.id_cumplido,
        message: 'Asignación actualizada correctamente'
      });
    } else {
      // Permitir crear el registro aunque colaborador sea null o vacío
      console.log('Creando nuevo registro con colaborador:', colaboradorId);
      const [result] = await pool.query(
        `INSERT INTO cumplidos 
         (fecha, id_puesto, id_tipo_turno, id_colaborador) 
         VALUES (?, ?, ?, ?)`,
        [fechaFormateada, id_puesto, id_tipo_turno, colaboradorId || null]
      ) as [ResultSetHeader, any];
      return NextResponse.json({ 
        success: true, 
        id_cumplido: result.insertId,
        message: 'Asignación creada correctamente'
      });
    }
  } catch (error) {
    console.error('Error al manejar asignación:', error);
    return NextResponse.json(
      { error: 'Error al manejar la asignación', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
} 