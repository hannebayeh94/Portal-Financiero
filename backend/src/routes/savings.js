const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { isPositiveNumber } = require('../utils/validation');
const { logFinancial } = require('../utils/logger');

const TRANSACTION_TYPES = ['deposit', 'withdrawal', 'interest'];

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

    const amountNum = parseFloat(amount);
    if (!isPositiveNumber(amountNum)) {
      return res.status(400).json({ error: 'El monto de la transacción debe ser mayor a cero' });
    }
    if (!TRANSACTION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Tipo de transacción inválido' });
    }
    if (!date) {
      return res.status(400).json({ error: 'La fecha es requerida' });
    }

    const savings = await db('savings')
      .where({ id, user_id: req.user.id })
      .first();

    if (!savings) {
      return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });
    }

    const transaction = await db.transaction(async (trx) => {
      let newBalance = parseFloat(savings.current_balance);
      if (type === 'deposit') {
        newBalance += amountNum;
      } else if (type === 'withdrawal') {
        newBalance -= amountNum;
      } else if (type === 'interest') {
        newBalance += amountNum;
      }

      const [transactionRow] = await trx('savings_transactions')
        .insert({ savings_id: id, amount: amountNum, type, date, description })
        .returning('*');

      await trx('savings')
        .where({ id })
        .update({ current_balance: Math.max(0, newBalance), updated_at: trx.fn.now() });

      if (type === 'deposit') {
        let expenseCategory = await trx('categories')
          .where({ user_id: req.user.id, name: 'Ahorro', type: 'expense' })
          .first();

        if (!expenseCategory) {
          [expenseCategory] = await trx('categories')
            .insert({ name: 'Ahorro', type: 'expense', color: '#8B5CF6', user_id: req.user.id })
            .returning('*');
        }

        await trx('expenses')
          .insert({
            amount: amountNum,
            description: description || `Depósito a ahorro: ${savings.name}`,
            date,
            category_id: expenseCategory.id,
            type: 'variable',
            recurring: false,
            user_id: req.user.id
          });
      } else if (type === 'withdrawal') {
        let incomeCategory = await trx('categories')
          .where({ user_id: req.user.id, name: 'Retiro de Ahorro', type: 'income' })
          .first();

        if (!incomeCategory) {
          [incomeCategory] = await trx('categories')
            .insert({ name: 'Retiro de Ahorro', type: 'income', color: '#8B5CF6', user_id: req.user.id })
            .returning('*');
        }

        await trx('incomes')
          .insert({
            amount: amountNum,
            description: description || `Retiro de ahorro: ${savings.name}`,
            date,
            category_id: incomeCategory.id,
            source: 'other',
            recurring: false,
            user_id: req.user.id
          });
      }

      return transactionRow;
    });

    logFinancial(req.user.id, 'savings.transaction', { savingsId: id, type, amount: amountNum });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar transacción' });
  }
});

router.put('/:id/transactions/:transactionId', async (req, res) => {
  try {
    const { id, transactionId } = req.params;
    const { amount, type, date, description } = req.body;

    const amountNum = parseFloat(amount);
    if (!isPositiveNumber(amountNum)) {
      return res.status(400).json({ error: 'El monto de la transacción debe ser mayor a cero' });
    }
    if (!TRANSACTION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Tipo de transacción inválido' });
    }

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
      balanceAdjustment += amountNum;
    } else if (type === 'withdrawal') {
      balanceAdjustment -= amountNum;
    } else if (type === 'interest') {
      balanceAdjustment += amountNum;
    }

    const newBalance = parseFloat(savings.current_balance) + balanceAdjustment;

    const updatedTransaction = await db.transaction(async (trx) => {
      const [row] = await trx('savings_transactions')
        .where({ id: transactionId })
        .update({ amount: amountNum, type, date, description })
        .returning('*');

      await trx('savings')
        .where({ id })
        .update({ current_balance: Math.max(0, newBalance), updated_at: trx.fn.now() });

      return row;
    });

    logFinancial(req.user.id, 'savings.transaction.update', { savingsId: id, transactionId, type, amount: amountNum });

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

    await db.transaction(async (trx) => {
      await trx('savings_transactions').where({ id: transactionId }).del();

      await trx('savings')
        .where({ id })
        .update({ current_balance: Math.max(0, newBalance), updated_at: trx.fn.now() });

      if (transaction.type === 'deposit') {
        await trx('expenses')
          .where({
            user_id: req.user.id,
            description: `Depósito a ahorro: ${savings.name}`,
            date: transaction.date
          })
          .del();
      } else if (transaction.type === 'withdrawal') {
        await trx('incomes')
          .where({
            user_id: req.user.id,
            description: `Retiro de ahorro: ${savings.name}`,
            date: transaction.date
          })
          .del();
      }
    });

    logFinancial(req.user.id, 'savings.transaction.delete', {
      savingsId: id,
      transactionId,
      type: transaction.type,
      amount: parseFloat(transaction.amount) || 0,
    });

    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
});

module.exports = router;
