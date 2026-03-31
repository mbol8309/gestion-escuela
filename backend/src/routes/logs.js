const router = require('express').Router();
const { ActivityLog } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(process.cwd(), 'logs');

// GET /api/logs — activity logs from DB (admin only, paginated)
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

// GET /api/logs/files — list log files (admin only)
router.get('/files', auth, requireRole('admin'), (req, res) => {
  try {
    if (!fs.existsSync(logsDir)) return res.json({ data: [] });
    const files = fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const stat = fs.statSync(path.join(logsDir, f));
        return { name: f, size: stat.size, modifiedAt: stat.mtime };
      })
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    res.json({ data: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/files/:filename — read a log file (admin only, paginated by lines)
router.get('/files/:filename', auth, requireRole('admin'), (req, res) => {
  try {
    const { filename } = req.params;
    // Seguridad: solo nombre de fichero, sin path traversal
    if (filename.includes('/') || filename.includes('..') || !filename.endsWith('.log')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(logsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const { page = 1, limit = 200, search = '' } = req.query;
    const limitN = Math.min(500, Math.max(1, parseInt(limit)));
    const pageN = Math.max(1, parseInt(page));

    const content = fs.readFileSync(filePath, 'utf-8');
    let lines = content.split('\n').filter(l => l.trim());

    if (search) {
      lines = lines.filter(l => l.toLowerCase().includes(search.toLowerCase()));
    }

    // Orden desc (más recientes primero)
    lines.reverse();

    const total = lines.length;
    const offset = (pageN - 1) * limitN;
    const data = lines.slice(offset, offset + limitN);

    res.json({ total, page: pageN, limit: limitN, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
