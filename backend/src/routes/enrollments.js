const router = require('express').Router();
const { Enrollment, Student, Course } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const { logActivity } = require('../services/activityLogger');

router.get('/', auth, async (req, res) => {
  try {
    const { status, courseId, startDateFrom, startDateTo, page = 1, limit = 10 } = req.query;
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (Math.max(1, parseInt(page)) - 1) * limitN;
    const where = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;
    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) where.startDate[Op.gte] = new Date(startDateFrom);
      if (startDateTo) where.startDate[Op.lte] = new Date(startDateTo);
    }

    if (req.user.role === 'alumno') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (student) where.studentId = student.id;
    }

    const { count, rows } = await Enrollment.findAndCountAll({
      where,
      include: [
        { model: Student, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Course, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitN,
      offset,
    });
    res.json({ total: count, page: parseInt(page), limit: limitN, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'studentId y courseId son requeridos' });
    }
    // Validar duplicado
    const existing = await Enrollment.findOne({ where: { studentId, courseId } });
    if (existing) {
      return res.status(409).json({ error: 'El alumno ya está inscrito en este curso' });
    }
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'pending',
      requestedAt: new Date(),
    });
    res.status(201).json(enrollment);
  } catch (err) {
    console.error('[POST /enrollments]', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/finish', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Not found' });
    if (enrollment.status === 'finished') {
      return res.status(400).json({ error: 'Ya está marcado como terminado' });
    }
    await enrollment.update({
      status: 'finished',
      finishedAt: new Date(),
      finishedBy: req.user.id,
    });
    await logActivity('enrollment.finished', 'enrollment', enrollment.id, req.user.id, { studentId: enrollment.studentId, courseId: enrollment.courseId });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Not found' });
    await enrollment.destroy(); // soft delete
    res.json({ message: 'Enrollment removed' });
  } catch (err) {
    console.error('[DELETE /enrollments/' + req.params.id + ']', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrollments/batch — batch actions
router.post('/batch', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { enrollmentIds = [], action, templateId } = req.body;
    if (!enrollmentIds.length) return res.status(400).json({ error: 'No enrollmentIds' });

    if (action === 'finish') {
      for (const id of enrollmentIds) {
        const enrollment = await Enrollment.findByPk(id);
        if (enrollment && enrollment.status !== 'finished') {
          await enrollment.update({ status: 'finished', finishedAt: new Date(), finishedBy: req.user.id });
        }
      }
      return res.json({ message: `${enrollmentIds.length} enrollments finished` });
    }

    if (action === 'generate-diplomas') {
      if (!templateId) return res.status(400).json({ error: 'templateId required for generate-diplomas' });
      // Delegate to generate-batch — redirect to template controller
      const archiver = require('archiver');
      const { generate } = require('@pdfme/generator');
      const { DiplomaTemplate, Student: StudentModel } = require('../models');
      const path = require('path');
      const fs = require('fs');
      const TEMPLATES_DIR = path.resolve(__dirname, '../../../uploads/templates');

      const template = await DiplomaTemplate.findByPk(templateId);
      if (!template) return res.status(404).json({ error: 'Template not found' });

      const filePath = path.join(TEMPLATES_DIR, template.pdfPath);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file not found' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="diplomas.zip"');

      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.pipe(res);

      for (const enrollmentId of enrollmentIds) {
        try {
          const enrollment = await Enrollment.findByPk(enrollmentId, { include: [StudentModel, Course] });
          if (!enrollment) continue;
          const pdfmeTemplate = {
            basePdf: fs.readFileSync(filePath),
            schemas: template.fields || [[]],
          };
          const student = enrollment.Student;
          const course = enrollment.Course;
          const inputs = [{
            fullName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
            firstName: student?.firstName || '',
            lastName: student?.lastName || '',
            dni: student?.dni || '',
            email: student?.email || '',
            phone: student?.phone || '',
            courseName: course?.name || '',
            startDate: enrollment.startDate ? new Date(enrollment.startDate).toLocaleDateString('es-ES') : '',
            endDate: enrollment.endDate ? new Date(enrollment.endDate).toLocaleDateString('es-ES') : '',
            finishedAt: enrollment.finishedAt ? new Date(enrollment.finishedAt).toLocaleDateString('es-ES') : '',
            academyName: '',
          }];
          const pdf = await generate({ template: pdfmeTemplate, inputs });
          const fname = `diploma_${student?.lastName || 'alumno'}_${student?.firstName || ''}.pdf`.replace(/[^a-z0-9_\-.]/gi, '_');
          archive.append(Buffer.from(pdf), { name: fname });
        } catch (e) {
          console.error(`Batch error for ${enrollmentId}:`, e.message);
        }
      }
      return archive.finalize();
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
