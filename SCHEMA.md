# SCHEMA.md — Modelo de datos v2.0

## Cambios respecto a v1.0
- **Eliminado:** `CourseEdition` — los cursos son fluidos, sin divisiones por año
- **Modificado:** `Enrollment` — es la relación central alumno↔curso, con fechas propias y estados
- **Modificado:** `Student` — añade campo `status`
- **Modificado:** `DiplomaTemplate` — añade `type` para distinguir ficha de inscripción vs diploma
- **Nuevo:** `AppConfig` — configuración global del sistema

---

## User
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | STRING | unique |
| passwordHash | STRING | bcrypt |
| role | ENUM | admin, gestor, alumno |
| studentId | FK | null si no es alumno |
| active | BOOLEAN | |
| timestamps | | |

## Student
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| firstName | STRING | |
| lastName | STRING | |
| dni | STRING | |
| email | STRING | |
| phone | STRING | nullable |
| address | STRING | nullable |
| birthDate | DATE | nullable |
| status | ENUM | pending, enrolled, active |
| activationToken | STRING | nullable |
| activationTokenExpiry | DATE | nullable |
| userId | FK | null hasta activación |
| timestamps | | |

## Course
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | STRING | |
| description | TEXT | |
| logo | STRING | path |
| createdBy | FK User | |
| active | BOOLEAN | |
| timestamps | | |

## Enrollment (relación alumno ↔ curso — entidad central)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| studentId | FK Student | |
| courseId | FK Course | directo, sin edición intermedia |
| status | ENUM | pending, enrolled, finished, rejected |
| startDate | DATE | fecha inicio, la pone el gestor |
| endDate | DATE | fecha fin prevista, opcional |
| finishedAt | DATE | cuando gestor marca como terminado |
| finishedBy | FK User | gestor que cerró el curso |
| enrollmentFormSentAt | DATE | cuando se envió ficha para firmar |
| resolvedBy | FK User | gestor que aprobó/rechazó |
| notes | TEXT | nullable |
| timestamps | | |

## DiplomaTemplate
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| courseId | FK Course | nullable si type=enrollment_form (es global) |
| name | STRING | "Diploma de Asistencia", "Título Oficial"... |
| type | ENUM | enrollment_form, diploma |
| pdfPath | STRING | path a la plantilla base |
| fields | JSON | [{field, x, y, fontSize, fontFamily, color}] |
| timestamps | | |

**Campos disponibles para plantillas:**
- `firstName`, `lastName`, `fullName`
- `dni`, `email`, `phone`, `address`, `birthDate`
- `courseName`, `startDate`, `endDate`, `finishedAt`
- `academyName` (de AppConfig)

## Diploma (PDF generado para un alumno)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| enrollmentId | FK Enrollment | |
| templateId | FK DiplomaTemplate | |
| pdfPath | STRING | path PDF generado |
| sentAt | DATE | nullable |
| registrationNumber | STRING | Nº correlativo |
| timestamps | | |

## AppConfig (configuración global)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER | PK autoincrement |
| key | STRING | unique |
| value | TEXT | |
| description | STRING | texto para mostrar en UI |
| timestamps | | |

**Claves predefinidas:**
- `activation_token_ttl_hours` — TTL token activación (default: 48)
- `academy_name` — Nombre de la academia
- `smtp_from` — Email remitente
- `enrollment_form_template_id` — ID de la plantilla global de ficha de inscripción

---

## Flujo completo

### 1. Gestor crea alumno
- Datos mínimos: nombre, apellidos, email, DNI
- Asigna cursos con startDate (endDate opcional)
- Se crean Enrollments con status: 'pending'

### 2. Email de activación
- Gestor pulsa "Enviar email" en perfil del alumno
- Alumno recibe link con JWT token (TTL de AppConfig)
- Alumno completa datos y pulsa "Confirmar inscripción"
- Todos sus Enrollments → status: 'enrolled'
- Se crea su User con rol alumno

### 3. Ficha de inscripción
- Cuando alumno está enrolled, gestor genera PDF con plantilla global (enrollment_form)
- Se puede imprimir para firma física

### 4. Finalización
- Gestor entra al perfil del alumno
- Pulsa "Terminar curso" → Enrollment.status = 'finished', se guarda finishedAt + finishedBy

### 5. Diploma
- Para cada Enrollment finished, gestor genera PDFs de plantillas tipo 'diploma' del curso
- Puede enviar por email o descargar para imprimir
