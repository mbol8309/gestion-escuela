const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseEdition = sequelize.define('CourseEdition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  courseId: { type: DataTypes.UUID, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  startDate: { type: DataTypes.DATE },
  endDate: { type: DataTypes.DATE },
  status: {
    type: DataTypes.ENUM('active', 'finished', 'cancelled'),
    defaultValue: 'active',
  },
});

module.exports = CourseEdition;
