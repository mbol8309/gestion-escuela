# SCHEMA.md — Modelo de datos

## Entidades

### User
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | STRING | unique |
| passwordHash | STRING | bcrypt |
| role | STRING | admin \| gestor \| alumno |
| studentId | UUID FK | null si no es alumno |
| active | BOOLEAN | |

### Student
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| firstName | STRING | obligatorio |
| lastName | STRING | obligatorio |
| email | STRING | unique, obligatorio |
| dni | STRING | nullable — lo rellena el alumno al activar |
| phone | STRING | nullable |
| address | STRING | nullable |
| birthDate | DATE | nullable |
| status | STRING | ver estados abajo |
| activationToken | STRING | nullable |
| activationTokenExpiry | DATE | nullable |
| userId | UUID FK | null hasta que el alumno activa su cuenta |
| deletedAt | DATE | soft delete (paranoid) |

**Estados de Student.status:**
- `draft` — creado por gestor, sin cursos asignados todavía
- `pending` — email de activación enviado, alumno pendiente de completar datos
- `enrolled` — alumno completó sus datos y confirmó inscripción
- `active` — activo (uso futuro)

### Course
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | STRING | |
| description | TEXT | nullable |
| logo | STRING | path al archivo, nullable |
| createdBy | UUID FK | User gestor |

### Enrollment (relación alumno ↔ curso — entidad central)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| studentId | UUID FK | Student |
| courseId | UUID FK | Course — directo, sin intermediarios |
| status | STRING | ver estados abajo |
| startDate | DATE | fecha inicio — la pone el gestor al asignar |
| endDate | DATE | fecha fin prevista, nullable |
| finishedAt | DATE | cuando gestor termina el curso para este alumno |
| finishedBy | UUID FK | User gestor que terminó el curso |
| enrollmentFormSentAt | DATE | cuando se envió la ficha de inscripción |
| notes | TEXT | nullable |
| deletedAt | DATE | soft delete (paranoid) |

**Estados de Enrollment.status:**
- `pending` — gestor asignó el curso, alumno no ha confirmado todavía
- `enrolled` — alumno confirmó su inscripción (activó su cuenta)
- `finished` — gestor marcó el curso como terminado para este alumno
- `rejected` — rechazado (uso manual por gestor)

### DiplomaTemplate
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| courseId | UUID FK | Course al que pertenece |
| name | STRING | ej: "Diploma de Asistencia", "Título Oficial" |
| type | STRING | enrollment_form \| diploma |
| pdfPath | STRING | path a la plantilla PDF base |
| fields | JSON | [{field, x, y, fontSize, color}] |

**Campos disponibles en plantillas:**
`firstName`, `lastName`, `fullName`, `dni`, `email`, `phone`, `courseName`, `startDate`, `endDate`, `finishedAt`, `academyName`

### Diploma (PDF generado)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| enrollmentId | UUID FK | Enrollment |
| templateId | UUID FK | DiplomaTemplate |
| pdfPath | STRING | path al PDF generado |
| sentAt | DATE | nullable |
| registrationNumber | STRING | número correlativo |

### AppConfig (configuración global clave-valor)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER | PK autoincrement |
| key | STRING | unique |
| value | TEXT | |
| description | STRING | texto descriptivo para la UI |

**Claves predefinidas:**
- `activation_token_ttl_hours` — horas de validez del token (default: 48)
- `academy_name` — nombre de la academia (aparece en PDFs)
- `base_url` — URL base para links en emails (ej: http://100.117.252.96)
- `email_from_name` — nombre del remitente de emails
- `email_from_address` — dirección del remitente (debe estar verificada en Resend)

---

## Diagrama de relaciones
```
User (admin | gestor | alumno)
  └── Student (1:1 via studentId)
        └── Enrollment ←→ Course
              ├── DiplomaTemplate (N por curso)
              └── Diploma (generado por enrollment + template)

AppConfig (tabla independiente, clave-valor)
```

---

## Flujo completo

### 1. Crear e inscribir alumno
1. Gestor crea Student (nombre + email mínimo) → `draft`
2. Gestor asigna curso(s) desde StudentDetail → Enrollment(s) `pending` con startDate
3. Gestor pulsa "Enviar activación" → email Resend con token
4. Alumno abre link → rellena DNI, teléfono, dirección, fecha nac., contraseña
5. Alumno confirma → Student: `enrolled`, Enrollments: `enrolled`, User creado

### 2. Terminar curso y diploma
1. Gestor entra a StudentDetail del alumno
2. Localiza el Enrollment `enrolled` del curso
3. Pulsa "Terminar" → Enrollment: `finished`, se registra finishedAt + finishedBy
4. Gestor genera PDF desde las plantillas del curso → descarga o envía por email

### 3. Sin flujo de solicitud de inscripción
**El alumno NO solicita inscripción.** El gestor asigna los cursos directamente.
No existe flujo de aprobación/rechazo de solicitudes por parte del alumno.
