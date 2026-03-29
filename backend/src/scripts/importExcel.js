#!/usr/bin/env node
/**
 * importExcel.js - Migración histórica de Excel a SQLite
 * Uso: node src/scripts/importExcel.js
 * O con ruta personalizada: EXCEL_PATH=./archivo.xlsx node src/scripts/importExcel.js
 */

const path = require('path');
const XLSX = require('xlsx');

// Configurar ruta de BD para producción si se pasa via env
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

// Override database path before loading models
process.env.DB_STORAGE = DB_PATH;

// Patch sequelize config to use env var if set
const { Sequelize } = require('sequelize');
const sequelizeConfig = require('../config/database');

// Si DB_PATH es diferente al default, crear nueva instancia
let sequelize = sequelizeConfig;
if (process.env.DB_PATH) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_PATH,
    logging: false,
  });
}

const { DataTypes } = require('sequelize');

// Definir modelos directamente con la instancia correcta
const Course = sequelize.define('Course', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  logo: { type: DataTypes.STRING },
  createdBy: { type: DataTypes.UUID },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const CourseEdition = sequelize.define('CourseEdition', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  courseId: { type: DataTypes.UUID, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  startDate: { type: DataTypes.DATE },
  endDate: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('active', 'finished', 'cancelled'), defaultValue: 'finished' },
});

const Student = sequelize.define('Student', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  dni: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  birthDate: { type: DataTypes.DATE },
  activationToken: { type: DataTypes.STRING },
  activationTokenExpiry: { type: DataTypes.DATE },
  userId: { type: DataTypes.UUID, allowNull: true },
});

const Enrollment = sequelize.define('Enrollment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  editionId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'approved' },
  requestedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  resolvedAt: { type: DataTypes.DATE },
  resolvedBy: { type: DataTypes.UUID },
  notes: { type: DataTypes.TEXT },
  registrationNumber: { type: DataTypes.STRING },
});

// ─── Normalización de cursos ────────────────────────────────────────────────
const COURSE_NORMALIZATION = {
  'MASTER UÑAS': ['MASTER UÑAS', 'MÁSTER UÑAS', 'MÁSTER DE UÑAS', 'MASTER DE UÑAS', "MASTER D'UNGLES", 'MASTER UNGLES', 'MÁSTER', 'MASTER', "MÀSTER D'UNGLES"],
  'MANOS Y PIES': ['MANOS Y PIES', 'BELLEZA DE MANOS', 'BELLEZA DE PIES', 'BELLEZA MANOS', 'BELLEZA PIES'],
  'MAQUILLAJE SOCIAL': ['MAQUILLAJE SOCIAL'],
  'MAQUILLAJE INTEGRAL': ['MAQUILLAJE INTEGRAL'],
  'ESTÉTICA INTEGRAL': ['ESTÉTICA INTEGRAL', 'ESTETICA INTEGRAL', 'ESTÉTICA AVANZADA', 'EST. INTEGRAL', 'EST INTEGRAL', 'EST. AVANZADA', 'EST AVANZADA'],
  'HIGIENICO SANITARIO': ['HIGIENICO SANITARIO', 'HIG. SANITARIO', 'HIGIENICO', 'HIGIÉNICO SANITARIO', 'HIG SANITARIO'],
  'MICROPIGMENTACION': ['MICROPIGMENTACION', 'MICROPIGMENTACIÓ', 'MICROPIGMENTACIO'],
  'DECORACION DE UÑAS': ['DECORACION', 'DECORACIÓN DE UÑAS', 'DECORACION DE UÑAS', 'DECO UÑAS'],
  'BARBERIA': ['BARBERIA', 'BARBERÍA'],
  'ESPECIALISTA EN LA MIRADA': ['ESPECIALISTA EN LA MIRADA', 'ESP. MIRADA', 'ESP.MIRADA', 'ESPECIALISTA', 'E.MIRADA'],
  'PIERCING': ['PIERCING'],
  'PELUQUERIA INTEGRAL': ['PELUQUERIA INTEGRAL', 'PELUQUERÍA INTEGRAL'],
  'AVANZADO DE UÑAS': ['AVANZADO DE UÑAS', 'AVANZADO UÑAS'],
  'MASTER TATTOO': ['MASTER TATTOO', 'TATTOO', 'TATOO', 'TATU'],
  'APARATOLOGIA': ['APARATOLOGIA', 'APARATOLOGÍA'],
  'REFLEXOLOGIA PODAL': ['REFLEXOLOGIA PODAL'],
  'KENKOU': ['KENKOU'],
  'MICROBLADING': ['MICROBLADING'],
};

