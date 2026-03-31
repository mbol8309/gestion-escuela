#!/usr/bin/env node
/**
 * migrate-logs.js
 * Creates the ActivityLogs table if it doesn't exist.
 */

require('dotenv').config();
const { sequelize } = require('../models');

async function run() {
  try {
    const cols = await sequelize.getQueryInterface().describeTable('ActivityLogs').catch(() => null);
    if (cols) {
      console.log('ℹ️  ActivityLogs table already exists');
    } else {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS ActivityLogs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL,
          entityType TEXT NOT NULL,
          entityId TEXT,
          userId TEXT,
          details TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ ActivityLogs table created');
    }
  } catch (err) {
    console.error('Error creating ActivityLogs table:', err.message);
    process.exit(1);
  }

  console.log('\n🎉 Migration logs complete');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
