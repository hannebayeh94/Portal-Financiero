const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { seedDefaultCategories } = require('../utils/defaultCategories');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

const JWT_SIGN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'portal-financiero',
  audience: 'portal-financiero-app',
  expiresIn: ACCESS_TOKEN_TTL,
};

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    JWT_SIGN_OPTIONS
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

async function issueRefreshToken(userId) {
  const token = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  });
  return token;
}

// Protege login/register contra fuerza bruta y enumeración por IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
});

const emailField = body('email')
  .trim()
  .isEmail()
  .withMessage('Ingresa un email válido')
  .normalizeEmail({ gmail_remove_dots: false });

const passwordField = body('password')
  .isString()
  .isLength({ min: 8, max: 72 })
  .withMessage('La contraseña debe tener al menos 8 caracteres');

router.post('/register', authLimiter, [
  emailField,
  passwordField,
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Ingresa tu nombre'),
  validate,
], async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db('users')
      .insert({ email, password: hashedPassword, name })
      .returning(['id', 'email', 'name', 'role']);

    // Crea las categorías base para el nuevo usuario
    try { await seedDefaultCategories(db, user.id); } catch (e) { /* no bloquear el registro */ }

    const token = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);

    res.status(201).json({ user, token, refreshToken });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', authLimiter, [
  emailField,
  passwordField,
  validate,
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Renueva el access token y rota el refresh token.
router.post('/refresh', [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken es requerido'),
  validate,
], async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokenHash = hashToken(refreshToken);

    const stored = await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .first();

    if (!stored || stored.revoked_at) {
      return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión' });
    }
    if (new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión' });
    }

    const user = await db('users')
      .select('id', 'email', 'name', 'role')
      .where({ id: stored.user_id })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión' });
    }

    await db.transaction(async (trx) => {
      // Rotación: revoca el refresh token usado y emite uno nuevo.
      await trx('refresh_tokens').where({ id: stored.id }).update({ revoked_at: db.fn.now() });
    });

    const token = signAccessToken(user);
    const newRefreshToken = await issueRefreshToken(user.id);

    res.json({ user, token, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Error al renovar sesión' });
  }
});

// Revoca el refresh token (logout con invalidación real).
router.post('/logout', [
  body('refreshToken').isString().notEmpty().withMessage('refreshToken es requerido'),
  validate,
], async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokenHash = hashToken(refreshToken);

    await db('refresh_tokens')
      .where({ token_hash: tokenHash, revoked_at: null })
      .update({ revoked_at: db.fn.now() });

    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db('users')
      .select('id', 'email', 'name', 'role')
      .where({ id: req.user.id })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

module.exports = router;
