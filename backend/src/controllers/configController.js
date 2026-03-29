const { AppConfig } = require('../models');

// GET /api/config — returns all keys as { key: value }
const getConfig = async (req, res) => {
  try {
    const rows = await AppConfig.findAll();
    const result = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/config — body: { key: value, ... } — admin only
const updateConfig = async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Body must be an object { key: value }' });
    }
    for (const [key, value] of Object.entries(updates)) {
      await AppConfig.upsert({ key, value: String(value) });
    }
    const rows = await AppConfig.findAll();
    const result = {};
    for (const row of rows) result[row.key] = row.value;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getConfig, updateConfig };
