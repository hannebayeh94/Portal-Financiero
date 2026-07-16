const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { month, year, category_id } = req.query;
    let query = db('incomes')
      .select('incomes.*', 'categories.name as category_name')
      .leftJoin('categories', 'incomes.category_id', 'categories.id')
      .where('incomes.user_id', req.user.id)
      .orderBy('incomes.date', 'desc');

    if (month && year) {
      query = query.whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [month, year]);
    }
    if (category_id) {
      query = query.where('incomes.category_id', category_id);
    }

    const incomes = await query;
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ingresos' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const result = await db('incomes')
      .where('user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [targetMonth, targetYear])
      .sum('amount as total')
      .first();

    res.json({ total: result.total || 0, month: targetMonth, year: targetYear });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, description, date, category_id, source, recurring, recurrence_type } = req.body;

    const [income] = await db('incomes')
      .insert({
        amount, description, date, category_id, source,
        recurring, recurrence_type, user_id: req.user.id
      })
      .returning('*');

    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ingreso' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date, category_id, source, recurring, recurrence_type } = req.body;

    const [income] = await db('incomes')
      .where({ id, user_id: req.user.id })
      .update({ amount, description, date, category_id, source, recurring, recurrence_type, updated_at: db.fn.now() })
      .returning('*');

    if (!income) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ingreso' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('incomes').where({ id, user_id: req.user.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    res.json({ message: 'Ingreso eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ingreso' });
  }
});

module.exports = router;
