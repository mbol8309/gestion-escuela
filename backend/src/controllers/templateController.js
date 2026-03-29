const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { DiplomaTemplate, Enrollment, Student, Course } = require('../models');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const TEMPLATES_DIR = path.resolve(__dirname, '../../uploads/templates');
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMPLATES_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Solo se aceptan PDFs'));
  cb(null, true);
}});

// POST /api/courses/:id/templates
const uploadTemplate = [
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF provided' });
      const { name, type = 'diploma' } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });

      const template = await DiplomaTemplate.create({
        courseId: req.params.id,
        name,
        type,
        pdfPath: req.file.filename,
        fields: [],
      });
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

// GET /api/courses/:id/templates
const listTemplates = async (req, res) => {
  try {
    const templates = await DiplomaTemplate.findAll({
      where: { courseId: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/templates/:id/preview — serve PDF directly (iframe-compatible)
const previewTemplate = async (req, res) => {
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

// GET /api/templates/:id/pdf — alias for preview (used by iframe src)
const getPdf = previewTemplate;

// PUT /api/templates/:id/fields — save field config
const updateFields = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    const fields = req.body;
    if (!Array.isArray(fields)) return res.status(400).json({ error: 'fields must be an array' });
    await template.update({ fields });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/templates/:id/generate/:enrollmentId — generate PDF
const generatePDF = async (req, res) => {
  try {
    const template = await DiplomaTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const enrollment = await Enrollment.findByPk(req.params.enrollmentId, {
      include: [Student, Course],
    });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const filePath = path.join(TEMPLATES_DIR, template.pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Template PDF file not found' });

    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const student = enrollment.Student;
    const course = enrollment.Course;

    const getFieldValue = (field) => {
      switch (field) {
        case 'firstName': return student?.firstName || '';
        case 'lastName': return student?.lastName || '';
        case 'fullName': return `${student?.firstName || ''} ${student?.lastName || ''}`.trim();
        case 'dni': return student?.dni || '';
        case 'email': return student?.email || '';
        case 'phone': return student?.phone || '';
        case 'address': return student?.address || '';
        case 'birthDate': return student?.birthDate ? new Date(student.birthDate).toLocaleDateString('es-ES') : '';
        case 'courseName': return course?.name || '';
        case 'startDate': return enrollment.startDate ? new Date(enrollment.startDate).toLocaleDateString('es-ES') : '';
        case 'endDate': return enrollment.endDate ? new Date(enrollment.endDate).toLocaleDateString('es-ES') : '';
        case 'finishedAt': return enrollment.finishedAt ? new Date(enrollment.finishedAt).toLocaleDateString('es-ES') : '';
        default: return '';
      }
    };

    const fields = Array.isArray(template.fields) ? template.fields : [];
    for (const field of fields) {
      const value = getFieldValue(field.field);
      if (!value) continue;
      const colorHex = field.color || '#000000';
      const r = parseInt(colorHex.slice(1, 3), 16) / 255;
      const g = parseInt(colorHex.slice(3, 5), 16) / 255;
      const b = parseInt(colorHex.slice(5, 7), 16) / 255;
      page.drawText(value, {
        x: field.x,
        y: height - field.y,
        size: field.fontSize || 12,
        font,
        color: rgb(r, g, b),
      });
    }

    const outBytes = await pdfDoc.save();
    const filename = `diploma_${student?.lastName || 'alumno'}_${course?.name || 'curso'}.pdf`
      .replace(/[^a-z0-9_\-.]/gi, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(outBytes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadTemplate, listTemplates, previewTemplate, getPdf, updateFields, generatePDF };
