const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET / — lista categorías del usuario (filtro ?type=income|expense)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = db('categories')
      .where('user_id', req.user.id)
      .orderBy('name', 'asc');
    if (type) query = query.where('type', type);
    const categories = await query;
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST / — crea categoría
router.post('/', async (req, res) => {
  try {
    const { name, type, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }
    const [category] = await db('categories')
      .insert({ name, type, color: color || '#3B82F6', user_id: req.user.id })
      .returning('*');
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// PUT /:id — actualiza categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;
    const [category] = await db('categories')
      .where({ id, user_id: req.user.id })
      .update({ name, type, color, updated_at: db.fn.now() })
      .returning('*');
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE /:id — elimina categoría (los movimientos quedan con category_id NULL por FK SET NULL)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('categories').where({ id, user_id: req.user.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

module.exports = router;
