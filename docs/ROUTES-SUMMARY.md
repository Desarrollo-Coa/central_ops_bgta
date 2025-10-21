# Resumen de Configuración de Rutas

## 🔓 Rutas Públicas (Sin Autenticación)

### Páginas Públicas:
- `/login` - Página de login principal
- `/accesos/login` - Página de login de accesos

### APIs Públicas:
- `/api/auth/login` - Login de usuarios
- `/api/auth/logout` - Logout de usuarios
- `/api/auth/me` - Verificar usuario actual
- `/api/auth/verify-admin` - Verificar si es administrador
- `/api/middleware-routes` - Verificación de permisos

### Archivos Estáticos:
- `/favicon.ico` - Favicon
- `/_next/*` - Archivos de Next.js
- `/api/webhooks/*` - Webhooks
- `/public/*` - Archivos públicos
- `/img/*` - Imágenes

## 🔐 Rutas que Requieren Solo Autenticación

### Páginas de Usuario:
- `/` - Página principal
- `/users/dashboard` - Dashboard del usuario
- `/users/settings` - Configuración del usuario
- `/novedades/estadisticas-generales` - Estadísticas generales

### APIs de Usuario:
- `/api/users/password` - Cambiar contraseña
- `/api/logout` - Logout
- `/api/stats/active-users` - Usuarios activos
- `/api/stats/users` - Estadísticas de usuarios

## 🛡️ Rutas que Requieren Permisos Específicos

### Módulo de Accesos:
- **Ruta**: `/accesos/*`
- **Autenticación**: ✅ Requerida
- **Roles**: colaborador, supervisor, administrador
- **Subrutas**: ✅ Permitidas
- **APIs**: `/api/accesos/*`

### Módulo de Ausencias:
- **Ruta**: `/ausencias/*`
- **Autenticación**: ✅ Requerida
- **Roles**: colaborador, supervisor, administrador
- **Subrutas**: ✅ Permitidas
- **APIs**: `/api/ausencias/*`

### Módulo de Novedades:
- **Ruta**: `/novedades/*`
- **Autenticación**: ✅ Requerida
- **Roles**: colaborador, supervisor, administrador
- **Subrutas**: ✅ Permitidas
- **APIs**: `/api/novedades/*`

### Módulo de Programación:
- **Ruta**: `/programacion/*`
- **Autenticación**: ✅ Requerida
- **Roles**: supervisor, administrador
- **Subrutas**: ✅ Permitidas
- **APIs**: `/api/programacion/*`

### Módulo de Comunicación:
- **Ruta**: `/comunicacion/*`
- **Autenticación**: ✅ Requerida
- **Roles**: supervisor, administrador
- **Subrutas**: ✅ Permitidas
- **APIs**: `/api/comunicacion/*`

### Módulo de Settings:
- **Ruta**: `/settings/*`
- **Autenticación**: ✅ Requerida
- **Roles**: administrador
- **Subrutas**: ✅ Permitidas
- **APIs**: `/api/settings/*`

### Módulo de Usuarios:
- **Ruta**: `/users/*`
- **Autenticación**: ✅ Requerida
- **Roles**: colaborador, supervisor, administrador
- **Subrutas**: ✅ Permitidas

### Módulo de Marcaciones:
- **Ruta**: `/marcaciones-mitra`
- **Autenticación**: ✅ Requerida
- **Roles**: colaborador, supervisor, administrador
- **Subrutas**: ❌ No permitidas
- **APIs**: `/api/marcaciones/*`

### APIs Adicionales:
- **Cumplidos**: `/api/cumplidos/*` (supervisor, administrador)
- **Cumplimiento de Servicios**: `/api/cumplimiento-servicios/*` (supervisor, administrador)

## 🎯 Comportamiento del Middleware

### Flujo de Verificación:
1. **Archivos Estáticos**: Acceso directo sin verificación
2. **Rutas Públicas**: Acceso directo sin verificación
3. **Verificación de Token**: Si no hay token → redirigir a `/login`
4. **Verificación de Token Válido**: Si token inválido → redirigir a `/login`
5. **Administradores**: Acceso completo a todas las rutas
6. **Rutas de Usuario Autenticado**: Acceso para usuarios autenticados
7. **Verificación de Permisos**: Consultar configuración de módulos
8. **Verificación en Base de Datos**: Si no hay configuración específica

### Respuestas del Middleware:
- **200**: Acceso permitido
- **401**: No autenticado (redirigir a login)
- **403**: Acceso denegado (redirigir a dashboard)

## 📝 Notas Importantes

- **Solo `/accesos/login` es pública** - Las demás rutas de accesos requieren autenticación
- **Administradores tienen acceso completo** a todas las rutas
- **Las imágenes y archivos estáticos** se sirven directamente
- **El middleware genera logs detallados** para debugging
- **Las rutas se normalizan** para evitar problemas con barras múltiples 