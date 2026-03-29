/**
 * Migration v2 — Fase 2
 * - Añade columnas nuevas a Enrollments (courseId, startDate, endDate, finishedAt, finishedBy, enrollmentFormSentAt)
 * - Rellena courseId desde CourseEdition para registros existentes
 * - Crea tabla AppConfig con valores por defecto
 * - Actualiza DiplomaTemplate: añade columna type
 * - NO borra CourseEditions (compatibilidad)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../..', '.env') });
const sequelize = require('../config/database');

async function run() {
  console.log('🔄 Iniciando migración v2...');

  // ─── Enrollments: añadir columnas nuevas ───────────────────────────────────
  const addColIfNotExists = async (table, column, definition) => {
    try {
      await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
      console.log(`  ✅ ${table}.${column} añadido`);
    } catch (e) {
      if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
        console.log(`  ⏭  ${table}.${column} ya existe`);
      } else {
        throw e;
      }
    }
  };

  await addColIfNotExists('Enrollments', 'courseId', 'TEXT');
  await addColIfNotExists('Enrollments', 'startDate', 'DATETIME');
  await addColIfNotExists('Enrollments', 'endDate', 'DATETIME');
  await addColIfNotExists('Enrollments', 'finishedAt', 'DATETIME');
  await addColIfNotExists('Enrollments', 'finishedBy', 'TEXT');
  await addColIfNotExists('Enrollments', 'enrollmentFormSentAt', 'DATETIME');

  // ─── Rellenar courseId desde CourseEdition ─────────────────────────────────
  const [enrollments] = await sequelize.query(`
    SELECT e.id, e.editionId, ce.courseId, ce.year
    FROM Enrollments e
    LEFT JOIN CourseEditions ce ON ce.id = e.editionId
    WHERE e.courseId IS NULL AND e.editionId IS NOT NULL
  `);

  console.log(`  📋 ${enrollments.length} enrollments sin courseId — rellenando...`);
  for (const enr of enrollments) {
    if (!enr.courseId) continue;
    const startDate = enr.year ? `${enr.year}-01-01` : null;
    await sequelize.query(
      `UPDATE Enrollments SET courseId = ?, startDate = ? WHERE id = ?`,
      { replacements: [enr.courseId, startDate, enr.id] }
    );
  }
  console.log(`  ✅ courseId rellenado`);

  // ─── Actualizar status: 'approved' → 'enrolled' ────────────────────────────
  await sequelize.query(`UPDATE Enrollments SET status = 'enrolled' WHERE status = 'approved'`);
  console.log(`  ✅ status 'approved' → 'enrolled'`);

  // ─── DiplomaTemplate: añadir type ─────────────────────────────────────────
  await addColIfNotExists('DiplomaTemplates', 'type', `TEXT DEFAULT 'diploma'`);

  // ─── Crear tabla AppConfig ─────────────────────────────────────────────────
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "AppConfigs" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "key" TEXT UNIQUE NOT NULL,
      "value" TEXT,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log(`  ✅ Tabla AppConfigs creada / ya existía`);

  // ─── Insertar valores por defecto ─────────────────────────────────────────
  const defaults = [
    { key: 'activation_token_ttl_hours', value: '48', description: 'Horas de validez del token de activación por email' },
    { key: 'academy_name', value: 'Mi Academia', description: 'Nombre de la academia (aparece en PDFs)' },
    { key: 'smtp_from', value: 'noreply@example.com', description: 'Email remitente para envíos' },
  ];

  for (const d of defaults) {
    await sequelize.query(
      `INSERT OR IGNORE INTO AppConfigs ("key", "value", "description", "createdAt", "updatedAt")
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      { replacements: [d.key, d.value, d.description] }
    );
  }
  console.log(`  ✅ Valores AppConfig insertados`);

  console.log('🎉 Migración v2 completada con éxito');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
