const router = require('express').Router();
const { ActivityLog } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/logs — admin only, paginated, optional filters by entityType and entityId
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 50 } = req.query;
    const limitN = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (Math.max(1, parseInt(page)) - 1) * limitN;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = String(entityId);

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitN,
      offset,
    });

    res.json({ total: count, page: parseInt(page), limit: limitN, data: rows });
  } catch (err) {
    console.error('[GET /logs]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
