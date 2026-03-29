#!/usr/bin/env node
/**
 * migrate-v3.js
 * - Ensures Students table has a 'status' column (SQLite: no ENUM, just STRING)
 * - Sets status='draft' for students without activationToken and without userId
 * - Students with pending enrollments → status='pending' (if not already set)
 */

require('dotenv').config();
const { sequelize } = require('../models');

async function run() {
  const q = sequelize.getQueryInterface();

  // 1. Check if 'status' column exists; add if missing
  try {
    const cols = await q.describeTable('Students');
    if (!cols.status) {
      console.log('Adding status column to Students...');
      await sequelize.query(`ALTER TABLE Students ADD COLUMN status TEXT DEFAULT 'draft'`);
      console.log('✅ status column added');
    } else {
      console.log('ℹ️  status column already exists');
    }
  } catch (err) {
    console.error('Error checking/adding status column:', err.message);
  }

  // 2. Students without activationToken AND without userId → draft
  try {
    const [result] = await sequelize.query(
      `UPDATE Students SET status='draft' WHERE (activationToken IS NULL OR activationToken='') AND (userId IS NULL OR userId='')`
    );
    console.log('✅ Set draft status for students without account/token');
  } catch (err) {
    console.error('Error setting draft status:', err.message);
  }

  // 3. Students with activationToken (sent but not activated) → pending
  try {
    await sequelize.query(
      `UPDATE Students SET status='pending' WHERE activationToken IS NOT NULL AND activationToken != '' AND (userId IS NULL OR userId='')`
    );
    console.log('✅ Set pending status for students with active token');
  } catch (err) {
    console.error('Error setting pending status:', err.message);
  }

  // 4. Students with userId (activated) → active
  try {
    await sequelize.query(
      `UPDATE Students SET status='active' WHERE userId IS NOT NULL AND userId != ''`
    );
    console.log('✅ Set active status for students with account');
  } catch (err) {
    console.error('Error setting active status:', err.message);
  }

  console.log('\n🎉 Migration v3 complete');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
