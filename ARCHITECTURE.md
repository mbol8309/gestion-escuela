# ARCHITECTURE.md — Guía técnica para desarrollo

## Reglas de oro (leer antes de tocar código)

### ⚠️ Lo que NUNCA hay que hacer
1. **Includes sin límite en listas** — si una entidad tiene miles de registros relacionados (Enrollments, Students), NUNCA hacer `include: [Model]` sin `limit`. Siempre paginar o hacer query separada.
2. **Sobreescribir .env de producción** — el rsync excluye `.env`. Nunca subirlo al repo.
3. **`alter: true` en sync** — roto. El servidor usa `alter: false`. Las migraciones se hacen con scripts en `src/scripts/`.
4. **Borrar columnas sin migración** — siempre crear script de migración que preserve datos.

### ✅ Patrones correctos

#### Queries con relaciones en listas
```js
// ❌ MAL — bloquea con 10k registros
Course.findByPk(id, { include: [{ model: Enrollment, include: [Student] }] })

// ✅ BIEN — paginado y separado
const course = await Course.findByPk(id); // solo el curso
const { count, rows } = await Enrollment.findAndCountAll({
  where: { courseId: id },
  include: [Student],
  limit: 30, offset: page * 30
});
```

#### Migraciones de BD
Crear script en `backend/src/scripts/migrate-vX.js`, ejecutar manualmente en la Pi:
```bash
ssh mbolivar@raspberrypi.lan "cd /srv/projects/gestion-escuela/backend && node src/scripts/migrate-vX.js"
```

---

## Modelo de datos actual (v1.2.x)

```
User (admin | gestor | alumno)
  └── Student (1:1 via studentId)
        └── Enrollment (N:M con Course)
              └── Course
                    └── DiplomaTemplate (N por curso)
                          └── Diploma (generado por enrollment)

AppConfig (tabla clave-valor para configuración global)
```

### Estados del alumno (Student.status)
- `draft` — creado por gestor, sin cursos asignados aún
- `pending` — email de activación enviado, esperando que complete datos
- `enrolled` — activó su cuenta (via token)
- `active` — activo en el sistema

### Estados de inscripción (Enrollment.status)
- `pending` — asignado por gestor, alumno no ha confirmado
- `enrolled` — alumno confirmó su inscripción
- `finished` — gestor marcó el curso como terminado
- `rejected` — rechazado

### Soft delete
Tanto `Student` como `Enrollment` usan `paranoid: true` (Sequelize). Al hacer `.destroy()` se rellena `deletedAt` en vez de borrar. Las queries normales ignoran los soft-deleted automáticamente.

---

## Flujos principales

### 1. Crear alumno y asignar curso
1. Gestor crea Student (nombre, email mínimo) → status: `draft`
2. Gestor asigna curso desde StudentDetail → crea Enrollment (status: `pending`)
3. Gestor pulsa "Enviar activación" → email con token (TTL de AppConfig)
4. Alumno abre link → rellena DNI, teléfono, dirección, contraseña
5. Al confirmar → Enrollment: `pending` → `enrolled`, Student: `enrolled`, User creado

### 2. Terminar curso
- Gestor en StudentDetail → botón "Terminar" en enrollment con status `enrolled`
- Enrollment: `enrolled` → `finished`, se guarda `finishedAt` y `finishedBy`

### 3. Diploma
- Gestor sube plantilla PDF en CourseDetail → DiplomaTemplate
- Configura campos (coordenadas X/Y) con el editor click-to-place
- Genera PDF por alumno desde StudentDetail → descarga o envío por email

---

## API endpoints principales

### Alumnos
- `GET /api/students?search=&courseId=&enrollmentStatus=&startDateFrom=&startDateTo=&page=&limit=`
- `POST /api/students` — crear (nombre, email mínimo)
- `GET /api/students/:id` — detalle con Enrollments
- `PUT /api/students/:id` — editar
- `DELETE /api/students/:id` — soft delete (solo admin)
- `POST /api/students/:id/send-activation` — enviar email de activación
- `GET /api/students/activate/:token` — obtener datos para pre-rellenar formulario
- `PUT /api/students/activate/:token` — confirmar inscripción (campos: firstName, lastName, dni, phone, address, birthDate, password)

### Cursos
- `GET /api/courses?search=` — lista (sin includes pesados)
- `POST /api/courses` — crear
- `GET /api/courses/:id?page=&limit=&status=` — detalle con Enrollments paginados
- `PUT /api/courses/:id` — editar
- `DELETE /api/courses/:id` — soft delete (solo admin)

### Inscripciones
- `GET /api/enrollments?status=&courseId=&startDateFrom=&startDateTo=`
- `POST /api/enrollments` — crear (studentId, courseId, startDate, endDate)
- `PUT /api/enrollments/:id/finish` — marcar como terminado
- `DELETE /api/enrollments/:id` — soft delete (gestor/admin)

### Configuración
- `GET /api/config` — leer todas las claves
- `PUT /api/config` — actualizar (body: { key: value, ... })

**Claves de AppConfig:**
- `activation_token_ttl_hours` — TTL token activación (default: 48)
- `academy_name` — nombre de la academia
- `base_url` — URL base para links en emails
- `email_from_name` — nombre remitente emails
- `email_from_address` — dirección remitente emails

---

## Índices de BD (SQLite)
```sql
idx_enrollments_courseId
idx_enrollments_studentId
idx_enrollments_status
idx_enrollments_startDate
idx_students_email
idx_students_status
idx_students_userId
```

---

## Despliegue

### Dev (Raspberry Pi)
- URL: `http://escuela.raspberrypi.lan` o `http://100.117.252.96` (Tailscale)
- Backend: puerto 3002, systemd `gestion-escuela-api`
- Frontend: nginx sirviendo `/srv/projects/gestion-escuela/frontend/`
- BD: SQLite en `/srv/projects/gestion-escuela/backend/database.sqlite`
- CI/CD: push a `dev` → GitHub Actions → self-hosted runner Pi

### Producción (miguesync.es) — pendiente
- Mismo stack, migrar BD a MySQL
- Workflow: push a `main` → GitHub Actions → runner en miguesync.es

---

## Versiones
- `v1.0.0` — Fase 1 completa: CRUD básico, auth, migración Excel
- `v1.1.x` — Flujo de activación, Resend email, soft delete, filtros URL, React Query
- `v1.2.x` — índices BD, paginación, filtros alumnos
