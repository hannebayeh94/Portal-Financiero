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
const { sendPasswordResetCode } = require('../utils/mailer');

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

// Recuperación de contraseña: código de 6 dígitos, vigencia corta y pocos intentos.
const RESET_CODE_TTL_MS = (parseInt(process.env.RESET_CODE_TTL_MINUTES, 10) || 15) * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const generateResetCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

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

// Cambiar contraseña estando autenticado. Revoca todas las sesiones y emite un
// par nuevo de tokens para que el dispositivo actual siga conectado.
router.post('/change-password', authenticateToken, [
  body('currentPassword').isString().notEmpty().withMessage('Ingresa tu contraseña actual'),
  body('newPassword').isString().isLength({ min: 8, max: 72 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  validate,
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: user.id }).update({ password: hashedPassword, updated_at: db.fn.now() });
    await db('refresh_tokens').where({ user_id: user.id }).update({ revoked_at: db.fn.now() });

    const token = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);

    res.json({ message: 'Contraseña actualizada', token, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// Solicita un código de recuperación. Respuesta genérica para no revelar si el
// correo existe. Si hay SMTP configurado se envía por email; si no, queda en logs.
router.post('/forgot-password', authLimiter, [emailField, validate], async (req, res) => {
  const generic = { message: 'Si el correo está registrado, te enviamos un código de recuperación.' };
  try {
    const { email } = req.body;
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.json(generic);
    }

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

    await db.transaction(async (trx) => {
      // Invalida códigos anteriores sin usar antes de emitir uno nuevo.
      await trx('password_reset_tokens')
        .where({ user_id: user.id, used_at: null })
        .update({ used_at: trx.fn.now() });
      await trx('password_reset_tokens').insert({
        user_id: user.id,
        code_hash: hashToken(code),
        expires_at: expiresAt,
      });
    });

    try {
      await sendPasswordResetCode({ to: user.email, code, name: user.name });
    } catch (mailError) {
      console.error('[auth] No se pudo enviar el correo de recuperación:', mailError.message);
      console.warn(`[auth] Código de recuperación para ${user.email}: ${code}`);
    }

    return res.json(generic);
  } catch (error) {
    return res.status(500).json({ error: 'Error al solicitar la recuperación' });
  }
});

// Restablece la contraseña con el código recibido. Invalida tokens y sesiones.
router.post('/reset-password', authLimiter, [
  emailField,
  body('code').isString().trim().isLength({ min: 6, max: 6 }).withMessage('Ingresa el código de 6 dígitos'),
  body('newPassword').isString().isLength({ min: 8, max: 72 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  validate,
], async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const record = await db('password_reset_tokens')
      .where({ user_id: user.id, used_at: null })
      .orderBy('created_at', 'desc')
      .first();

    if (!record || new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }
    if (record.attempts >= MAX_RESET_ATTEMPTS) {
      return res.status(429).json({ error: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    if (record.code_hash !== hashToken(code)) {
      await db('password_reset_tokens')
        .where({ id: record.id })
        .update({ attempts: record.attempts + 1, updated_at: db.fn.now() });
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.transaction(async (trx) => {
      await trx('users').where({ id: user.id }).update({ password: hashedPassword, updated_at: trx.fn.now() });
      await trx('password_reset_tokens').where({ id: record.id }).update({ used_at: trx.fn.now() });
      await trx('refresh_tokens').where({ user_id: user.id }).update({ revoked_at: trx.fn.now() });
    });

    res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

module.exports = router;
