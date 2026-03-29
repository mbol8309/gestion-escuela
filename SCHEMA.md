# SCHEMA.md — Modelo de datos

## User
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | STRING | unique |
| password | STRING | bcrypt hash |
| role | ENUM | admin, gestor, alumno |
| studentId | FK | null si no es alumno |
| active | BOOLEAN | |
| createdAt | DATE | |

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
| activationToken | STRING | nullable, expira |
| activationTokenExpiry | DATE | nullable |
| userId | FK | null hasta activación |
| createdAt | DATE | |

## Course
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | STRING | |
| description | TEXT | |
| logo | STRING | path al archivo |
| createdBy | FK | User gestor |
| active | BOOLEAN | |
| createdAt | DATE | |

## CourseEdition
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| courseId | FK | Course |
| year | INTEGER | |
| startDate | DATE | |
| endDate | DATE | nullable |
| status | ENUM | active, finished, cancelled |
| createdAt | DATE | |

## Enrollment
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| studentId | FK | Student |
| editionId | FK | CourseEdition |
| status | ENUM | pending, approved, rejected |
| requestedAt | DATE | |
| resolvedAt | DATE | nullable |
| resolvedBy | FK | User gestor, nullable |
| notes | TEXT | nullable |

## DiplomaTemplate
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| courseId | FK | Course |
| name | STRING | |
| pdfPath | STRING | path plantilla base |
| fields | JSON | [{name, x, y, fontSize, ...}] |
| createdAt | DATE | |

## Diploma
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| enrollmentId | FK | Enrollment |
| templateId | FK | DiplomaTemplate |
| pdfPath | STRING | path PDF generado |
| sentAt | DATE | nullable |
| registrationNumber | STRING | Nº reg. correlativo |
| createdAt | DATE | |
