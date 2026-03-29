const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['passwordHash'] } });
    res.json(users);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { email, password, firstName, lastName, role = 'gestor' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role, firstName, lastName, active: true });
    res.status(201).json({ id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    if (err.name === 'SequelizeUniqueConstraintError' || (err.message && err.message.includes('UNIQUE'))) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'No se puede editar un administrador' });
    const { password, email, firstName, lastName } = req.body;
    const updates = {};
    if (email) updates.email = email;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);
    await user.update(updates);
    res.json({ id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'No se puede eliminar un administrador' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
