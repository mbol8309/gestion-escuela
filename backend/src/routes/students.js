const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Student, User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

router.get('/', auth, requireRole('admin', 'gestor'), async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { dni: { [Op.like]: `%${search}%` } },
    ];
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await Student.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['lastName', 'ASC']],
  });
  res.json({ total: count, page: parseInt(page), data: rows });
});

router.post('/', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json(student);
});

router.put('/:id', auth, async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });
  await student.update(req.body);
  res.json(student);
});

router.post('/:id/send-activation', auth, requireRole('admin', 'gestor'), async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ error: 'Not found' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
  await student.update({ activationToken: token, activationTokenExpiry: expiry });

  const activationUrl = `${process.env.FRONTEND_URL}/activate/${token}`;
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to: student.email,
      subject: 'Activa tu cuenta',
      html: `<p>Hola ${student.firstName},</p><p>Activa tu cuenta: <a href="${activationUrl}">${activationUrl}</a></p><p>Expira en 48 horas.</p>`,
    });
    res.json({ message: 'Activation email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Email error: ' + err.message, activationUrl });
  }
});

router.put('/activate/:token', async (req, res) => {
  const student = await Student.findOne({
    where: {
      activationToken: req.params.token,
      activationTokenExpiry: { [Op.gt]: new Date() },
    },
  });
  if (!student) return res.status(400).json({ error: 'Invalid or expired token' });

  const { password, ...profileData } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: student.email,
    passwordHash,
    role: 'alumno',
    studentId: student.id,
  });

  await student.update({
    ...profileData,
    userId: user.id,
    activationToken: null,
    activationTokenExpiry: null,
  });

  res.json({ message: 'Account activated successfully' });
});

module.exports = router;
