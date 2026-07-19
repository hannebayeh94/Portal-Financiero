const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { month, year, category_id, type } = req.query;
    let query = db('expenses')
      .select('expenses.*', 'categories.name as category_name')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', req.user.id)
      .orderBy('expenses.date', 'desc');

    if (month && year) {
      query = query.whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [month, year]);
    }
    if (category_id) {
      query = query.where('expenses.category_id', category_id);
    }
    if (type) {
      query = query.where('expenses.type', type);
    }

    const expenses = await query;
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener egresos' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const result = await db('expenses')
      .where('user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [targetMonth, targetYear])
      .sum('amount as total')
      .first();

    const fourPerThousandResult = await db('expenses')
      .where('user_id', req.user.id)
      .where('apply_four_per_thousand', true)
      .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [targetMonth, targetYear])
      .sum('four_per_thousand_amount as total')
      .first();

    res.json({
      total: result.total || 0,
      four_per_thousand_total: fourPerThousandResult.total || 0,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

router.get('/by-category', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const expenses = await db('expenses')
      .select('categories.name as category', db.raw('SUM(expenses.amount) as total'))
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM expenses.date) = ? AND EXTRACT(YEAR FROM expenses.date) = ?', [targetMonth, targetYear])
      .groupBy('categories.name');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener gastos por categoría' });
  }
});

// Egresos recurrentes normalizados a monto mensual, deduplicados por
// descripción + categoría (se toma la ocurrencia más reciente para no contar
// varias veces el mismo gasto registrado mes a mes). Reutilizable, p. ej. por el
// simulador para proponer el gasto base a partir de gastos fijos reales.
router.get('/recurring', async (req, res) => {
  try {
    const rows = await db('expenses')
      .select('expenses.*', 'categories.name as category_name')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', req.user.id)
      .where('expenses.recurring', true)
      .orderBy('expenses.date', 'desc');

    const toMonthly = (amount, type) => {
      const a = parseFloat(amount) || 0;
      if (type === 'weekly') return Math.round((a * 52) / 12);
      if (type === 'yearly') return Math.round(a / 12);
      return Math.round(a); // 'monthly' o sin tipo
    };

    const seen = new Map(); // clave: descripción+categoría → ocurrencia más reciente
    for (const r of rows) {
      const key = `${(r.description || '').trim().toLowerCase()}|${r.category_id || 0}`;
      if (!seen.has(key)) seen.set(key, r);
    }

    const items = Array.from(seen.values()).map((r) => ({
      id: r.id,
      description: r.description,
      category_name: r.category_name || null,
      amount: parseFloat(r.amount) || 0,
      recurrence_type: r.recurrence_type || 'monthly',
      monthlyAmount: toMonthly(r.amount, r.recurrence_type),
    }));
    const totalMonthly = items.reduce((s, i) => s + i.monthlyAmount, 0);

    res.json({ items, totalMonthly });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener egresos recurrentes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, description, date, category_id, type, recurring, recurrence_type, apply_four_per_thousand } = req.body;

    const four_per_thousand_amount = apply_four_per_thousand
      ? Math.round(parseFloat(amount) * 0.004 * 100) / 100
      : null;

    const [expense] = await db('expenses')
      .insert({
        amount, description, date, category_id, type,
        recurring, recurrence_type,
        apply_four_per_thousand: apply_four_per_thousand || false,
        four_per_thousand_amount,
        user_id: req.user.id
      })
      .returning('*');

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear egreso' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date, category_id, type, recurring, recurrence_type, apply_four_per_thousand } = req.body;

    const four_per_thousand_amount = apply_four_per_thousand
      ? Math.round(parseFloat(amount) * 0.004 * 100) / 100
      : null;

    const [expense] = await db('expenses')
      .where({ id, user_id: req.user.id })
      .update({
        amount, description, date, category_id, type,
        recurring, recurrence_type,
        apply_four_per_thousand: apply_four_per_thousand || false,
        four_per_thousand_amount,
        updated_at: db.fn.now()
      })
      .returning('*');

    if (!expense) {
      return res.status(404).json({ error: 'Egreso no encontrado' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar egreso' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('expenses').where({ id, user_id: req.user.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Egreso no encontrado' });
    }

    res.json({ message: 'Egreso eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar egreso' });
  }
});

module.exports = router;
