# PROGRESS.md — Estado del proyecto

## Fase 1 — Base [✅ COMPLETA - v1.0.0]
- [x] Estructura backend (Express + Sequelize + SQLite)
- [x] Modelos: User, Student, Course, Enrollment, DiplomaTemplate, Diploma, AppConfig
- [x] Auth: login, JWT middleware, roles
- [x] Seed: usuario admin@admin.com / admin
- [x] CRUD Cursos, Ediciones, Alumnos, Inscripciones
- [x] Sistema tokens activación
- [x] Frontend React + Vite + Tailwind
- [x] Panel admin: cursos, alumnos, inscripciones
- [x] Repo GitHub + ramas main/dev
- [x] CI/CD: workflow dev → Pi
- [x] Tablas responsive (mobile first)
- [x] Filtros por URL (useSearchParams)
- [x] React Query (loading states)
- [x] Detalle alumno + detalle curso
- [x] Migración Excel (12.796 registros → 5.021 alumnos, 310 cursos)
- [x] Usuarios creados para alumnos importados
- [x] Tag v1.0.0

## Fase 2 — Rediseño lógica de cursos [EN PROGRESO]

### Backend
- [ ] Modelo Enrollment v2: courseId directo, startDate, endDate, finishedAt, finishedBy, status nuevo
- [ ] Modelo AppConfig
- [ ] Ruta PUT /api/enrollments/:id/finish
- [ ] Ruta GET/PUT /api/config
- [ ] Ruta POST /api/students con asignación de cursos en el mismo paso
- [ ] Token de activación con TTL desde AppConfig
- [ ] Página de activación: alumno completa datos + confirma inscripción

### Frontend - Plantillas PDF
- [ ] Upload plantilla PDF por curso (tipo: diploma)
- [ ] Upload plantilla global ficha de inscripción (AppConfig)
- [ ] Visor PDF con preview por página (imagen)
- [ ] Editor de campos: click en posición → guarda coordenadas X/Y
- [ ] Generación PDF con pdf-lib insertando texto en coordenadas
- [ ] Descarga / envío por email de PDF generado

### Frontend - Flujos
- [ ] Crear alumno v2: datos mínimos + asignar cursos con fechas en el mismo modal
- [ ] Perfil alumno (portal): ver cursos asignados, completar datos, botón "Confirmar inscripción"
- [ ] Panel admin alumno: botón "Terminar curso" por enrollment
- [ ] Panel admin alumno: generar ficha de inscripción PDF
- [ ] Panel admin alumno: generar diploma(s) PDF
- [ ] Filtros en lista alumnos: rango de fechas, activos/terminados
- [ ] Panel de configuración global /admin/configuracion

## Fase 3 — Diplomas y email [PENDIENTE]
- [ ] Envío de diploma por email (Nodemailer)
- [ ] Historial de emails enviados
- [ ] Numeración correlativa de diplomas

## Fase 4 — Producción [PENDIENTE]
- [ ] Workflow CI/CD main → miguesync.es
- [ ] Configuración IONOS DNS
- [ ] Variables de entorno producción
