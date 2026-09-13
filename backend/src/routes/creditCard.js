const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { computeCreditCardPlan } = require('../utils/creditCardEngine');

router.use(authenticateToken);

// POST /plan — calcula en vivo el plan de compras cuotificadas de una tarjeta.
// No persiste nada: recibe las compras y devuelve el calendario agregado, el
// resumen por compra y la comparación capital fijo vs cuota fija.
router.post('/plan', (req, res) => {
  try {
    const config = req.body?.config || req.body || {};
    const purchases = Array.isArray(config.purchases) ? config.purchases : [];

    if (!purchases.length) {
      return res.status(400).json({ error: 'Agrega al menos una compra para calcular el plan' });
    }

    const invalid = purchases.find((p) => {
      const hasTotal = parseFloat(p.totalAmount ?? p.total_amount ?? p.amount) > 0;
      const hasPending = parseFloat(p.pendingCapital ?? p.pending) > 0;
      return !hasTotal && !hasPending;
    });
    if (invalid) {
      return res.status(400).json({ error: 'Cada compra necesita un monto o saldo pendiente mayor a cero' });
    }

    res.json(computeCreditCardPlan(config));
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular el plan de la tarjeta' });
  }
});

module.exports = router;
