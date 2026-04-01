const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  previewTemplate,
  getPdf,
  updateFields,
  generatePDF,
} = require('../controllers/templateController');

// GET /api/templates/:id/preview
router.get('/:id/preview', auth, previewTemplate);
// GET /api/templates/:id/pdf (iframe src — sin auth para poder usarlo en iframes)
router.get('/:id/pdf', getPdf);
// PUT /api/templates/:id/fields
router.put('/:id/fields', auth, requireRole('admin', 'gestor'), updateFields);
// GET /api/templates/:id/generate/:enrollmentId
router.get('/:id/generate/:enrollmentId', auth, generatePDF);

module.exports = router;
