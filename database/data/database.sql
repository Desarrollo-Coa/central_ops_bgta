-- Base de datos para Sistema de Comunicación y Programación
-- Incluye todas las tablas necesarias para el funcionamiento completo

-- Eliminar base de datos si existe (CUIDADO: Esto borra todos los datos)
DROP DATABASE IF EXISTS `central_ops_bgta`;

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS `central_ops_bgta` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `central_ops_bgta`;

-- Tabla de roles
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles básicos
INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'Administrador'),
(2, 'Jefe de Operaciones');

-- Tabla de usuarios
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de solicitudes de cuenta
CREATE TABLE `solicitudes_cuenta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `raw_password` varchar(255) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `comentario` text,
  `estado` varchar(20) DEFAULT 'pendiente',
  `fecha_solicitud` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de módulos/rutas del sistema
CREATE TABLE `modulos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `ruta` varchar(255) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `icono` varchar(50) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `acepta_subrutas` tinyint(1) DEFAULT '0',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ruta` (`ruta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tipos de turno
CREATE TABLE `tipos_turno` (
  `id_tipo_turno` int NOT NULL AUTO_INCREMENT,
  `nombre_tipo_turno` varchar(50) NOT NULL,
  PRIMARY KEY (`id_tipo_turno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar tipos de turno básicos
INSERT INTO `tipos_turno` (`id_tipo_turno`, `nombre_tipo_turno`) VALUES
(1, 'Diurno'),
(2, 'Nocturno'),
(3, 'Turno B');

-- Tabla de negocios
CREATE TABLE `negocios` (
  `id_negocio` int NOT NULL AUTO_INCREMENT,
  `nombre_negocio` varchar(100) NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_negocio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de unidades de negocio
CREATE TABLE `unidades_negocio` (
  `id_unidad` int NOT NULL AUTO_INCREMENT,
  `nombre_unidad` varchar(255) NOT NULL,
  `id_negocio` int NOT NULL,
  PRIMARY KEY (`id_unidad`),
  KEY `id_negocio` (`id_negocio`),
  CONSTRAINT `unidades_negocio_ibfk_1` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de puestos
CREATE TABLE `puestos` (
  `id_puesto` int NOT NULL AUTO_INCREMENT,
  `nombre_puesto` varchar(255) NOT NULL,
  `id_unidad` int NOT NULL,
  `fecha_inicial` date NOT NULL DEFAULT (curdate()),
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_puesto`),
  KEY `id_unidad` (`id_unidad`),
  CONSTRAINT `puestos_ibfk_1` FOREIGN KEY (`id_unidad`) REFERENCES `unidades_negocio` (`id_unidad`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de cumplidos (estructura simplificada para cumplimiento de servicios)
CREATE TABLE `cumplidos` (
  `id_cumplido` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `id_puesto` int NOT NULL,
  `id_tipo_turno` int NOT NULL,
  `nombre_colaborador` varchar(100) DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_cumplido`),
  KEY `id_puesto` (`id_puesto`),
  KEY `id_tipo_turno` (`id_tipo_turno`),
  CONSTRAINT `cumplidos_ibfk_1` FOREIGN KEY (`id_puesto`) REFERENCES `puestos` (`id_puesto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cumplidos_ibfk_2` FOREIGN KEY (`id_tipo_turno`) REFERENCES `tipos_turno` (`id_tipo_turno`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de reportes de comunicación
CREATE TABLE `reporte_comunicacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_cumplido` int UNSIGNED NOT NULL,
  `calificaciones` text,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_cumplido` (`id_cumplido`),
  CONSTRAINT `reporte_comunicacion_ibfk_1` FOREIGN KEY (`id_cumplido`) REFERENCES `cumplidos` (`id_cumplido`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración de reportes de comunicación
CREATE TABLE `configuracion_reportes_comunicacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha_inicial` date NOT NULL,
  `cantidad_diurno` int NOT NULL,
  `cantidad_nocturno` int NOT NULL,
  `id_negocio` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_negocio` (`id_negocio`),
  CONSTRAINT `configuracion_reportes_comunicacion_ibfk_1` FOREIGN KEY (`id_negocio`) REFERENCES `negocios` (`id_negocio`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de notas de cumplidos
CREATE TABLE `notas_cumplidos` (
  `id_nota` int NOT NULL AUTO_INCREMENT,
  `id_cumplido` int UNSIGNED NOT NULL,
  `nota` text NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nota`),
  KEY `id_cumplido` (`id_cumplido`),
  CONSTRAINT `notas_cumplidos_ibfk_1` FOREIGN KEY (`id_cumplido`) REFERENCES `cumplidos` (`id_cumplido`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones de usuario
CREATE TABLE `user_sessions` (
  `id_session` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `last_activity` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_inicio` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` datetime DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_session`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DEL SISTEMA DE NOVEDADES
-- ============================================

-- Tabla de tipos de reporte
CREATE TABLE `tipos_reporte` (
  `id_tipo_reporte` int NOT NULL AUTO_INCREMENT,
  `nombre_tipo_reporte` varchar(100) NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_reporte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tipos de evento
CREATE TABLE `tipos_evento` (
  `id_tipo_evento` int NOT NULL AUTO_INCREMENT,
  `nombre_tipo_evento` varchar(100) NOT NULL,
  `id_tipo_reporte` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_evento`),
  KEY `id_tipo_reporte` (`id_tipo_reporte`),
  CONSTRAINT `tipos_evento_ibfk_1` FOREIGN KEY (`id_tipo_reporte`) REFERENCES `tipos_reporte` (`id_tipo_reporte`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla principal de novedades
CREATE TABLE `novedades` (
  `id_novedad` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_puesto` int NOT NULL,
  `consecutivo` int NOT NULL,
  `fecha_hora_novedad` datetime NOT NULL,
  `id_tipo_evento` int NOT NULL,
  `descripcion` text,
  `gestion` text,
  `evento_critico` tinyint(1) DEFAULT '0',
  `fecha_hora_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_novedad`),
  UNIQUE KEY `consecutivo` (`consecutivo`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_puesto` (`id_puesto`),
  KEY `id_tipo_evento` (`id_tipo_evento`),
  CONSTRAINT `novedades_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `novedades_ibfk_2` FOREIGN KEY (`id_puesto`) REFERENCES `puestos` (`id_puesto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `novedades_ibfk_3` FOREIGN KEY (`id_tipo_evento`) REFERENCES `tipos_evento` (`id_tipo_evento`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de imágenes de novedades
CREATE TABLE `imagenes_novedades` (
  `id_imagen` int NOT NULL AUTO_INCREMENT,
  `id_novedad` int NOT NULL,
  `url_imagen` varchar(500) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `fecha_subida` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_imagen`),
  KEY `id_novedad` (`id_novedad`),
  CONSTRAINT `imagenes_novedades_ibfk_1` FOREIGN KEY (`id_novedad`) REFERENCES `novedades` (`id_novedad`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de destinatarios
CREATE TABLE `destinatarios` (
  `id_destinatario` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_destinatario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de asignaciones de destinatarios
CREATE TABLE `asignaciones_destinatarios` (
  `id_asignacion` int NOT NULL AUTO_INCREMENT,
  `id_tipo_evento` int NOT NULL,
  `id_puesto` int NOT NULL,
  `id_destinatario` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_asignacion`),
  KEY `id_tipo_evento` (`id_tipo_evento`),
  KEY `id_puesto` (`id_puesto`),
  KEY `id_destinatario` (`id_destinatario`),
  CONSTRAINT `asignaciones_destinatarios_ibfk_1` FOREIGN KEY (`id_tipo_evento`) REFERENCES `tipos_evento` (`id_tipo_evento`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asignaciones_destinatarios_ibfk_2` FOREIGN KEY (`id_puesto`) REFERENCES `puestos` (`id_puesto`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asignaciones_destinatarios_ibfk_3` FOREIGN KEY (`id_destinatario`) REFERENCES `destinatarios` (`id_destinatario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de envíos
CREATE TABLE `historial_envios` (
  `id_envio` int NOT NULL AUTO_INCREMENT,
  `id_novedad` int NOT NULL,
  `operador_id` int NOT NULL,
  `destinatarios` json NOT NULL,
  `fecha_envio` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('enviado','error') NOT NULL,
  `mensaje_error` text,
  PRIMARY KEY (`id_envio`),
  KEY `id_novedad` (`id_novedad`),
  KEY `operador_id` (`operador_id`),
  CONSTRAINT `historial_envios_ibfk_1` FOREIGN KEY (`id_novedad`) REFERENCES `novedades` (`id_novedad`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `historial_envios_ibfk_2` FOREIGN KEY (`operador_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS DE EJEMPLO PARA NOVEDADES
-- ============================================

-- Insertar tipos de reporte
INSERT INTO `tipos_reporte` (`id_tipo_reporte`, `nombre_tipo_reporte`) VALUES
(1, 'SEGURIDAD FISICA'),
(2, 'ASEGURAMIENTO DE LA OPERACION'),
(3, 'SEGURIDAD ELECTRONICA'),
(4, 'INCUMPLIMIENTO A LOS PROCEDIMIENTOS PR');

-- Insertar tipos de evento
INSERT INTO `tipos_evento` (`id_tipo_evento`, `nombre_tipo_evento`, `id_tipo_reporte`) VALUES
(1, 'AGRESIÓN', 1),
(2, 'INFRAESTRUCTURA', 1),
(3, 'ELEMENTOS SIN ASEGURAR', 1),
(4, 'FALLAS ELÉCTRICAS', 2),
(5, 'LOGISTICA', 2),
(6, 'PODA', 2),
(7, 'EXTERNOS', 3),
(8, 'INTERNOS', 3),
(9, 'FALLA DEL CIRCUITO CERRADO', 3),
(10, 'HURTO', 1),
(11, 'INCUMPLIMIENTO AL SERVICIO', 4),
(12, 'ACCIDENTE E INCIDENTE LABORAL', 1),
(13, 'EVENTO EVITADO', 1),
(14, 'OTRAS NOVEDADES', 1);
 

-- Insertar negocios
INSERT INTO `negocios` (`id_negocio`, `nombre_negocio`) VALUES
(1, 'EMPRESA 1'),
(2, 'EMPRESA 2'),
(3, 'EMPRESA 3'),
(4, 'EMPRESA 4');

-- Insertar unidades de negocio
INSERT INTO `unidades_negocio` (`id_unidad`, `nombre_unidad`, `id_negocio`) VALUES
(1, 'CENTRO COMERCIAL GRAN ESTACIÓN', 1),
(2, 'CENTRO COMERCIAL PLAZA CENTRAL', 1),
(3, 'CENTRO COMERCIAL PLAZA NORTE', 1),
(4, 'CENTRO COMERCIAL PLAZA SUR', 1),
(5, 'CENTRO COMERCIAL PLAZA MAYOR', 2),
(6, 'CENTRO COMERCIAL SANTAFÉ', 2),
(7, 'CENTRO COMERCIAL UNICENTRO', 3),
(8, 'CENTRO COMERCIAL JARDÍN PLAZA', 3),
(9, 'CENTRO COMERCIAL BUENAVISTA', 4),
(10, 'CENTRO COMERCIAL VIVA', 4);

-- Insertar puestos
INSERT INTO `puestos` (`id_puesto`, `nombre_puesto`, `id_unidad`) VALUES
(1, 'PUESTO 1 - ENTRADA PRINCIPAL', 1),
(2, 'PUESTO 2 - PARQUEADERO', 1),
(3, 'PUESTO 3 - ÁREA COMERCIAL', 1),
(4, 'PUESTO 4 - SALIDA EMERGENCIA', 1),
(5, 'PUESTO 1 - RECEPCIÓN', 2),
(6, 'PUESTO 2 - VIGILANCIA PERIMETRAL', 2),
(7, 'PUESTO 3 - CONTROL ACCESO', 2),
(8, 'PUESTO 1 - ENTRADA NORTE', 3),
(9, 'PUESTO 2 - ENTRADA SUR', 3),
(10, 'PUESTO 3 - ÁREA GASTRONÓMICA', 3),
(11, 'PUESTO 1 - RECEPCIÓN PRINCIPAL', 4),
(12, 'PUESTO 2 - PARQUEADERO SUBTERRÁNEO', 4),
(13, 'PUESTO 3 - PLAZA DE COMIDAS', 4),
(14, 'PUESTO 1 - CONTROL VEHICULAR', 5),
(15, 'PUESTO 2 - VIGILANCIA INTERNA', 5),
(16, 'PUESTO 1 - ENTRADA COMERCIAL', 6),
(17, 'PUESTO 2 - ÁREA DE SERVICIOS', 6),
(18, 'PUESTO 1 - RECEPCIÓN CENTRAL', 7),
(19, 'PUESTO 2 - PARQUEADERO', 7),
(20, 'PUESTO 1 - CONTROL ACCESO', 8),
(21, 'PUESTO 2 - VIGILANCIA PERIMETRAL', 8),
(22, 'PUESTO 1 - ENTRADA PRINCIPAL', 9),
(23, 'PUESTO 2 - ÁREA COMERCIAL', 9),
(24, 'PUESTO 1 - RECEPCIÓN', 10),
(25, 'PUESTO 2 - CONTROL VEHICULAR', 10);

-- Insertar usuarios de ejemplo
INSERT INTO `users` (`id`, `nombre`, `apellido`, `username`, `email`, `password`, `role_id`) VALUES
(1, 'Juan', 'Pérez', 'jperez', 'juan.perez@renea.com', '$2b$10$example', 1),
(2, 'María', 'González', 'mgonzalez', 'maria.gonzalez@renea.com', '$2b$10$example', 1),
(3, 'Carlos', 'Rodríguez', 'crodriguez', 'carlos.rodriguez@renea.com', '$2b$10$example', 2),
(4, 'Ana', 'Martínez', 'amartinez', 'ana.martinez@renea.com', '$2b$10$example', 2),
(5, 'Luis', 'Hernández', 'lhernandez', 'luis.hernandez@renea.com', '$2b$10$example', 2);

-- Insertar cumplidos para octubre 2025 (días 1-26)
INSERT INTO `cumplidos` (`id_cumplido`, `fecha`, `id_puesto`, `id_tipo_turno`, `nombre_colaborador`) VALUES
-- Día 1 de octubre
(1, '2025-10-01', 1, 1, 'Pedro Sánchez'),
(2, '2025-10-01', 1, 2, 'Roberto López'),
(3, '2025-10-01', 2, 1, 'Carmen Ruiz'),
(4, '2025-10-01', 2, 2, 'Miguel Torres'),
(5, '2025-10-01', 3, 1, 'Elena Vargas'),
(6, '2025-10-01', 3, 2, 'Fernando Castro'),
(7, '2025-10-01', 4, 1, 'Isabel Morales'),
(8, '2025-10-01', 4, 2, 'Antonio Jiménez'),
(9, '2025-10-01', 5, 1, 'Patricia Herrera'),
(10, '2025-10-01', 5, 2, 'Francisco Ramos'),

-- Día 2 de octubre
(11, '2025-10-02', 1, 1, 'Pedro Sánchez'),
(12, '2025-10-02', 1, 2, 'Roberto López'),
(13, '2025-10-02', 2, 1, 'Carmen Ruiz'),
(14, '2025-10-02', 2, 2, 'Miguel Torres'),
(15, '2025-10-02', 3, 1, 'Elena Vargas'),
(16, '2025-10-02', 3, 2, 'Fernando Castro'),
(17, '2025-10-02', 4, 1, 'Isabel Morales'),
(18, '2025-10-02', 4, 2, 'Antonio Jiménez'),
(19, '2025-10-02', 5, 1, 'Patricia Herrera'),
(20, '2025-10-02', 5, 2, 'Francisco Ramos'),

-- Día 3 de octubre
(21, '2025-10-03', 1, 1, 'Pedro Sánchez'),
(22, '2025-10-03', 1, 2, 'Roberto López'),
(23, '2025-10-03', 2, 1, 'Carmen Ruiz'),
(24, '2025-10-03', 2, 2, 'Miguel Torres'),
(25, '2025-10-03', 3, 1, 'Elena Vargas'),
(26, '2025-10-03', 3, 2, 'Fernando Castro'),
(27, '2025-10-03', 4, 1, 'Isabel Morales'),
(28, '2025-10-03', 4, 2, 'Antonio Jiménez'),
(29, '2025-10-03', 5, 1, 'Patricia Herrera'),
(30, '2025-10-03', 5, 2, 'Francisco Ramos'),

-- Día 4 de octubre
(31, '2025-10-04', 1, 1, 'Pedro Sánchez'),
(32, '2025-10-04', 1, 2, 'Roberto López'),
(33, '2025-10-04', 2, 1, 'Carmen Ruiz'),
(34, '2025-10-04', 2, 2, 'Miguel Torres'),
(35, '2025-10-04', 3, 1, 'Elena Vargas'),
(36, '2025-10-04', 3, 2, 'Fernando Castro'),
(37, '2025-10-04', 4, 1, 'Isabel Morales'),
(38, '2025-10-04', 4, 2, 'Antonio Jiménez'),
(39, '2025-10-04', 5, 1, 'Patricia Herrera'),
(40, '2025-10-04', 5, 2, 'Francisco Ramos'),

-- Día 5 de octubre
(41, '2025-10-05', 1, 1, 'Pedro Sánchez'),
(42, '2025-10-05', 1, 2, 'Roberto López'),
(43, '2025-10-05', 2, 1, 'Carmen Ruiz'),
(44, '2025-10-05', 2, 2, 'Miguel Torres'),
(45, '2025-10-05', 3, 1, 'Elena Vargas'),
(46, '2025-10-05', 3, 2, 'Fernando Castro'),
(47, '2025-10-05', 4, 1, 'Isabel Morales'),
(48, '2025-10-05', 4, 2, 'Antonio Jiménez'),
(49, '2025-10-05', 5, 1, 'Patricia Herrera'),
(50, '2025-10-05', 5, 2, 'Francisco Ramos'),

-- Día 6 de octubre
(51, '2025-10-06', 1, 1, 'Pedro Sánchez'),
(52, '2025-10-06', 1, 2, 'Roberto López'),
(53, '2025-10-06', 2, 1, 'Carmen Ruiz'),
(54, '2025-10-06', 2, 2, 'Miguel Torres'),
(55, '2025-10-06', 3, 1, 'Elena Vargas'),
(56, '2025-10-06', 3, 2, 'Fernando Castro'),
(57, '2025-10-06', 4, 1, 'Isabel Morales'),
(58, '2025-10-06', 4, 2, 'Antonio Jiménez'),
(59, '2025-10-06', 5, 1, 'Patricia Herrera'),
(60, '2025-10-06', 5, 2, 'Francisco Ramos'),

-- Día 7 de octubre
(61, '2025-10-07', 1, 1, 'Pedro Sánchez'),
(62, '2025-10-07', 1, 2, 'Roberto López'),
(63, '2025-10-07', 2, 1, 'Carmen Ruiz'),
(64, '2025-10-07', 2, 2, 'Miguel Torres'),
(65, '2025-10-07', 3, 1, 'Elena Vargas'),
(66, '2025-10-07', 3, 2, 'Fernando Castro'),
(67, '2025-10-07', 4, 1, 'Isabel Morales'),
(68, '2025-10-07', 4, 2, 'Antonio Jiménez'),
(69, '2025-10-07', 5, 1, 'Patricia Herrera'),
(70, '2025-10-07', 5, 2, 'Francisco Ramos'),

-- Día 8 de octubre
(71, '2025-10-08', 1, 1, 'Pedro Sánchez'),
(72, '2025-10-08', 1, 2, 'Roberto López'),
(73, '2025-10-08', 2, 1, 'Carmen Ruiz'),
(74, '2025-10-08', 2, 2, 'Miguel Torres'),
(75, '2025-10-08', 3, 1, 'Elena Vargas'),
(76, '2025-10-08', 3, 2, 'Fernando Castro'),
(77, '2025-10-08', 4, 1, 'Isabel Morales'),
(78, '2025-10-08', 4, 2, 'Antonio Jiménez'),
(79, '2025-10-08', 5, 1, 'Patricia Herrera'),
(80, '2025-10-08', 5, 2, 'Francisco Ramos'),

-- Día 9 de octubre
(81, '2025-10-09', 1, 1, 'Pedro Sánchez'),
(82, '2025-10-09', 1, 2, 'Roberto López'),
(83, '2025-10-09', 2, 1, 'Carmen Ruiz'),
(84, '2025-10-09', 2, 2, 'Miguel Torres'),
(85, '2025-10-09', 3, 1, 'Elena Vargas'),
(86, '2025-10-09', 3, 2, 'Fernando Castro'),
(87, '2025-10-09', 4, 1, 'Isabel Morales'),
(88, '2025-10-09', 4, 2, 'Antonio Jiménez'),
(89, '2025-10-09', 5, 1, 'Patricia Herrera'),
(90, '2025-10-09', 5, 2, 'Francisco Ramos'),

-- Día 10 de octubre
(91, '2025-10-10', 1, 1, 'Pedro Sánchez'),
(92, '2025-10-10', 1, 2, 'Roberto López'),
(93, '2025-10-10', 2, 1, 'Carmen Ruiz'),
(94, '2025-10-10', 2, 2, 'Miguel Torres'),
(95, '2025-10-10', 3, 1, 'Elena Vargas'),
(96, '2025-10-10', 3, 2, 'Fernando Castro'),
(97, '2025-10-10', 4, 1, 'Isabel Morales'),
(98, '2025-10-10', 4, 2, 'Antonio Jiménez'),
(99, '2025-10-10', 5, 1, 'Patricia Herrera'),
(100, '2025-10-10', 5, 2, 'Francisco Ramos'),

-- Día 11 de octubre
(101, '2025-10-11', 1, 1, 'Pedro Sánchez'),
(102, '2025-10-11', 1, 2, 'Roberto López'),
(103, '2025-10-11', 2, 1, 'Carmen Ruiz'),
(104, '2025-10-11', 2, 2, 'Miguel Torres'),
(105, '2025-10-11', 3, 1, 'Elena Vargas'),
(106, '2025-10-11', 3, 2, 'Fernando Castro'),
(107, '2025-10-11', 4, 1, 'Isabel Morales'),
(108, '2025-10-11', 4, 2, 'Antonio Jiménez'),
(109, '2025-10-11', 5, 1, 'Patricia Herrera'),
(110, '2025-10-11', 5, 2, 'Francisco Ramos'),

-- Día 12 de octubre
(111, '2025-10-12', 1, 1, 'Pedro Sánchez'),
(112, '2025-10-12', 1, 2, 'Roberto López'),
(113, '2025-10-12', 2, 1, 'Carmen Ruiz'),
(114, '2025-10-12', 2, 2, 'Miguel Torres'),
(115, '2025-10-12', 3, 1, 'Elena Vargas'),
(116, '2025-10-12', 3, 2, 'Fernando Castro'),
(117, '2025-10-12', 4, 1, 'Isabel Morales'),
(118, '2025-10-12', 4, 2, 'Antonio Jiménez'),
(119, '2025-10-12', 5, 1, 'Patricia Herrera'),
(120, '2025-10-12', 5, 2, 'Francisco Ramos'),

-- Día 13 de octubre
(121, '2025-10-13', 1, 1, 'Pedro Sánchez'),
(122, '2025-10-13', 1, 2, 'Roberto López'),
(123, '2025-10-13', 2, 1, 'Carmen Ruiz'),
(124, '2025-10-13', 2, 2, 'Miguel Torres'),
(125, '2025-10-13', 3, 1, 'Elena Vargas'),
(126, '2025-10-13', 3, 2, 'Fernando Castro'),
(127, '2025-10-13', 4, 1, 'Isabel Morales'),
(128, '2025-10-13', 4, 2, 'Antonio Jiménez'),
(129, '2025-10-13', 5, 1, 'Patricia Herrera'),
(130, '2025-10-13', 5, 2, 'Francisco Ramos'),

-- Día 14 de octubre
(131, '2025-10-14', 1, 1, 'Pedro Sánchez'),
(132, '2025-10-14', 1, 2, 'Roberto López'),
(133, '2025-10-14', 2, 1, 'Carmen Ruiz'),
(134, '2025-10-14', 2, 2, 'Miguel Torres'),
(135, '2025-10-14', 3, 1, 'Elena Vargas'),
(136, '2025-10-14', 3, 2, 'Fernando Castro'),
(137, '2025-10-14', 4, 1, 'Isabel Morales'),
(138, '2025-10-14', 4, 2, 'Antonio Jiménez'),
(139, '2025-10-14', 5, 1, 'Patricia Herrera'),
(140, '2025-10-14', 5, 2, 'Francisco Ramos'),

-- Día 15 de octubre
(141, '2025-10-15', 1, 1, 'Pedro Sánchez'),
(142, '2025-10-15', 1, 2, 'Roberto López'),
(143, '2025-10-15', 2, 1, 'Carmen Ruiz'),
(144, '2025-10-15', 2, 2, 'Miguel Torres'),
(145, '2025-10-15', 3, 1, 'Elena Vargas'),
(146, '2025-10-15', 3, 2, 'Fernando Castro'),
(147, '2025-10-15', 4, 1, 'Isabel Morales'),
(148, '2025-10-15', 4, 2, 'Antonio Jiménez'),
(149, '2025-10-15', 5, 1, 'Patricia Herrera'),
(150, '2025-10-15', 5, 2, 'Francisco Ramos'),

-- Día 16 de octubre
(151, '2025-10-16', 1, 1, 'Pedro Sánchez'),
(152, '2025-10-16', 1, 2, 'Roberto López'),
(153, '2025-10-16', 2, 1, 'Carmen Ruiz'),
(154, '2025-10-16', 2, 2, 'Miguel Torres'),
(155, '2025-10-16', 3, 1, 'Elena Vargas'),
(156, '2025-10-16', 3, 2, 'Fernando Castro'),
(157, '2025-10-16', 4, 1, 'Isabel Morales'),
(158, '2025-10-16', 4, 2, 'Antonio Jiménez'),
(159, '2025-10-16', 5, 1, 'Patricia Herrera'),
(160, '2025-10-16', 5, 2, 'Francisco Ramos'),

-- Día 17 de octubre
(161, '2025-10-17', 1, 1, 'Pedro Sánchez'),
(162, '2025-10-17', 1, 2, 'Roberto López'),
(163, '2025-10-17', 2, 1, 'Carmen Ruiz'),
(164, '2025-10-17', 2, 2, 'Miguel Torres'),
(165, '2025-10-17', 3, 1, 'Elena Vargas'),
(166, '2025-10-17', 3, 2, 'Fernando Castro'),
(167, '2025-10-17', 4, 1, 'Isabel Morales'),
(168, '2025-10-17', 4, 2, 'Antonio Jiménez'),
(169, '2025-10-17', 5, 1, 'Patricia Herrera'),
(170, '2025-10-17', 5, 2, 'Francisco Ramos'),

-- Día 18 de octubre
(171, '2025-10-18', 1, 1, 'Pedro Sánchez'),
(172, '2025-10-18', 1, 2, 'Roberto López'),
(173, '2025-10-18', 2, 1, 'Carmen Ruiz'),
(174, '2025-10-18', 2, 2, 'Miguel Torres'),
(175, '2025-10-18', 3, 1, 'Elena Vargas'),
(176, '2025-10-18', 3, 2, 'Fernando Castro'),
(177, '2025-10-18', 4, 1, 'Isabel Morales'),
(178, '2025-10-18', 4, 2, 'Antonio Jiménez'),
(179, '2025-10-18', 5, 1, 'Patricia Herrera'),
(180, '2025-10-18', 5, 2, 'Francisco Ramos'),

-- Día 19 de octubre
(181, '2025-10-19', 1, 1, 'Pedro Sánchez'),
(182, '2025-10-19', 1, 2, 'Roberto López'),
(183, '2025-10-19', 2, 1, 'Carmen Ruiz'),
(184, '2025-10-19', 2, 2, 'Miguel Torres'),
(185, '2025-10-19', 3, 1, 'Elena Vargas'),
(186, '2025-10-19', 3, 2, 'Fernando Castro'),
(187, '2025-10-19', 4, 1, 'Isabel Morales'),
(188, '2025-10-19', 4, 2, 'Antonio Jiménez'),
(189, '2025-10-19', 5, 1, 'Patricia Herrera'),
(190, '2025-10-19', 5, 2, 'Francisco Ramos'),

-- Día 20 de octubre
(191, '2025-10-20', 1, 1, 'Pedro Sánchez'),
(192, '2025-10-20', 1, 2, 'Roberto López'),
(193, '2025-10-20', 2, 1, 'Carmen Ruiz'),
(194, '2025-10-20', 2, 2, 'Miguel Torres'),
(195, '2025-10-20', 3, 1, 'Elena Vargas'),
(196, '2025-10-20', 3, 2, 'Fernando Castro'),
(197, '2025-10-20', 4, 1, 'Isabel Morales'),
(198, '2025-10-20', 4, 2, 'Antonio Jiménez'),
(199, '2025-10-20', 5, 1, 'Patricia Herrera'),
(200, '2025-10-20', 5, 2, 'Francisco Ramos'),

-- Día 21 de octubre
(201, '2025-10-21', 1, 1, 'Pedro Sánchez'),
(202, '2025-10-21', 1, 2, 'Roberto López'),
(203, '2025-10-21', 2, 1, 'Carmen Ruiz'),
(204, '2025-10-21', 2, 2, 'Miguel Torres'),
(205, '2025-10-21', 3, 1, 'Elena Vargas'),
(206, '2025-10-21', 3, 2, 'Fernando Castro'),
(207, '2025-10-21', 4, 1, 'Isabel Morales'),
(208, '2025-10-21', 4, 2, 'Antonio Jiménez'),
(209, '2025-10-21', 5, 1, 'Patricia Herrera'),
(210, '2025-10-21', 5, 2, 'Francisco Ramos'),

-- Día 22 de octubre
(211, '2025-10-22', 1, 1, 'Pedro Sánchez'),
(212, '2025-10-22', 1, 2, 'Roberto López'),
(213, '2025-10-22', 2, 1, 'Carmen Ruiz'),
(214, '2025-10-22', 2, 2, 'Miguel Torres'),
(215, '2025-10-22', 3, 1, 'Elena Vargas'),
(216, '2025-10-22', 3, 2, 'Fernando Castro'),
(217, '2025-10-22', 4, 1, 'Isabel Morales'),
(218, '2025-10-22', 4, 2, 'Antonio Jiménez'),
(219, '2025-10-22', 5, 1, 'Patricia Herrera'),
(220, '2025-10-22', 5, 2, 'Francisco Ramos'),

-- Día 23 de octubre
(221, '2025-10-23', 1, 1, 'Pedro Sánchez'),
(222, '2025-10-23', 1, 2, 'Roberto López'),
(223, '2025-10-23', 2, 1, 'Carmen Ruiz'),
(224, '2025-10-23', 2, 2, 'Miguel Torres'),
(225, '2025-10-23', 3, 1, 'Elena Vargas'),
(226, '2025-10-23', 3, 2, 'Fernando Castro'),
(227, '2025-10-23', 4, 1, 'Isabel Morales'),
(228, '2025-10-23', 4, 2, 'Antonio Jiménez'),
(229, '2025-10-23', 5, 1, 'Patricia Herrera'),
(230, '2025-10-23', 5, 2, 'Francisco Ramos'),

-- Día 24 de octubre
(231, '2025-10-24', 1, 1, 'Pedro Sánchez'),
(232, '2025-10-24', 1, 2, 'Roberto López'),
(233, '2025-10-24', 2, 1, 'Carmen Ruiz'),
(234, '2025-10-24', 2, 2, 'Miguel Torres'),
(235, '2025-10-24', 3, 1, 'Elena Vargas'),
(236, '2025-10-24', 3, 2, 'Fernando Castro'),
(237, '2025-10-24', 4, 1, 'Isabel Morales'),
(238, '2025-10-24', 4, 2, 'Antonio Jiménez'),
(239, '2025-10-24', 5, 1, 'Patricia Herrera'),
(240, '2025-10-24', 5, 2, 'Francisco Ramos'),

-- Día 25 de octubre
(241, '2025-10-25', 1, 1, 'Pedro Sánchez'),
(242, '2025-10-25', 1, 2, 'Roberto López'),
(243, '2025-10-25', 2, 1, 'Carmen Ruiz'),
(244, '2025-10-25', 2, 2, 'Miguel Torres'),
(245, '2025-10-25', 3, 1, 'Elena Vargas'),
(246, '2025-10-25', 3, 2, 'Fernando Castro'),
(247, '2025-10-25', 4, 1, 'Isabel Morales'),
(248, '2025-10-25', 4, 2, 'Antonio Jiménez'),
(249, '2025-10-25', 5, 1, 'Patricia Herrera'),
(250, '2025-10-25', 5, 2, 'Francisco Ramos'),

-- Día 26 de octubre
(251, '2025-10-26', 1, 1, 'Pedro Sánchez'),
(252, '2025-10-26', 1, 2, 'Roberto López'),
(253, '2025-10-26', 2, 1, 'Carmen Ruiz'),
(254, '2025-10-26', 2, 2, 'Miguel Torres'),
(255, '2025-10-26', 3, 1, 'Elena Vargas'),
(256, '2025-10-26', 3, 2, 'Fernando Castro'),
(257, '2025-10-26', 4, 1, 'Isabel Morales'),
(258, '2025-10-26', 4, 2, 'Antonio Jiménez'),
(259, '2025-10-26', 5, 1, 'Patricia Herrera'),
(260, '2025-10-26', 5, 2, 'Francisco Ramos');

-- Insertar reportes de comunicación para algunos cumplidos
INSERT INTO `reporte_comunicacion` (`id`, `id_cumplido`, `calificaciones`) VALUES
(1, 1, '{"comunicacion": 5, "atencion": 4, "servicio": 5}'),
(2, 2, '{"comunicacion": 4, "atencion": 5, "servicio": 4}'),
(3, 3, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(4, 4, '{"comunicacion": 3, "atencion": 4, "servicio": 3}'),
(5, 5, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(6, 11, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(7, 12, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(8, 21, '{"comunicacion": 4, "atencion": 3, "servicio": 4}'),
(9, 31, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(10, 41, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(11, 51, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(12, 61, '{"comunicacion": 3, "atencion": 4, "servicio": 3}'),
(13, 71, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(14, 81, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(15, 91, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(16, 101, '{"comunicacion": 4, "atencion": 3, "servicio": 4}'),
(17, 111, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(18, 121, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(19, 131, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(20, 141, '{"comunicacion": 3, "atencion": 4, "servicio": 3}'),
(21, 151, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(22, 161, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(23, 171, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(24, 181, '{"comunicacion": 4, "atencion": 3, "servicio": 4}'),
(25, 191, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(26, 201, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(27, 211, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(28, 221, '{"comunicacion": 3, "atencion": 4, "servicio": 3}'),
(29, 231, '{"comunicacion": 5, "atencion": 5, "servicio": 5}'),
(30, 241, '{"comunicacion": 4, "atencion": 4, "servicio": 4}'),
(31, 251, '{"comunicacion": 5, "atencion": 5, "servicio": 5}');