// Build reverse lookup: variant (uppercase) → canonical name
const COURSE_LOOKUP = {};
for (const [canonical, variants] of Object.entries(COURSE_NORMALIZATION)) {
  for (const v of variants) {
    COURSE_LOOKUP[v.toUpperCase().trim()] = canonical;
  }
}

function normalizeCourse(name) {
  if (!name) return null;
  const upper = String(name).toUpperCase().trim();
  return COURSE_LOOKUP[upper] || String(name).trim().toUpperCase();
}

// ─── Detección dinámica de columnas ─────────────────────────────────────────
function detectColumns(headers) {
  const cols = {};
  headers.forEach((h, i) => {
    if (!h) return;
    const s = String(h).toLowerCase().trim();
    if (!cols.reg && (s.includes('reg') || s.includes('nº') || s.includes('n°') || s.includes('num') || s === 'n')) cols.reg = i;
    else if (!cols.nombre && (s.includes('nombre') || s.includes('alumno'))) cols.nombre = i;
    else if (!cols.dni && s.includes('dni')) cols.dni = i;
    else if (!cols.curso && s.includes('curso')) cols.curso = i;
    else if (!cols.fecha && s.includes('fecha')) cols.fecha = i;
    else if (!cols.email && (s.includes('email') || s.includes('correo') || s.includes('mail'))) cols.email = i;
  });
  return cols;
}

