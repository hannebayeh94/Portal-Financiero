const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_VERIFY_OPTIONS = {
  algorithms: ['HS256'],
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_VERIFY_OPTIONS);

    // Cierra la brecha de tokens vigentes tras eliminar al usuario.
    const user = await db('users').select('id').where({ id: decoded.id }).first();
    if (!user) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };
