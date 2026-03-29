const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { getConfig, updateConfig } = require('../controllers/configController');

router.get('/', auth, getConfig);
router.put('/', auth, requireRole('admin'), updateConfig);

module.exports = router;
