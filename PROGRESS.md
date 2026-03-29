# PROGRESS.md — Estado del proyecto

## Fase 1 — Base [ COMPLETADA ✅ ]
- [x] Estructura backend (Express + Sequelize + SQLite)
- [x] Modelos: User, Student, Course, CourseEdition, Enrollment, DiplomaTemplate, Diploma
- [x] Auth: login, JWT middleware, roles
- [x] Seed: usuario admin/admin
- [x] CRUD Cursos (backend)
- [x] CRUD Alumnos (backend)
- [x] Sistema tokens activación + email (Nodemailer)
- [x] CRUD Inscripciones (backend) + aprobar/rechazar
- [x] Estructura frontend (React + Vite + Tailwind v4)
- [x] React Router + layouts (admin / alumno)
- [x] Login / Auth store (Zustand + persist)
- [x] Panel admin: cursos (lista, crear, editar, eliminar, búsqueda)
- [x] Panel admin: alumnos (lista, buscar, paginación, crear, enviar activación)
- [x] Panel admin: inscripciones (filtros por estado, aprobar/rechazar)
- [x] Panel admin: dashboard (4 stats cards)
- [x] Vista alumno: mis cursos
- [x] Vista alumno: editar perfil
- [x] Formulario activación por token (ruta pública /activate/:token)
- [x] Repo GitHub + ramas main/dev → https://github.com/mbol8309/gestion-escuela
- [ ] CI/CD: workflow dev → Pi, main → miguesync.es

## Fase 2 — Inscripciones [ PENDIENTE ]
- [ ] Flujo solicitud inscripción (alumno desde portal)
- [ ] Panel gestor: gestión de solicitudes avanzada
- [ ] Notificación email al aprobar/rechazar
- [ ] Dashboard con métricas detalladas

## Fase 3 — Diplomas [ PENDIENTE ]
- [ ] Upload plantilla PDF base
- [ ] Editor de campos (posición drag & drop)
- [ ] Generación PDF por alumno
- [ ] Envío masivo por email
- [ ] Número de registro correlativo

## Fase 4 — Migración Excel [ PENDIENTE ]
- [ ] Script de importación del Excel histórico
- [ ] Mapeo de cursos únicos
- [ ] Importación de alumnos con deduplicación
