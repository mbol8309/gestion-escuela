const router = require('express').Router();
const { Course, Enrollment, DiplomaTemplate, Student } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const { uploadTemplate, listTemplates } = require('../controllers/templateController');

router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search) where.name = { [Op.like]: `%${search}%` };
  const courses = await Course.findAll({ where, order: [['createdAt', 'DESC']] });
  res.json(courses);
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
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: Enrollment, attributes: ['id', 'status', 'startDate', 'endDate', 'finishedAt'], include: [{ model: Student, attributes: ['id', 'firstName', 'lastName', 'email'] }] },
        { model: DiplomaTemplate, attributes: ['id', 'name', 'type'] },
      ],
    });
    if (!course) return res.status(404).json({ error: 'Not found' });
    res.json(course);
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
