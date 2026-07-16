const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    let query = db('savings')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    if (active !== undefined) {
      query = query.where('active', active === 'true');
    }

    const savings = await query;
    res.json(savings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ahorros' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const result = await db('savings')
      .where({ user_id: req.user.id, active: true })
      .sum('current_balance as total_balance')
      .first();

    const accounts = await db('savings')
      .where({ user_id: req.user.id, active: true })
      .count('id as total_accounts')
      .first();

    res.json({
      total_balance: result.total_balance || 0,
      total_accounts: accounts.total_accounts || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const savings = await db('savings')
      .where({ id, user_id: req.user.id })
      .first();

    if (!savings) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    const transactions = await db('savings_transactions')
      .where({ savings_id: id })
      .orderBy('date', 'desc')
      .limit(50);

    res.json({ ...savings, transactions });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cuenta' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, bank, current_balance, goal_amount, interest_rate, type, start_date } = req.body;

    const [savings] = await db('savings')
      .insert({
        name, bank, current_balance, goal_amount,
        interest_rate, type, start_date,
        user_id: req.user.id
      })
      .returning('*');

    res.status(201).json(savings);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cuenta de ahorro' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bank, current_balance, goal_amount, interest_rate, type, active } = req.body;

    const [savings] = await db('savings')
      .where({ id, user_id: req.user.id })
      .update({ name, bank, current_balance, goal_amount, interest_rate, type, active, updated_at: db.fn.now() })
      .returning('*');

    if (!savings) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    res.json(savings);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cuenta' });
  }
});

router.post('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, date, description } = req.body;

    const savings = await db('savings')
      .where({ id, user_id: req.user.id })
      .first();

    if (!savings) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    let newBalance = parseFloat(savings.current_balance);
    if (type === 'deposit') {
      newBalance += parseFloat(amount);
    } else if (type === 'withdrawal') {
      newBalance -= parseFloat(amount);
    } else if (type === 'interest') {
      newBalance += parseFloat(amount);
    }

    const [transaction] = await db('savings_transactions')
      .insert({ savings_id: id, amount, type, date, description })
      .returning('*');

    await db('savings')
      .where({ id })
      .update({ current_balance: newBalance, updated_at: db.fn.now() });

    if (type === 'deposit') {
      let expenseCategory = await db('categories')
        .where({ user_id: req.user.id, name: 'Ahorro', type: 'expense' })
        .first();

      if (!expenseCategory) {
        [expenseCategory] = await db('categories')
          .insert({ name: 'Ahorro', type: 'expense', color: '#8B5CF6', user_id: req.user.id })
          .returning('*');
      }

      await db('expenses')
        .insert({
          amount,
          description: description || `Depósito a ahorro: ${savings.name}`,
          date,
          category_id: expenseCategory.id,
          type: 'variable',
          recurring: false,
          user_id: req.user.id
        });
    } else if (type === 'withdrawal') {
      let incomeCategory = await db('categories')
        .where({ user_id: req.user.id, name: 'Retiro de Ahorro', type: 'income' })
        .first();

      if (!incomeCategory) {
        [incomeCategory] = await db('categories')
          .insert({ name: 'Retiro de Ahorro', type: 'income', color: '#8B5CF6', user_id: req.user.id })
          .returning('*');
      }

      await db('incomes')
        .insert({
          amount,
          description: description || `Retiro de ahorro: ${savings.name}`,
          date,
          category_id: incomeCategory.id,
          source: 'other',
          recurring: false,
          user_id: req.user.id
        });
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar transacción' });
  }
});

router.put('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const { id, transactionId } = req.params;
    const { amount, type, date, description } = req.body;

    const savings = await db('savings')
      .where({ id, user_id: req.user.id })
      .first();

    if (!savings) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    const transaction = await db('savings_transactions')
      .where({ id: transactionId, savings_id: id })
      .first();

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    let balanceAdjustment = 0;
    if (transaction.type === 'deposit') {
      balanceAdjustment -= parseFloat(transaction.amount);
    } else if (transaction.type === 'withdrawal') {
      balanceAdjustment += parseFloat(transaction.amount);
    } else if (transaction.type === 'interest') {
      balanceAdjustment -= parseFloat(transaction.amount);
    }

    if (type === 'deposit') {
      balanceAdjustment += parseFloat(amount);
    } else if (type === 'withdrawal') {
      balanceAdjustment -= parseFloat(amount);
    } else if (type === 'interest') {
      balanceAdjustment += parseFloat(amount);
    }

    const newBalance = parseFloat(savings.current_balance) + balanceAdjustment;

    const [updatedTransaction] = await db('savings_transactions')
      .where({ id: transactionId })
      .update({ amount, type, date, description })
      .returning('*');

    await db('savings')
      .where({ id })
      .update({ current_balance: Math.max(0, newBalance), updated_at: db.fn.now() });

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('savings').where({ id, user_id: req.user.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    res.json({ message: 'Cuenta de ahorro eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
});

router.delete('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const { id, transactionId } = req.params;

    const savings = await db('savings')
      .where({ id, user_id: req.user.id })
      .first();

    if (!savings) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    const transaction = await db('savings_transactions')
      .where({ id: transactionId, savings_id: id })
      .first();

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    let newBalance = parseFloat(savings.current_balance);
    if (transaction.type === 'deposit') {
      newBalance -= parseFloat(transaction.amount);
    } else if (transaction.type === 'withdrawal') {
      newBalance += parseFloat(transaction.amount);
    } else if (transaction.type === 'interest') {
      newBalance -= parseFloat(transaction.amount);
    }

    await db('savings_transactions').where({ id: transactionId }).del();

    await db('savings')
      .where({ id })
      .update({ current_balance: Math.max(0, newBalance), updated_at: db.fn.now() });

    if (transaction.type === 'deposit') {
      await db('expenses')
        .where({
          user_id: req.user.id,
          description: `Depósito a ahorro: ${savings.name}`,
          date: transaction.date
        })
        .del();
    } else if (transaction.type === 'withdrawal') {
      await db('incomes')
        .where({
          user_id: req.user.id,
          description: `Retiro de ahorro: ${savings.name}`,
          date: transaction.date
        })
        .del();
    }

    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
});

module.exports = router;
