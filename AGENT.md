# AGENT.md — Agente de desarrollo: gestion-escuela

## Descripción del proyecto
Plataforma web para gestión de academias: cursos, ediciones, alumnos, inscripciones y diplomas PDF.
Backend Node.js desligado del frontend React, preparado para app móvil futura.

## Stack
- **Backend:** Node.js + Express + Sequelize ORM + SQLite (migrable a MySQL)
- **Auth:** JWT + bcrypt
- **Email:** Nodemailer
- **PDF:** pdf-lib + Puppeteer
- **Frontend:** React + Vite + React Router v6
- **Forms/Estado:** React Hook Form + Zod + Zustand
- **HTTP:** Axios
- **UI:** TailwindCSS + shadcn/ui
- **CI/CD:** GitHub Actions con self-hosted runner en Raspberry Pi (dev) y miguesync.es (prod)

## Estructura del repo
```
gestion-escuela/
├── backend/
│   ├── src/
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # Express routes
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── middleware/   # Auth, roles, validación
│   │   ├── services/     # Email, PDF, tokens
│   │   └── config/       # DB, env
│   ├── uploads/          # Logos, plantillas PDF
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # Vistas principales
│   │   ├── components/   # UI reutilizable
│   │   ├── hooks/        # Custom hooks
│   │   ├── store/        # Zustand stores
│   │   ├── services/     # Axios calls
│   │   └── router/       # React Router config
│   └── package.json
├── AGENT.md
├── SCHEMA.md
├── PROGRESS.md
└── README.md
```

## Modelo de datos
Ver SCHEMA.md para detalle completo.

### Entidades principales
- **User** — autenticación, roles: admin | gestor | alumno
- **Student** — datos personales, token activación, vinculado a User cuando se activa
- **Course** — nombre, descripción, logo
- **CourseEdition** — año/fechas de una edición del curso
- **Enrollment** — alumno ↔ edición, estados: pending | approved | rejected
- **DiplomaTemplate** — plantilla PDF con campos configurables por curso
- **Diploma** — diploma generado para un alumno en una edición

## Roles y permisos
- **admin** — acceso total, crea gestores
- **gestor** — crea cursos, ediciones, alumnos; aprueba inscripciones; envía diplomas
- **alumno** — ve sus cursos, solicita inscripciones

## Flujos clave
1. Gestor crea alumno (datos mínimos) → email con token → alumno completa datos → se crea User
2. Alumno solicita inscripción → gestor aprueba → inscrito
3. Gestor cierra edición → genera PDFs con plantilla → envío masivo email
4. Admin por defecto: usuario=admin, password=admin

## Ramas Git
- **main** — producción (despliega en miguesync.es)
- **dev** — desarrollo (despliega en raspberrypi.lan)

## CI/CD (a configurar)
- Push a `dev` → GitHub Actions → self-hosted runner Pi → deploy en Pi
- Push a `main` → GitHub Actions → self-hosted runner miguesync.es → deploy en cloud

## Estado del proyecto
Ver PROGRESS.md para seguimiento de fases.

## Comandos útiles
```bash
# Backend
cd backend && npm run dev      # dev con nodemon
cd backend && npm start        # producción

# Frontend  
cd frontend && npm run dev     # Vite dev server
cd frontend && npm run build   # build producción
```
