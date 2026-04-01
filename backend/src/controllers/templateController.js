const path = require('path');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');
const { generate } = require('@pdfme/generator');
const { DiplomaTemplate, CourseTemplate, Enrollment, Student, Course, AppConfig } = require('../models');

const TEMPLATES_DIR = path.resolve(__dirname, '../../uploads/templates');
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMPLATES_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Solo se aceptan PDFs'));
    cb(null, true);
  },
});

// GET /api/templates
const listTemplates = async (req, res) => {
  try {
    const templates = await DiplomaTemplate.findAll({
      include: [{ model: Course, as: 'Courses', attributes: ['id', 'name'], through: { attributes: [] } }],
      order: [['createdAt', 'DESC']],
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/templates
const createTemplate = [
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF provided' });
      const { name, scope = 'course' } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const template = await DiplomaTemplate.create({
        name,
        scope,
        pdfPath: req.file.filename,
        fields: [[]],
      });
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

// GET /api/templates/:id
const getTemplate = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id, {
      include: [{ model: Course, as: 'Courses', attributes: ['id', 'name'], through: { attributes: [] } }],
    });
    if (!template) return res.status(404).json({ error: 'Not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/templates/:id
const updateTemplate = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    const { name, scope, fields } = req.body;
    await template.update({
      ...(name !== undefined && { name }),
      ...(scope !== undefined && { scope }),
      ...(fields !== undefined && { fields }),
    });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/templates/:id
const deleteTemplate = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    // Remove PDF file
    if (template.pdfPath) {
      const fp = path.join(TEMPLATES_DIR, template.pdfPath);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await template.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/templates/:id/courses — assign courses
const assignCourses = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    const { courseIds = [] } = req.body;
    // Remove existing, then re-add
    await CourseTemplate.destroy({ where: { templateId: template.id } });
    for (const courseId of courseIds) {
      await CourseTemplate.create({ courseId, templateId: template.id });
    }
    res.json({ message: 'Courses assigned', courseIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/templates/:id/pdf
const getPdf = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(TEMPLATES_DIR, template.pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function getInputsForEnrollment(enrollment) {
  const student = enrollment.Student;
  const course = enrollment.Course;
  let academyName = '';
  try {
    const cfg = await AppConfig.findOne({ where: { key: 'academy_name' } });
    if (cfg) academyName = cfg.value;
  } catch (_) {}

  return {
    fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    dni: student.dni || '',
    email: student.email || '',
    phone: student.phone || '',
    address: student.address || '',
    birthDate: student.birthDate ? new Date(student.birthDate).toLocaleDateString('es-ES') : '',
    courseName: course?.name || '',
    courseSummary: course?.summary ? course.summary.replace(/<[^>]*>/g, '') : '',
    startDate: enrollment.startDate ? new Date(enrollment.startDate).toLocaleDateString('es-ES') : '',
    endDate: enrollment.endDate ? new Date(enrollment.endDate).toLocaleDateString('es-ES') : '',
    finishedAt: enrollment.finishedAt ? new Date(enrollment.finishedAt).toLocaleDateString('es-ES') : '',
    academyName,
  };
}

function resolveVariables(text, data) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\{firstName\}/g, data.firstName || '')
    .replace(/\{lastName\}/g, data.lastName || '')
    .replace(/\{fullName\}/g, data.fullName || '')
    .replace(/\{dni\}/g, data.dni || '')
    .replace(/\{email\}/g, data.email || '')
    .replace(/\{phone\}/g, data.phone || '')
    .replace(/\{address\}/g, data.address || '')
    .replace(/\{birthDate\}/g, data.birthDate || '')
    .replace(/\{courseName\}/g, data.courseName || '')
    .replace(/\{courseSummary\}/g, data.courseSummary || '')
    .replace(/\{startDate\}/g, data.startDate || '')
    .replace(/\{endDate\}/g, data.endDate || '')
    .replace(/\{finishedAt\}/g, data.finishedAt || '')
    .replace(/\{academyName\}/g, data.academyName || '');
}

function resolveSchemas(schemas, data) {
  return schemas.map(page =>
    page.map(field => ({
      ...field,
      content: resolveVariables(field.content, data),
    }))
  );
}

async function generatePDFBuffer(templateId, enrollmentId) {
  const template = await DiplomaTemplate.findByPk(templateId);
  if (!template) throw new Error('Template not found');
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [Student, { model: Course, attributes: ['id', 'name', 'summary'] }]
  });
  if (!enrollment) throw new Error('Enrollment not found');

  const filePath = path.join(TEMPLATES_DIR, template.pdfPath);
  if (!fs.existsSync(filePath)) throw new Error('Template PDF file not found');

  const inputs = await getInputsForEnrollment(enrollment);
  const schemas = template.fields || [[]];
  const resolvedSchemas = resolveSchemas(schemas, inputs);

  const pdfmeTemplate = {
    basePdf: fs.readFileSync(filePath),
    schemas: resolvedSchemas,
  };

  const pdfInputs = [inputs];
  const pdf = await generate({ template: pdfmeTemplate, inputs: pdfInputs });
  return { buffer: Buffer.from(pdf), enrollment, template };
}

// POST /api/templates/generate
const generateSingle = async (req, res) => {
  try {
    const { templateId, enrollmentId } = req.body;
    const { buffer, enrollment, template } = await generatePDFBuffer(templateId, enrollmentId);
    const filename = `diploma_${enrollment.Student?.lastName || 'alumno'}_${enrollment.Course?.name || 'curso'}.pdf`
      .replace(/[^a-z0-9_\-.]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/templates/generate-batch
const generateBatch = async (req, res) => {
  try {
    const { templateId, enrollmentIds = [] } = req.body;
    if (!enrollmentIds.length) return res.status(400).json({ error: 'No enrollmentIds provided' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="diplomas_batch.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    for (const enrollmentId of enrollmentIds) {
      try {
        const { buffer, enrollment } = await generatePDFBuffer(templateId, enrollmentId);
        const filename = `diploma_${enrollment.Student?.lastName || 'alumno'}_${enrollment.Student?.firstName || ''}.pdf`
          .replace(/[^a-z0-9_\-.]/gi, '_');
        archive.append(buffer, { name: filename });
      } catch (e) {
        console.error(`Error generating for enrollment ${enrollmentId}:`, e.message);
      }
    }

    await archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/courses/:courseId/templates — globales + asignadas al curso
const listCourseTemplates = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const globalTemplates = await DiplomaTemplate.findAll({ where: { scope: 'global' } });
    const assignedTemplates = await course.getTemplates();

    // Merge without duplicates
    const all = [...globalTemplates];
    for (const t of assignedTemplates) {
      if (!all.find(g => g.id === t.id)) all.push(t);
    }
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Legacy compat: POST /api/courses/:id/templates (upload template for course)
const uploadTemplateForCourse = [
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF provided' });
      const { name, scope = 'course' } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const template = await DiplomaTemplate.create({
        name,
        scope,
        pdfPath: req.file.filename,
        fields: [[]],
      });
      // Auto-assign to course
      if (scope === 'course') {
        await CourseTemplate.create({ courseId: req.params.id, templateId: template.id });
      }
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

module.exports = {
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  assignCourses,
  getPdf,
  generateSingle,
  generateBatch,
  listCourseTemplates,
  uploadTemplateForCourse,
};
