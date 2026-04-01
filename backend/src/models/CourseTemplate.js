const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseTemplate = sequelize.define('CourseTemplate', {
  courseId: { type: DataTypes.UUID, allowNull: false },
  templateId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: false });

module.exports = CourseTemplate;
