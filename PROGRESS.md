# PROGRESS.md — Estado del proyecto

## Fase 1 — Base [ EN PROGRESO ]
- [ ] Estructura backend (Express + Sequelize + SQLite)
- [ ] Modelos: User, Student, Course, CourseEdition, Enrollment, DiplomaTemplate, Diploma
- [ ] Auth: login, JWT middleware, roles
- [ ] Seed: usuario admin/admin
- [ ] CRUD Cursos (backend)
- [ ] CRUD Ediciones (backend)
- [ ] CRUD Alumnos (backend)
- [ ] Sistema tokens activación + email
- [ ] Estructura frontend (React + Vite + Tailwind + shadcn)
- [ ] React Router + layouts (auth / admin / alumno)
- [ ] Login / Auth store (Zustand)
- [ ] Panel admin: cursos (lista, crear, editar, filtros)
- [ ] Panel admin: alumnos (lista, buscar, filtros, crear)
- [ ] Vista alumno: mis cursos
- [ ] Repo GitHub + ramas main/dev
- [ ] CI/CD: workflow dev → Pi, main → miguesync.es

## Fase 2 — Inscripciones [ PENDIENTE ]
- [ ] Flujo solicitud inscripción (alumno)
- [ ] Panel gestor: gestión de solicitudes
- [ ] Aprobación/rechazo con notificación email
- [ ] Dashboard con métricas

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
