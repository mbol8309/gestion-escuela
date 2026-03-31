require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const { sequelize, User } = require('./src/models');
const logger = require('./src/config/logger');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :response-time ms', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/students', require('./src/routes/students'));
app.use('/api/enrollments', require('./src/routes/enrollments'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/config', require('./src/routes/config'));
app.use('/api/templates', require('./src/routes/templates'));
app.use('/api/logs', require('./src/routes/logs'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

async function seedAdmin() {
  const exists = await User.findOne({ where: { email: 'admin@admin.com' } });
  if (!exists) {
    const passwordHash = await bcrypt.hash('admin', 10);
    await User.create({ email: 'admin@admin.com', passwordHash, role: 'admin', active: true });
  }
}

async function start() {
  await sequelize.sync({ alter: false });
  await seedAdmin();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Solo arrancar si es el entry point directo
if (require.main === module) {
  start().catch(console.error);
}

module.exports = { app, sequelize, seedAdmin };
