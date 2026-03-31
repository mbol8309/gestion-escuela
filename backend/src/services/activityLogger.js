'use strict';

const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity event.
 * @param {string} action - e.g. 'student.created', 'activation.sent', 'enrollment.finished', 'diploma.generated'
 * @param {string} entityType - 'student' | 'enrollment' | 'course' | 'diploma'
 * @param {number|string} entityId
 * @param {number|string|null} userId - who performed the action
 * @param {object} details - extra context (JSON-serializable)
 */
async function logActivity(action, entityType, entityId, userId = null, details = {}) {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId: String(entityId),
      userId: userId ? String(userId) : null,
      details: JSON.stringify(details),
    });
  } catch (err) {
    // Never crash the main request because of a logging failure
    console.error('[activityLogger] Failed to write log:', err.message);
  }
}

module.exports = { logActivity };
