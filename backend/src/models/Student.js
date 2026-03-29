const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  dni: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  birthDate: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'draft' },
  activationToken: { type: DataTypes.STRING },
  activationTokenExpiry: { type: DataTypes.DATE },
  userId: { type: DataTypes.UUID, allowNull: true },
  deletedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  paranoid: true,
});

module.exports = Student;
