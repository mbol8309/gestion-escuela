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

module.exports = router;
