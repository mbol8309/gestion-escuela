const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const DiplomaTemplate = require('./DiplomaTemplate');
const Diploma = require('./Diploma');
const AppConfig = require('./AppConfig');
const ActivityLog = require('./ActivityLog');

// Associations
User.hasOne(Student, { foreignKey: 'userId' });
Student.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

Student.hasMany(Enrollment, { foreignKey: 'studentId' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId' });

Enrollment.hasOne(Diploma, { foreignKey: 'enrollmentId' });
Diploma.belongsTo(Enrollment, { foreignKey: 'enrollmentId' });

Course.hasMany(DiplomaTemplate, { foreignKey: 'courseId' });
DiplomaTemplate.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = {
  sequelize,
  User,
  Student,
  Course,
  Enrollment,
  DiplomaTemplate,
  Diploma,
  AppConfig,
  ActivityLog,
};