// ─── Parsear fecha ────────────────────────────────────────────────────────────
function parseDate(val) {
  if (!val) return null;
  // Excel serial date number
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  if (val instanceof Date) return val;
  const s = String(val).trim();
  if (!s) return null;
  // Try DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    return new Date(y, parseInt(m[2]) - 1, parseInt(m[1]));
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const excelPath = process.env.EXCEL_PATH ||
    path.join(__dirname, '../../../../..', '.openclaw/media/inbound/REG_DIPLOMAS---04753799-124d-42a0-8e82-fe6ba4731907.xlsx');

  console.log(`📂 Excel: ${excelPath}`);
  console.log(`🗄️  DB: ${DB_PATH}`);

  await sequelize.authenticate();
  console.log('✅ DB conectada\n');

  const workbook = XLSX.readFile(excelPath);
  const sheetNames = workbook.SheetNames.filter(n => n.toUpperCase() !== 'PLANTILLA');
  console.log(`📋 Hojas a procesar: ${sheetNames.join(', ')}\n`);

  // Counters
  let coursesCreated = 0, editionsCreated = 0, studentsCreated = 0;
  let enrollmentsCreated = 0, duplicatesSkipped = 0, errors = 0;
  let totalProcessed = 0;

  // Caches
  const courseCache = {};   // name → Course instance
  const editionCache = {};  // `${courseId}_${year}` → CourseEdition instance
  const studentCache = {};  // dni or fullname → Student instance

  // Pre-load existing data
  const existingCourses = await Course.findAll();
  for (const c of existingCourses) courseCache[c.name] = c;

  const existingStudents = await Student.findAll();
  for (const s of existingStudents) {
    if (s.dni) studentCache[`dni:${s.dni.toUpperCase().trim()}`] = s;
    else studentCache[`name:${(s.firstName + ' ' + s.lastName).toUpperCase().trim()}`] = s;
  }

  const existingEnrollments = await Enrollment.findAll({ attributes: ['studentId', 'editionId', 'registrationNumber'] });
  const enrollmentSet = new Set(existingEnrollments.map(e => `${e.studentId}_${e.editionId}`));

  for (const sheetName of sheetNames) {
    // Extract year from sheet name
    const yearMatch = sheetName.match(/\d{4}/);
    const sheetYear = yearMatch ? parseInt(yearMatch[0]) : null;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (!rows || rows.length < 2) {
      console.log(`⚠️  Hoja "${sheetName}" vacía o sin datos, omitida.`);
      continue;
    }

    // Find header row (first non-empty row)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (row && row.some(c => c && String(c).toLowerCase().match(/nombre|dni|curso|fecha/))) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = rows[headerRowIdx];
    const cols = detectColumns(headers);

    if (cols.nombre === undefined) {
      console.log(`⚠️  Hoja "${sheetName}": no se encontró columna 'nombre', omitida.`);
      continue;
    }

    console.log(`📄 Procesando hoja: "${sheetName}" (año: ${sheetYear || 'desconocido'}, filas: ${rows.length - headerRowIdx - 1})`);

    for (let ri = headerRowIdx + 1; ri < rows.length; ri++) {
      const row = rows[ri];
      if (!row || row.every(c => c === null || c === '')) continue;

      const rawNombre = row[cols.nombre];
      if (!rawNombre) continue;

      try {
        const fullName = String(rawNombre).trim();
        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0] || 'Desconocido';
        const lastName = nameParts.slice(1).join(' ') || '-';

        const rawDni = cols.dni !== undefined ? row[cols.dni] : null;
        const dni = rawDni ? String(rawDni).toUpperCase().trim() : null;

        const rawCurso = cols.curso !== undefined ? row[cols.curso] : null;
        const cursoNorm = rawCurso ? normalizeCourse(rawCurso) : 'SIN CURSO';

        const rawFecha = cols.fecha !== undefined ? row[cols.fecha] : null;
        const fecha = parseDate(rawFecha);

        const rawEmail = cols.email !== undefined ? row[cols.email] : null;
        const email = rawEmail ? String(rawEmail).trim() : null;

        const rawReg = cols.reg !== undefined ? row[cols.reg] : null;
        const regNum = rawReg ? String(rawReg).trim() : null;

        // Determinar año
        let year = sheetYear;
        if (!year && fecha) year = fecha.getFullYear();
        if (!year) year = 2000;

        // ── Course ──
        if (!courseCache[cursoNorm]) {
          const [course, created] = await Course.findOrCreate({
            where: { name: cursoNorm },
            defaults: { name: cursoNorm, active: true },
          });
          courseCache[cursoNorm] = course;
          if (created) coursesCreated++;
        }
        const course = courseCache[cursoNorm];

        // ── CourseEdition ──
        const edKey = `${course.id}_${year}`;
        if (!editionCache[edKey]) {
          const [edition, created] = await CourseEdition.findOrCreate({
            where: { courseId: course.id, year },
            defaults: { courseId: course.id, year, status: 'finished' },
          });
          editionCache[edKey] = edition;
          if (created) editionsCreated++;
        }
        const edition = editionCache[edKey];

        // ── Student ──
        const studentKey = dni ? `dni:${dni}` : `name:${fullName.toUpperCase().trim()}`;
        if (!studentCache[studentKey]) {
          // Generate placeholder email if needed
          const studentEmail = email || `importado_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@placeholder.local`;
          const [student, created] = await Student.findOrCreate({
            where: dni ? { dni } : sequelize.literal(`UPPER(TRIM(firstName || ' ' || lastName)) = '${fullName.toUpperCase().trim().replace(/'/g, "''")}'`),
            defaults: { firstName, lastName, dni, email: studentEmail, userId: null },
          });
          studentCache[studentKey] = student;
          if (created) studentsCreated++;
        }
        const student = studentCache[studentKey];

        // ── Enrollment ──
        const enrollKey = `${student.id}_${edition.id}`;
        if (enrollmentSet.has(enrollKey)) {
          duplicatesSkipped++;
        } else {
          await Enrollment.create({
            studentId: student.id,
            editionId: edition.id,
            status: 'approved',
            resolvedAt: fecha || new Date(`${year}-06-01`),
            registrationNumber: regNum,
            notes: `Importado desde Excel histórico - Hoja ${sheetName}`,
          });
          enrollmentSet.add(enrollKey);
          enrollmentsCreated++;
        }

        totalProcessed++;
        if (totalProcessed % 100 === 0) {
          console.log(`  → ${totalProcessed} registros procesados...`);
        }

      } catch (err) {
        errors++;
        console.error(`  ❌ Error en hoja "${sheetName}" fila ${ri + 1}: ${err.message}`);
      }
    }

    console.log(`  ✓ Hoja "${sheetName}" completada`);
  }

  console.log('\n════════════════════════════════════════');
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('════════════════════════════════════════');
  console.log(`✅ Cursos creados:        ${coursesCreated}`);
  console.log(`✅ Ediciones creadas:     ${editionsCreated}`);
  console.log(`✅ Alumnos creados:       ${studentsCreated}`);
  console.log(`✅ Inscripciones creadas: ${enrollmentsCreated}`);
  console.log(`⏭️  Duplicados omitidos:   ${duplicatesSkipped}`);
  console.log(`❌ Errores:               ${errors}`);
  console.log(`📝 Total filas procesadas: ${totalProcessed}`);
  console.log('════════════════════════════════════════\n');

  await sequelize.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
