const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { computeSimulation } = require('../utils/simulationEngine');

router.use(authenticateToken);

// Carga las deudas activas del usuario para amortizarlas en la simulación.
async function loadActiveDebts(userId) {
  return db('debts').where({ user_id: userId, status: 'active' });
}

// GET / — lista las simulaciones guardadas del usuario (sin recalcular).
router.get('/', async (req, res) => {
  try {
    const simulations = await db('simulations')
      .where('user_id', req.user.id)
      .orderBy('updated_at', 'desc');
    res.json(simulations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener simulaciones' });
  }
});

// POST /compute — calcula una simulación en vivo a partir de una config, sin guardarla.
router.post('/compute', async (req, res) => {
  try {
    const config = req.body?.config || req.body || {};
    const debts = await loadActiveDebts(req.user.id);
    const result = computeSimulation(config, debts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular la simulación' });
  }
});

// POST / — guarda una nueva simulación.
router.post('/', async (req, res) => {
  try {
    const { name, config } = req.body;
    if (!name || !config) {
      return res.status(400).json({ error: 'Nombre y configuración son requeridos' });
    }

    const [simulation] = await db('simulations')
      .insert({
        name,
        config: JSON.stringify(config),
        user_id: req.user.id,
      })
      .returning('*');

    res.status(201).json(simulation);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la simulación' });
  }
});

// GET /:id — devuelve una simulación guardada junto con su resultado recalculado.
router.get('/:id', async (req, res) => {
  try {
    const simulation = await db('simulations')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    const debts = await loadActiveDebts(req.user.id);
    const result = computeSimulation(simulation.config, debts);
    res.json({ ...simulation, result });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la simulación' });
  }
});

// PUT /:id — actualiza nombre y/o configuración.
router.put('/:id', async (req, res) => {
  try {
    const { name, config } = req.body;
    const updates = { updated_at: db.fn.now() };
    if (name !== undefined) updates.name = name;
    if (config !== undefined) updates.config = JSON.stringify(config);

    const [simulation] = await db('simulations')
      .where({ id: req.params.id, user_id: req.user.id })
      .update(updates)
      .returning('*');

    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    res.json(simulation);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la simulación' });
  }
});

// DELETE /:id — elimina una simulación.
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db('simulations')
      .where({ id: req.params.id, user_id: req.user.id })
      .del();

    if (!deleted) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    res.json({ message: 'Simulación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la simulación' });
  }
});

module.exports = router;
