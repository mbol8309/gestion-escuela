const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  logo: { type: DataTypes.STRING },
  createdBy: { type: DataTypes.UUID },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  summary: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = Course;
