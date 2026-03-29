const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diploma = sequelize.define('Diploma', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  enrollmentId: { type: DataTypes.UUID, allowNull: false },
  templateId: { type: DataTypes.UUID, allowNull: false },
  pdfPath: { type: DataTypes.STRING },
  sentAt: { type: DataTypes.DATE },
  registrationNumber: { type: DataTypes.STRING },
});

module.exports = Diploma;
