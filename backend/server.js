require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const { sequelize, User } = require('./src/models');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use(morgan('[:date[iso]] :method :url :status :response-time ms'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/students', require('./src/routes/students'));
app.use('/api/enrollments', require('./src/routes/enrollments'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/config', require('./src/routes/config'));
app.use('/api/templates', require('./src/routes/templates'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

async function start() {
  await sequelize.sync({ alter: false });

  // Seed admin
  const exists = await User.findOne({ where: { email: 'admin@admin.com' } });
  if (!exists) {
    const passwordHash = await bcrypt.hash('admin', 10);
    await User.create({ email: 'admin@admin.com', passwordHash, role: 'admin', active: true });
    console.log('✅ Admin user created: admin@admin.com / admin');
  }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

start().catch(console.error);
