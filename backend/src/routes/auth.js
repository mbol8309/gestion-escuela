const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, studentId: user.studentId },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
    await user.update({ passwordHash: await bcrypt.hash(newPassword, 10) });
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
