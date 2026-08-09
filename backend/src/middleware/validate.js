const { validationResult } = require('express-validator');

// Mapea los errores de express-validator al contrato `{ error }` del resto de la API.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

module.exports = { validate };
