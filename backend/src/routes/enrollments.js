const router = require('express').Router();
const { Enrollment, Student, CourseEdition, Course } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', auth, async (req, res) => {
  try {
    const { status, editionId, courseId, startDateFrom, startDateTo } = req.query;
    const where = {};
    if (status) where.status = status;
    if (editionId) where.editionId = editionId;
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

    const enrollments = await Enrollment.findAll({
      where,
      include: [
        { model: Student, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Course, attributes: ['id', 'name'] },
        {
          model: CourseEdition,
          required: false,
          include: [{ model: Course, attributes: ['id', 'name'] }],
        },
      ],
      order: [['requestedAt', 'DESC']],
    });
    res.json(enrollments);
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

router.put('/:id/status', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Not found' });
    const { status, notes } = req.body;
    await enrollment.update({ status, notes, resolvedAt: new Date(), resolvedBy: req.user.id });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
