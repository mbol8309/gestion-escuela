const router = require('express').Router();
const { Enrollment, Student, CourseEdition, Course } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { status, editionId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (editionId) where.editionId = editionId;

  // Alumnos solo ven sus inscripciones
  if (req.user.role === 'alumno') {
    const { Student: S } = require('../models');
    const student = await S.findOne({ where: { userId: req.user.id } });
    if (student) where.studentId = student.id;
  }

  const enrollments = await Enrollment.findAll({
    where,
    include: [
      { model: Student, attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: CourseEdition,
        include: [{ model: Course, attributes: ['id', 'name'] }],
      },
    ],
    order: [['requestedAt', 'DESC']],
  });
  res.json(enrollments);
});

router.post('/', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.create(req.body);
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/status', auth, requireRole('admin', 'gestor'), async (req, res) => {
  const enrollment = await Enrollment.findByPk(req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Not found' });
  const { status, notes } = req.body;
  await enrollment.update({
    status,
    notes,
    resolvedAt: new Date(),
    resolvedBy: req.user.id,
  });
  res.json(enrollment);
});

module.exports = router;
