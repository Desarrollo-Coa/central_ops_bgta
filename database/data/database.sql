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