const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Student, User, Enrollment, Course, AppConfig, sequelize } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const { sendActivationEmail } = require('../services/emailService');

const getTTL = async () => {
  try {
    const cfg = await AppConfig.findOne({ where: { key: 'activation_token_ttl_hours' } });
    return cfg ? parseInt(cfg.value) || 48 : 48;
  } catch {
    return 48;
  }
};

router.get('/', auth, requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status, courseId, enrollmentStatus, startDateFrom, startDateTo } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const options = { where, limit: parseInt(limit), offset, order: [['lastName', 'ASC']] };

    if (courseId || enrollmentStatus || startDateFrom || startDateTo) {
      const enrollmentWhere = {};
      if (courseId) enrollmentWhere.courseId = courseId;
      if (enrollmentStatus) enrollmentWhere.status = enrollmentStatus;
      if (startDateFrom || startDateTo) {
        enrollmentWhere.startDate = {};
        if (startDateFrom) enrollmentWhere.startDate[Op.gte] = new Date(startDateFrom);
        if (startDateTo) enrollmentWhere.startDate[Op.lte] = new Date(startDateTo);
      }
      options.include = [{ model: Enrollment, where: enrollmentWhere, required: true, include: [Course] }];
    }
    // Sin filtros de enrollment, NO incluir enrollments en la lista (muy lento con 10k+ registros)
    // Los enrollments se cargan solo en GET /api/students/:id

    const { count, rows } = await Student.findAndCountAll(options);
    res.json({ total: count, page: parseInt(page), limit: parseInt(limit), data: rows });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, requireRole('admin', 'gestor'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { enrollments, ...studentData } = req.body;
    const student = await Student.create(studentData, { transaction: t });

    if (Array.isArray(enrollments) && enrollments.length > 0) {
      for (const enr of enrollments) {
        if (!enr.courseId) continue;
        await Enrollment.create({
          studentId: student.id,
          courseId: enr.courseId,
          startDate: enr.startDate || null,
          endDate: enr.endDate || null,
          status: 'pending',
        }, { transaction: t });
      }
    }

    await t.commit();
    const full = await Student.findByPk(student.id, {
      include: [{ model: Enrollment, include: [Course] }],
    });
    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    if (err.name === 'SequelizeUniqueConstraintError' || (err.message && err.message.includes('UNIQUE'))) {
      return res.status(409).json({ error: 'Ya existe un alumno con ese email' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { enrollPage = 1, enrollLimit = 20 } = req.query;
    const limitN = Math.min(100, Math.max(1, parseInt(enrollLimit)));
    const offset = (Math.max(1, parseInt(enrollPage)) - 1) * limitN;

    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: { studentId: req.params.id },
      include: [Course],
      limit: limitN,
      offset,
      order: [['startDate', 'DESC']],
    });

    res.json({ ...student.toJSON(), Enrollments: enrollments, enrollmentTotal: count, enrollPage: parseInt(enrollPage) });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    await student.update(req.body);
    res.json(student);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    // Soft delete enrollments (paranoid)
    await Enrollment.destroy({ where: { studentId: req.params.id } });
    // Deactivate user but don't hard delete it
    if (student.userId) await User.update({ active: false }, { where: { id: student.userId } });
    // Soft delete student (paranoid)
    await student.destroy();
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error('[DELETE /students/' + req.params.id + ']', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/send-activation', auth, requireRole('admin', 'gestor'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const student = await Student.findByPk(req.params.id, { transaction: t });
    if (!student) { await t.rollback(); return res.status(404).json({ error: 'Not found' }); }

    // Create enrollments if passed
    const { enrollments } = req.body;
    if (Array.isArray(enrollments) && enrollments.length > 0) {
      for (const enr of enrollments) {
        if (!enr.courseId) continue;
        await Enrollment.create({
          studentId: student.id,
          courseId: enr.courseId,
          startDate: enr.startDate || null,
          endDate: enr.endDate || null,
          status: 'pending',
        }, { transaction: t });
      }
    }

    const ttlHours = await getTTL();
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await student.update({ activationToken: token, activationTokenExpiry: expiry, status: 'pending' }, { transaction: t });
    await t.commit();

    try {
      const [academyCfg, baseUrlCfg, fromNameCfg, fromAddrCfg] = await Promise.all([
        AppConfig.findOne({ where: { key: 'academy_name' } }),
        AppConfig.findOne({ where: { key: 'base_url' } }),
        AppConfig.findOne({ where: { key: 'email_from_name' } }),
        AppConfig.findOne({ where: { key: 'email_from_address' } }),
      ]);
      const baseUrl = baseUrlCfg?.value || process.env.FRONTEND_URL;
      const activationUrlFinal = `${baseUrl}/activate/${token}`;
      await sendActivationEmail({
        to: student.email,
        firstName: student.firstName,
        activationUrl: activationUrlFinal,
        ttlHours,
        academyName: academyCfg?.value || 'Academia',
        fromName: fromNameCfg?.value || academyCfg?.value || 'Academia',
        fromAddress: fromAddrCfg?.value || 'noreply@miguesync.es',
      });
      res.json({ message: 'Activation email sent' });
    } catch (err) {
      res.status(500).json({ error: 'Email error: ' + err.message });
    }
  } catch (err) {
    await t.rollback();
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Public route — activate with token
router.put('/activate/:token', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        activationToken: req.params.token,
        activationTokenExpiry: { [Op.gt]: new Date() },
      },
      include: [{ model: Enrollment }],
    });
    if (!student) return res.status(400).json({ error: 'Invalid or expired token' });

    const { password, firstName, lastName, dni, phone, address, birthDate } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    // Solo permitir campos seguros del alumno
    const profileData = {};
    if (firstName) profileData.firstName = firstName;
    if (lastName) profileData.lastName = lastName;
    if (dni) profileData.dni = dni;
    if (phone !== undefined) profileData.phone = phone;
    if (address !== undefined) profileData.address = address;
    if (birthDate) {
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) profileData.birthDate = d;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Buscar user existente por userId o por email (por si fue recreado)
    let user = student.userId ? await User.findByPk(student.userId) : null;
    if (!user) user = await User.findOne({ where: { email: student.email } });
    if (!user) {
      user = await User.create({
        email: student.email,
        passwordHash,
        role: 'alumno',
        studentId: student.id,
        active: true,
      });
    } else {
      await user.update({ passwordHash, active: true, studentId: student.id });
    }

    await Enrollment.update(
      { status: 'enrolled' },
      { where: { studentId: student.id, status: 'pending' } }
    );

    await student.update({
      ...profileData,
      userId: user.id,
      status: 'active',
      activationToken: null,
      activationTokenExpiry: null,
    });

    res.json({ message: 'Account activated successfully' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get student data from token (for pre-fill form)
router.get('/activate/:token', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        activationToken: req.params.token,
        activationTokenExpiry: { [Op.gt]: new Date() },
      },
      include: [{
        model: Enrollment,
        include: [Course],
      }],
    });
    if (!student) return res.status(400).json({ error: 'Invalid or expired token' });

    res.json({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      dni: student.dni,
      phone: student.phone,
      address: student.address,
      birthDate: student.birthDate,
      Enrollments: student.Enrollments,
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
