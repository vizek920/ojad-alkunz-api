const express = require('express');
const router = express.Router();
require('dotenv').config();

// POST /api/auth/login — verify admin password
router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'kanz2024';

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== adminPassword) {
    return res.status(401).json({
      success: false,
      message: 'كلمة المرور غير صحيحة'
    });
  }

  res.json({
    success: true,
    token: adminPassword, // Simple token = the password itself
    message: 'تم تسجيل الدخول بنجاح'
  });
});

// GET /api/auth/verify — verify token is still valid
router.get('/verify', (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'kanz2024';
  const token =
    (req.headers['authorization'] || '').replace('Bearer ', '') ||
    req.headers['x-admin-password'];

  if (token === adminPassword) {
    return res.json({ valid: true });
  }
  res.status(401).json({ valid: false });
});

module.exports = router;
