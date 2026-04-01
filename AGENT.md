# AGENT.md — Agente de desarrollo: gestion-escuela

## Descripción del proyecto
Plataforma web para gestión de academias: cursos, alumnos, inscripciones y diplomas PDF.
Backend Node.js desligado del frontend React, preparado para app móvil futura.

## Stack
- **Backend:** Node.js + Express + Sequelize ORM + SQLite (migrable a MySQL/MariaDB)
- **Auth:** JWT + bcrypt
- **Email:** Resend (dominio miguesync.es verificado)
- **PDF:** pdf-lib
- **Frontend:** React + Vite + React Router v6 + React Query
- **Forms/Estado:** React Hook Form + Zod + Zustand
- **HTTP:** Axios
- **UI:** TailwindCSS
- **CI/CD:** GitHub Actions con self-hosted runner en Raspberry Pi (dev)

## Estructura del repo
```
gestion-escuela/
├── backend/
│   ├── src/
│   │   ├── models/       # Sequelize models (User, Student, Course, Enrollment, DiplomaTemplate, Diploma, AppConfig)
│   │   ├── routes/       # Express routes
│   │   ├── middleware/   # Auth, roles
│   │   ├── services/     # emailService.js (Resend)
│   │   ├── scripts/      # Migraciones de BD
│   │   └── config/       # DB config
│   ├── uploads/          # Logos, plantillas PDF
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # admin/ y portal/
│   │   ├── components/   # UI reutilizable, ToastProvider
│   │   ├── store/        # authStore (Zustand)
│   │   ├── services/     # api.js (Axios)
│   │   └── router/       # React Router config
│   └── package.json
├── AGENT.md
├── SCHEMA.md
├── ARCHITECTURE.md
├── PROGRESS.md
└── README.md
```

## Roles y permisos
- **admin** — acceso total, crea gestores, puede eliminar alumnos
- **gestor** — crea cursos y alumnos, asigna cursos, envía emails, termina cursos, genera diplomas
- **alumno** — ve sus cursos, completa sus datos via link de activación

## Flujos clave (LEER BIEN — no inventar flujos alternativos)

### Flujo 1: Crear alumno e inscribir en curso
1. **Gestor** crea Student con datos mínimos (nombre, email) → status: `draft`
2. **Gestor** asigna uno o más cursos al alumno desde su perfil → crea Enrollment(s) con status: `pending`
3. **Gestor** pulsa "Enviar activación" → se envía email con token (TTL configurable en AppConfig)
4. **Alumno** abre el link, ve sus cursos asignados, completa sus datos (DNI, teléfono, etc.) y crea contraseña
5. Al confirmar → Enrollments: `pending` → `enrolled`, Student: `enrolled`, User creado

> ⚠️ NO existe flujo de "alumno solicita inscripción". El gestor asigna los cursos directamente.

### Flujo 2: Terminar curso y generar diploma
1. **Gestor** entra al perfil del alumno (StudentDetail)
2. Ve los cursos del alumno con status `enrolled`
3. Pulsa "Terminar curso" → Enrollment: `enrolled` → `finished`, se guarda `finishedAt` y `finishedBy`
4. Aparecen opciones para generar plantillas (diplomas) del curso
5. **Gestor** genera PDF con la plantilla del curso → descarga o envía por email

> ⚠️ NO existe "cerrar edición". Se termina el curso para un alumno concreto desde su perfil.

### Flujo 3: Configuración del sistema
- Panel `/admin/configuracion` para gestionar AppConfig
- Claves: academy_name, base_url, email_from_name, email_from_address, activation_token_ttl_hours

## Ramas Git
- **main** — producción (despliega en miguesync.es — pendiente)
- **dev** — desarrollo (despliega automáticamente en raspberrypi.lan)

## Regla obligatoria — Git
**Todo cambio debe hacer push al repo inmediatamente.**
No dejar cambios sin pushear. Siempre:
```bash
git add -A && git commit -m "descripción" && git push origin main && git push origin dev
```

## Comandos útiles
```bash
cd backend && npm run dev      # dev con nodemon (puerto 3001 local, 3002 en Pi)
cd backend && npm test         # Jest tests
cd frontend && npm run dev     # Vite dev server
cd frontend && npm run build   # build producción
cd frontend && npm test -- --run  # Vitest tests
```

## Variables disponibles en plantillas pdfme

Cuando el gestor diseña una plantilla en el editor pdfme, puede añadir campos de texto con estas variables. Al generar el PDF, se sustituyen por los datos reales del alumno/curso:

### Del alumno (Student)
- `firstName` — nombre
- `lastName` — apellidos  
- `fullName` — nombre completo (firstName + lastName)
- `dni` — DNI/NIE
- `email` — email
- `phone` — teléfono
- `address` — dirección
- `birthDate` — fecha de nacimiento (formato dd/mm/yyyy)

### Del curso/inscripción (Enrollment + Course)
- `courseName` — nombre del curso
- `startDate` — fecha de inicio del curso (dd/mm/yyyy)
- `endDate` — fecha de fin prevista (dd/mm/yyyy)
- `finishedAt` — fecha real de finalización (dd/mm/yyyy)

### De la academia (AppConfig)
- `academyName` — nombre de la academia

### TODO pendiente
- El editor pdfme debe mostrar estas variables como opciones al añadir un campo de texto
- El generador debe sustituir las variables en el schema de pdfme antes de generar
- Añadir más variables si se necesitan (ej: `registrationNumber` para número de diploma correlativo)

## Generación de diplomas (actualizado)
- Ruta correcta: `POST /api/templates/generate` con body `{ templateId, enrollmentId }`
- El frontend usa `axios.post` con `responseType: 'blob'` para descargar el PDF
- Mostrar TODAS las plantillas del curso (globales + asignadas), no filtrar por `type`
- El campo `type` ya no existe — usar `scope` (global | course)
