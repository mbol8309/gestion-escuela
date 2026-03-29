const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.UUID, allowNull: false },
  editionId: { type: DataTypes.UUID, allowNull: true },
  courseId: { type: DataTypes.UUID, allowNull: true },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'enrolled', 'finished', 'rejected']] }
  },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  finishedAt: { type: DataTypes.DATE, allowNull: true },
  finishedBy: { type: DataTypes.UUID, allowNull: true },
  enrollmentFormSentAt: { type: DataTypes.DATE, allowNull: true },
  requestedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  resolvedAt: { type: DataTypes.DATE },
  resolvedBy: { type: DataTypes.UUID },
  notes: { type: DataTypes.TEXT },
  deletedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  paranoid: true,
});

module.exports = Enrollment;
