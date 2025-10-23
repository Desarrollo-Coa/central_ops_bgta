import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import validator from 'validator';
import { generateStatsChart } from '@/utils/canvasService';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Endpoint para enviar una novedad por correo electrónico a múltiples destinatarios.
 * - Envía un solo correo a todos los destinatarios.
 * - Adjunta gráfico estadístico y evidencias.
 * - Registra el historial de envíos y el estado individual de cada destinatario.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener parámetros y destinatarios del request
    const params = await context.params;
    const { destinatarios } = await request.json();

    // --- Autenticación ---
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const id_usuario = payload.id;

    // --- Validar destinatarios ---
    const validDestinatarios = destinatarios.filter((d: { email: string }) =>
      validator.isEmail(d.email)
    );
    if (validDestinatarios.length === 0) {
      throw new Error('No valid email addresses provided');
    }
    const destinatariosEmails = validDestinatarios.map((d: { email: string }) => d.email);
    console.log('Valid Recipients:', destinatariosEmails);

    // --- Obtener información de la novedad ---
    const [novedadResult] = await connection.query<RowDataPacket[]>(`
      SELECT n.*, 
        tr.nombre_tipo_reporte, 
        te.nombre_tipo_evento, 
        tn.nombre_negocio,
        s.nombre_puesto,
        u.nombre as nombre_usuario,
        u.apellido as apellido_usuario,
        GROUP_CONCAT(i.url_imagen) as imagenes
      FROM novedades n
      JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
      JOIN tipos_reporte tr ON te.id_tipo_reporte = tr.id_tipo_reporte
      JOIN puestos s ON n.id_puesto = s.id_puesto
      JOIN unidades_negocio un ON s.id_unidad = un.id_unidad
      JOIN negocios tn ON un.id_negocio = tn.id_negocio
      JOIN users u ON n.id_usuario = u.id
      LEFT JOIN imagenes_novedades i ON n.id_novedad = i.id_novedad
      WHERE n.id_novedad = ?
      GROUP BY n.id_novedad
    `, [params.id]);

    if (novedadResult.length === 0) {
      throw new Error('Novedad no encontrada');
    }
    const novedad = novedadResult[0];
    const imagenes = novedad.imagenes ? novedad.imagenes.split(',') : [];

    // --- Obtener estadísticas para el gráfico ---
    const [estadisticas] = await connection.query<RowDataPacket[]>(`
      WITH RECURSIVE meses AS (
        SELECT 1 as mes_numero, 'Enero' as mes_nombre
        UNION ALL SELECT 2, 'Febrero'
        UNION ALL SELECT 3, 'Marzo'
        UNION ALL SELECT 4, 'Abril'
        UNION ALL SELECT 5, 'Mayo'
        UNION ALL SELECT 6, 'Junio'
        UNION ALL SELECT 7, 'Julio'
        UNION ALL SELECT 8, 'Agosto'
        UNION ALL SELECT 9, 'Septiembre'
        UNION ALL SELECT 10, 'Octubre'
        UNION ALL SELECT 11, 'Noviembre'
        UNION ALL SELECT 12, 'Diciembre'
      )
      SELECT 
        m.mes_nombre as mes,
        m.mes_numero,
        COALESCE((
          SELECT COUNT(*) 
          FROM novedades n2 
          WHERE n2.id_puesto = n.id_puesto
            AND n2.id_tipo_evento = n.id_tipo_evento
            AND MONTH(n2.fecha_hora_novedad) = m.mes_numero
            AND YEAR(n2.fecha_hora_novedad) = YEAR(CURDATE())
        ), 0) as cantidad_puesto,
        COALESCE((
          SELECT COUNT(*) 
          FROM novedades n2
          JOIN puestos p2 ON n2.id_puesto = p2.id_puesto
          WHERE p2.id_unidad = p.id_unidad
            AND n2.id_tipo_evento = n.id_tipo_evento
            AND MONTH(n2.fecha_hora_novedad) = m.mes_numero
            AND YEAR(n2.fecha_hora_novedad) = YEAR(CURDATE())
        ), 0) as cantidad_unidad
      FROM meses m
      CROSS JOIN novedades n
      JOIN puestos p ON n.id_puesto = p.id_puesto
      WHERE n.id_novedad = ?
      GROUP BY m.mes_numero, m.mes_nombre, p.id_puesto, p.id_unidad, n.id_tipo_evento
      ORDER BY m.mes_numero
    `, [params.id]);

    // --- Obtener nombre de la unidad de negocio y negocio ---
    const [unidadNegocioResult] = await connection.query<RowDataPacket[]>(`
      SELECT un.nombre_unidad, n.nombre_negocio
      FROM puestos p
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios n ON un.id_negocio = n.id_negocio
      WHERE p.id_puesto = ?
      LIMIT 1
    `, [novedad.id_puesto]);
    const nombreUnidad = unidadNegocioResult.length > 0 ? unidadNegocioResult[0].nombre_unidad : '';

    // --- Llamar microservicio para generar gráfico estadístico ---
    const graficoBase64 = await generateStatsChart(
      estadisticas,
      novedad.nombre_tipo_evento,
      novedad.nombre_puesto,
      nombreUnidad
    );
    console.log('Canvas Service Success: Graph generated');

    // --- Registrar el envío en el historial (estado inicial: error) ---
    const [result] = await connection.query<ResultSetHeader>(`
      INSERT INTO historial_envios (
        id_novedad,
        operador_id,
        destinatarios,
        estado,
        mensaje_error,
        fecha_envio
      ) VALUES (?, ?, ?, ?, ?, CONVERT_TZ(NOW(), @@session.time_zone, "-05:00"))
    `, [
      params.id,
      id_usuario,
      JSON.stringify(validDestinatarios),
      'error',
      'En proceso de envío',
    ]);
    const idHistorialEnvio = result.insertId;
    console.log('Historial Envio ID:', idHistorialEnvio);

    // --- Preparar HTML y adjuntos del correo ---
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RENOA - Notificación de Novedad</title>
        <style>
          .section { transition: all 0.3s ease; }
          .section:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
          img { transition: transform 0.3s ease; }
          img:hover { transform: scale(1.05); }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; color: #333333;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="800" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- HEADER -->
                <tr>
                  <td style="background-color:#0c088b; padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${novedad.nombre_negocio} - ${novedad.nombre_puesto}</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- BARRA DE ESTADO -->
                <tr>
                  <td style="background-color: #f0f0f0; padding: 10px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" align="left" style="font-size: 14px; color: #666666;">
                          Reporte: <span style="color:rgb(17, 3, 121); font-weight: bold;">${novedad.nombre_tipo_reporte}</span>
                        </td>
                        <td width="50%" align="right">
                          <span style="background-color: #ffebee; color: #d32f2f; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 12px;">
                            Consecutivo: ${novedad.consecutivo}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- CONTENIDO -->
                <tr>
                  <td style="padding: 30px 20px;">
                    <!-- DETALLES DEL EVENTO -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; border-radius: 8px; margin-bottom: 30px; border: 1px solid #eeeeee;" class="section">
                      <tr>
                        <td style="padding: 20px;">
                          <h2 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; border-left: 4px solid #003087; padding-left: 10px;">Detalles del Evento</h2>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="50%" style="padding: 10px; vertical-align: top;">
                                <table width="100%">
                                  <tr>
                                    <td width="30" valign="top">
                                      <div style="background-color: #e3f2fd; border-radius: 6px; width: 30px; height: 30px; text-align: center; line-height: 30px;">
                                        <span style="color: #003087; font-weight: bold;">📅</span>
                                      </div>
                                    </td>
                                    <td style="padding-left: 10px;">
                                      <p style="margin: 0; font-size: 12px; color: #666666;">FECHA</p>
                                      <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">
                                        ${format(new Date(novedad.fecha_hora_novedad), 'dd/MMMM/yyyy', { locale: es })}
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td width="50%" rowspan="3" style="padding: 10px; vertical-align: top;">
                                <img src="cid:estadisticas" alt="Estadísticas mensuales" style="width: 100%; height: 100%; object-fit: contain;">
                              </td>
                            </tr>
                            <tr>
                              <td width="50%" style="padding: 10px; vertical-align: top;">
                                <table width="100%">
                                  <tr>
                                    <td width="30" valign="top">
                                      <div style="background-color: #e3f2fd; border-radius: 6px; width: 30px; height: 30px; text-align: center; line-height: 30px;">
                                        <span style="color: #003087; font-weight: bold;">⏰</span>
                                      </div>
                                    </td>
                                    <td style="padding-left: 10px;">
                                      <p style="margin: 0; font-size: 12px; color: #666666;">HORA</p>
                                      <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">
                                        ${format(new Date(novedad.fecha_hora_novedad), 'HH:mm', { locale: es })}
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td width="50%" style="padding: 10px; vertical-align: top;">
                                <table width="100%">
                                  <tr>
                                    <td width="30" valign="top">
                                      <div style="background-color: #e3f2fd; border-radius: 6px; width: 30px; height: 30px; text-align: center; line-height: 30px;">
                                        <span style="color: #003087; font-weight: bold;">📍</span>
                                      </div>
                                    </td>
                                    <td style="padding-left: 10px;">
                                      <p style="margin: 0; font-size: 12px; color: #666666;">UBICACIÓN</p>
                                      <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">
                                        ${novedad.nombre_puesto}
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <!-- EVENTO Y GESTIÓN -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;" class="section">
                      <tr>
                        <td width="50%" style="padding-right: 10px; vertical-align: top;">
                          <h2 style="margin: 0 0 15px 0; color: #003087; font-size: 18px; border-left: 4px solid #003087; padding-left: 10px;">Evento</h2>
                          <table width="100%" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 6px;">
                            <tr>
                              <td style="padding: 15px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6;">${novedad.descripcion}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="padding-left: 10px; vertical-align: top;">
                          <h2 style="margin: 0 0 15px 0; color: #003087; font-size: 18px; border-left: 4px solid #003087; padding-left: 10px;">Gestión</h2>
                          <table width="100%" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 6px;">
                            <tr>
                              <td style="padding: 15px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                                  ${novedad.gestion || 'No se ha registrado gestión para este evento.'}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <!-- IMÁGENES DE EVIDENCIA (opcional, solo si existen) -->
                    ${imagenes.length > 0 ? `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="section">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 15px 0; color: #003087; font-size: 18px; border-left: 4px solid #003087; padding-left: 10px;">Imágenes del Evento</h2>
                          <table width="100%">
                            <tr>
                              ${imagenes.map((url: string, index: number) => `
                                <td width="${100 / Math.min(imagenes.length, 3)}%" style="padding: ${index === 0 ? '0 8px 0 0' : index === imagenes.length - 1 ? '0 0 0 8px' : '0 4px'}">
                                  <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 6px;">
                                    <img src="${url}" alt="Evidencia ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                                  </div>
                                </td>
                              `).join('')}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
                <!-- FOOTER -->
                <tr>
                  <td style="background-color: #003087; padding: 20px;">
                    <table width="100%">
                      <tr>
                        <td align="center">
                          <p style="margin: 0; font-size: 14px; color: #ffffff;">© ${new Date().getFullYear()} RENOA - Todos los derechos reservados</p>
                          <p style="margin: 8px 0 0 0; font-size: 12px; color: #ffffff;">
                            Reporte generado: ${format(new Date(), 'dd/MM/yyyy')}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Adjuntos: gráfico y evidencias
    const attachments = [
      {
        filename: 'estadisticas.png',
        content: Buffer.from(graficoBase64, 'base64'),
        cid: 'estadisticas',
      },
      ...imagenes.map((url: string, index: number) => ({
        filename: `imagen_${index + 1}.jpg`,
        path: url,
      })),
    ];

    // --- Enviar correo a todos los destinatarios ---
    let envioExitoso = false;
    let errorEnvio: any = null;
    let info: any = null;
    try {
      info = await transporter.sendMail({
        from: `"RENOA" <${process.env.EMAIL_USER}>`,
        to: destinatariosEmails.join(','),
        subject: `${novedad.nombre_negocio}: Reporte de Novedades - ${novedad.nombre_tipo_evento}`,
        html: htmlContent,
        attachments,
      });
      envioExitoso = true;
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      });
    } catch (error: any) {
      errorEnvio = error;
      console.error('Email sending failed:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
      });
    }

    // --- Registrar el estado de envío para cada destinatario ---
    for (const destinatario of validDestinatarios) {
      if (envioExitoso) {
        await connection.query(
          'INSERT INTO destinatarios_envio (id_historial, email, nombre, estado) VALUES (?, ?, ?, ?)',
          [idHistorialEnvio, destinatario.email, destinatario.nombre, 'enviado']
        );
      } else {
        await connection.query(
          'INSERT INTO destinatarios_envio (id_historial, email, nombre, estado, error) VALUES (?, ?, ?, ?, ?)',
          [
            idHistorialEnvio,
            destinatario.email,
            destinatario.nombre,
            'error',
            errorEnvio?.message || 'Error desconocido',
          ]
        );
      }
    }

    // --- Actualizar historial_envios con información final ---
    if (!envioExitoso) {
      await connection.query(
        'UPDATE historial_envios SET estado = ?, mensaje_error = ?, destinatarios = ? WHERE id_envio = ?',
        [
          'error',
          errorEnvio?.message || 'Error desconocido',
          JSON.stringify(validDestinatarios),
          idHistorialEnvio,
        ]
      );
      await connection.commit();
      return NextResponse.json({
        message: 'Error al enviar la novedad',
        errores: validDestinatarios.map((d: any) => ({
          email: d.email,
          error: errorEnvio?.message || 'Error desconocido',
        })),
      }, { status: 500 });
    }

    await connection.query(
      'UPDATE historial_envios SET estado = ?, mensaje_error = NULL, destinatarios = ? WHERE id_envio = ?',
      ['enviado', JSON.stringify(validDestinatarios), idHistorialEnvio]
    );

    await connection.commit();
    return NextResponse.json({
      success: true,
      message: 'Novedad enviada correctamente',
      destinatarios: destinatariosEmails,
      nodemailerInfo: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      },
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al enviar novedad:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}