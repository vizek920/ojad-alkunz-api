require('dotenv').config();

/**
 * Admin authentication middleware
 * Expects: Authorization: Bearer <password>
 * or: x-admin-password: <password>
 */
const requireAdmin = (req, res, next) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'kanz2024';

  // Support both header formats
  let provided = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    provided = authHeader.slice(7);
  }

  if (!provided) {
    provided = req.headers['x-admin-password'];
  }

  if (!provided || provided !== adminPassword) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'كلمة المرور غير صحيحة'
    });
  }

  next();
};

module.exports = { requireAdmin };
