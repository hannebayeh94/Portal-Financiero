require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// CORS: allow-list explícita vía ALLOWED_ORIGINS (lista separada por comas).
// Sin la variable se mantiene el comportamiento previo (todos los orígenes)
// para no romper el frontend desplegado; se recomienda fijarla en producción.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length) {
  app.use(cors({
    origin(origin, callback) {
      // Peticiones sin Origin (app móvil, curl, health checks) siempre permitidas.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    },
  }));
} else {
  app.use(cors());
  console.warn('[cors] ALLOWED_ORIGINS no definido: se aceptan todos los orígenes.');
}

app.use(morgan('combined'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/incomes', require('./routes/incomes'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/debts', require('./routes/debts'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/projections', require('./routes/projections'));
app.use('/api/simulations', require('./routes/simulations'));
app.use('/api/credit-card', require('./routes/creditCard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/insights', require('./routes/insights'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 para rutas no encontradas.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global.
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ error: 'Origen no permitido por CORS' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

module.exports = app;
