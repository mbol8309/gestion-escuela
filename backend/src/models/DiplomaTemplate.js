const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiplomaTemplate = sequelize.define('DiplomaTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  courseId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  pdfPath: { type: DataTypes.STRING },
  fields: { type: DataTypes.JSON },
});

module.exports = DiplomaTemplate;
