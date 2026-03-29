const router = require('express').Router();
const { Course, CourseEdition, Enrollment, DiplomaTemplate } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const { uploadTemplate, listTemplates } = require('../controllers/templateController');

router.get('/', auth, async (req, res) => {
  const { search, active } = req.query;
  const where = {};
  if (search) where.name = { [Op.like]: `%${search}%` };
  if (active !== undefined) where.active = active === 'true';
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
  const course = await Course.findByPk(req.params.id, {
    include: [{
      model: CourseEdition,
      include: [{ model: Enrollment, attributes: ['id'] }],
    }],
  });
  if (!course) return res.status(404).json({ error: 'Not found' });
  res.json(course);
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
