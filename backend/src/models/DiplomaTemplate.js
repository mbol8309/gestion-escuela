const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiplomaTemplate = sequelize.define('DiplomaTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  courseId: { type: DataTypes.UUID, allowNull: true }, // null if type=enrollment_form (global)
  name: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.ENUM('diploma', 'enrollment_form'),
    defaultValue: 'diploma',
  },
  pdfPath: { type: DataTypes.STRING },
  fields: { type: DataTypes.JSON },
});

module.exports = DiplomaTemplate;
