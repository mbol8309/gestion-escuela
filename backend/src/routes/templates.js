const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  assignCourses,
  getPdf,
  generateSingle,
  generateBatch,
} = require('../controllers/templateController');

// List all templates
router.get('/', auth, listTemplates);
// Create template (with PDF upload)
router.post('/', auth, requireRole('admin', 'gestor'), ...createTemplate);
// Generate single PDF — must be before /:id
router.post('/generate', auth, generateSingle);
// Generate batch ZIP — must be before /:id
router.post('/generate-batch', auth, generateBatch);
// Get single template
router.get('/:id', auth, getTemplate);
// Update template (name, scope, fields)
router.put('/:id', auth, requireRole('admin', 'gestor'), updateTemplate);
// Delete template
router.delete('/:id', auth, requireRole('admin', 'gestor'), deleteTemplate);
// Assign courses to template
router.post('/:id/courses', auth, requireRole('admin', 'gestor'), assignCourses);
// Serve PDF (no auth for iframe)
router.get('/:id/pdf', getPdf);

module.exports = router;
