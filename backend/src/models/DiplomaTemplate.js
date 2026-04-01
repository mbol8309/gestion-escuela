const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiplomaTemplate = sequelize.define('DiplomaTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  scope: {
    type: DataTypes.STRING(10),
    defaultValue: 'course',
    validate: { isIn: [['global', 'course']] },
  },
  pdfPath: { type: DataTypes.STRING },
  fields: { type: DataTypes.JSON },
});

module.exports = DiplomaTemplate;
