const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /?month&year — presupuestos del periodo con el gasto real por categoría
router.get('/', async (req, res) => {
  try {
    const currentDate = new Date();
    const month = parseInt(req.query.month, 10) || currentDate.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || currentDate.getFullYear();

    const budgets = await db('budgets')
      .select('budgets.*', 'categories.name as category_name', 'categories.color as category_color')
      .leftJoin('categories', 'budgets.category_id', 'categories.id')
      .where('budgets.user_id', req.user.id)
      .where('budgets.month', month)
      .where('budgets.year', year)
      .orderBy('categories.name', 'asc');

    // Gasto real por categoría en el periodo
    const spentRows = await db('expenses')
      .select('category_id', db.raw('SUM(amount) as spent'))
      .where('user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [month, year])
      .groupBy('category_id');

    const spentByCategory = {};
    spentRows.forEach((r) => { spentByCategory[r.category_id] = parseFloat(r.spent) || 0; });

    const result = budgets.map((b) => {
      const amount = parseFloat(b.amount) || 0;
      const spent = spentByCategory[b.category_id] || 0;
      const remaining = amount - spent;
      const pct = amount > 0 ? Math.round((spent / amount) * 100) : 0;
      return { ...b, spent, remaining, pct, over_budget: spent > amount };
    });

    res.json({ month, year, budgets: result });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
});

// POST / — crea presupuesto
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, month, year } = req.body;
    if (!category_id || amount == null || !month || !year) {
      return res.status(400).json({ error: 'category_id, amount, month y year son requeridos' });
    }
    const [budget] = await db('budgets')
      .insert({ category_id, amount, month, year, user_id: req.user.id })
      .returning('*');
    res.status(201).json(budget);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un presupuesto para esa categoría en el periodo' });
    }
    res.status(500).json({ error: 'Error al crear presupuesto' });
  }
});

// PUT /:id — actualiza monto del presupuesto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const [budget] = await db('budgets')
      .where({ id, user_id: req.user.id })
      .update({ amount, updated_at: db.fn.now() })
      .returning('*');
    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar presupuesto' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('budgets').where({ id, user_id: req.user.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    res.json({ message: 'Presupuesto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
});

module.exports = router;
