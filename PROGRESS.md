# PROGRESS.md — Estado del proyecto

## v1.0.0 [✅ COMPLETO]
- [x] Estructura backend (Express + Sequelize + SQLite)
- [x] Modelos: User, Student, Course, Enrollment, DiplomaTemplate, Diploma, AppConfig
- [x] Auth: login, JWT, roles (admin/gestor/alumno)
- [x] Seed: admin@admin.com / admin
- [x] CRUD Cursos, Alumnos, Inscripciones
- [x] Frontend React + Vite + Tailwind + React Query
- [x] Panel admin: cursos, alumnos, detalle alumno, detalle curso
- [x] Repo GitHub (privado) + ramas main/dev
- [x] CI/CD: push a dev → auto-deploy en Pi (runner raspberrypi-escuela)
- [x] Tablas responsive (mobile first), filtros por URL
- [x] Migración Excel 2000-2025 (10.325 enrollments, 5.021 alumnos, 310 cursos)

## v1.1.x [✅ COMPLETO]
- [x] Estado draft/pending/enrolled en Student
- [x] Flujo activación: email Resend → alumno completa datos → User creado
- [x] Página /activate/:token con campos DNI, teléfono, contraseña con toggle visibilidad
- [x] Soft delete en Student y Enrollment (paranoid: true)
- [x] Sistema Toast global (ToastProvider)
- [x] Logging HTTP (morgan) y errores en controladores
- [x] Panel Configuración (/admin/configuracion): academy_name, base_url, email remitente, TTL token
- [x] Panel Gestores (/admin/usuarios): crear/eliminar gestores (solo admin)
- [x] Botón eliminar alumno (solo admin, soft delete)
- [x] Editor plantillas PDF (click para posicionar campos)
- [x] Resend configurado con dominio miguesync.es verificado
- [x] Validación email duplicado → 409

## v1.2.x [✅ COMPLETO]
- [x] Eliminado CourseEdition de todo el código y documentación
- [x] Filtros en lista alumnos: por curso, estado, rango fechas
- [x] Índices SQLite (7 índices) → queries de 55s → 0.16s
- [x] GET /api/courses/:id paginado (evita timeout con cursos grandes)
- [x] GET /api/students sin includes innecesarios (2m47s → 0.26s)
- [x] ARCHITECTURE.md con reglas de oro para desarrollo
- [x] Tests: 15 backend (Jest) + 3 frontend (Vitest)
- [x] CI/CD: tests antes del deploy (falla = no despliega)

## Pendiente

### Diplomas PDF [PRÓXIMO]
- [ ] Upload plantilla PDF por curso
- [ ] Editor visual: preview PDF + click para posicionar campos
- [ ] Generación PDF con pdf-lib (insertar texto en coordenadas)
- [ ] Descarga del PDF generado
- [ ] Envío por email (Resend) con PDF adjunto
- [ ] Ficha de inscripción (plantilla global en AppConfig)
- [ ] Numeración correlativa de diplomas

### Producción [PENDIENTE]
- [ ] Workflow CI/CD main → miguesync.es
- [ ] Migrar SQLite → MariaDB (ya instalado en miguesync.es)
- [ ] Configurar nginx en miguesync.es con subdominio
- [ ] Variables de entorno producción
