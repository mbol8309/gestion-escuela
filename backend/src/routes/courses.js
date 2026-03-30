const router = require('express').Router();
const { Course, Enrollment, DiplomaTemplate, Student } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const { uploadTemplate, listTemplates } = require('../controllers/templateController');

router.get('/', auth, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (Math.max(1, parseInt(page)) - 1) * limitN;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    const { count, rows } = await Course.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit: limitN, offset });
    res.json({ total: count, page: parseInt(page), limit: limitN, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Curso básico + plantillas (rápido)
    const course = await Course.findByPk(req.params.id, {
      include: [{ model: DiplomaTemplate, attributes: ['id', 'name', 'type'] }],
    });
    if (!course) return res.status(404).json({ error: 'Not found' });

    // Enrollments paginados (separado para evitar timeout)
    const enrollmentWhere = { courseId: req.params.id };
    if (status) enrollmentWhere.status = status;
    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: enrollmentWhere,
      include: [{ model: Student, attributes: ['id', 'firstName', 'lastName', 'email', 'dni'] }],
      limit: parseInt(limit),
      offset,
      order: [['startDate', 'DESC']],
    });

    res.json({ ...course.toJSON(), Enrollments: enrollments, enrollmentTotal: count, page: parseInt(page) });
  } catch (err) {
    console.error('[GET /courses/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, requireRole('admin', 'gestor'), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ error: 'Not found' });
  await course.update(req.body);
  res.json(course);
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ error: 'Not found' });
  await course.destroy();
  res.json({ message: 'Deleted' });
});

// Templates
router.post('/:id/templates', auth, requireRole('admin', 'gestor'), ...uploadTemplate);
router.get('/:id/templates', auth, listTemplates);

module.exports = router;
