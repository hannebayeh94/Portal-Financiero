// Envío de correo para recuperación de contraseña.
// nodemailer es opcional: si no está instalado o no hay SMTP configurado, el
// código de recuperación se registra en los logs del servidor (visible para el
// administrador) en vez de fallar.
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { /* dependencia opcional */ }

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && nodemailer);
}

let transporter = null;
function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Envía el código de recuperación. Devuelve { sent } indicando si se entregó.
 * Sin SMTP configurado deja el código en los logs y devuelve sent=false.
 */
async function sendPasswordResetCode({ to, code, name } = {}) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mailer] SMTP no configurado. Código de recuperación para ${to}: ${code}`);
    return { sent: false };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const minutes = parseInt(process.env.RESET_CODE_TTL_MINUTES, 10) || 15;
  const subject = 'Recupera tu contraseña · Portal Financiero';
  const text =
    `Hola ${name || ''},\n\n` +
    `Tu código para restablecer la contraseña es: ${code}\n\n` +
    `Vence en ${minutes} minutos. Si no lo solicitaste, ignora este correo.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#14666B">Recupera tu contraseña</h2>
      <p>Hola ${name || ''},</p>
      <p>Tu código para restablecer la contraseña es:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#123332">${code}</p>
      <p>Vence en <strong>${minutes} minutos</strong>. Si no lo solicitaste, ignora este correo.</p>
      <p style="color:#6E8884;font-size:12px">Portal Financiero</p>
    </div>`;

  await t.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

module.exports = { sendPasswordResetCode, isConfigured };
