const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const {
  buildCycles,
  assignMovementsToCycles,
  consolidateCycles,
  periodicRate,
} = require('../utils/billingCycles');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('debts')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where('status', status);
    }

    const debts = await query;
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener deudas' });
  }
});

router.get('/calculator', async (req, res) => {
  try {
    const { amount, rate, months } = req.query;
    
    if (!amount || !rate || !months) {
      return res.status(400).json({ error: 'Se requieren amount, rate y months' });
    }

    const principal = parseFloat(amount);
    const annualRate = parseFloat(rate);
    const termMonths = parseInt(months);
    const monthlyRate = annualRate / 100 / 12;

    let monthlyPayment;
    let totalPayment;
    let totalInterest;

    if (monthlyRate === 0) {
      monthlyPayment = principal / termMonths;
      totalPayment = principal;
      totalInterest = 0;
    } else {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                       (Math.pow(1 + monthlyRate, termMonths) - 1);
      totalPayment = monthlyPayment * termMonths;
      totalInterest = totalPayment - principal;
    }

    const amortization = [];
    let balance = principal;

    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const capitalPayment = monthlyPayment - interestPayment;
      balance = Math.max(0, balance - capitalPayment);

      amortization.push({
        month,
        payment: Math.round(monthlyPayment * 100) / 100,
        capital: Math.round(capitalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(balance * 100) / 100
      });
    }

    res.json({
      input: { principal, annualRate, termMonths },
      result: {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        interestPercentage: Math.round((totalInterest / principal) * 100 * 100) / 100
      },
      amortization
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular cuota' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const payments = await db('debt_payments')
      .where({ debt_id: id })
      .orderBy('payment_date', 'desc');

    res.json({ ...debt, payments });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener deuda' });
  }
});

router.get('/:id/projection', async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const monthlyRate = parseFloat(debt.interest_rate) / 100 / 12;
    let balance = parseFloat(debt.current_balance);
    const projection = [];

    for (let month = 1; month <= Math.min(debt.remaining_months, 24); month++) {
      const interestPayment = balance * monthlyRate;
      let capitalPayment = parseFloat(debt.monthly_payment) - interestPayment;
      if (capitalPayment > balance) capitalPayment = balance;
      const actualPayment = capitalPayment + interestPayment;
      balance -= capitalPayment;

      projection.push({
        month,
        payment: Math.round(actualPayment * 100) / 100,
        capital: Math.round(capitalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(balance * 100) / 100
      });
    }

    const totalPayments = projection.reduce((sum, p) => sum + p.payment, 0);
    const totalInterest = projection.reduce((sum, p) => sum + p.interest, 0);
    const totalCapital = projection.reduce((sum, p) => sum + p.capital, 0);

    res.json({
      debt,
      projection,
      summary: {
        totalPayments: Math.round(totalPayments * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalCapital: Math.round(totalCapital * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar proyección' });
  }
});

// Consolidación por ciclo de corte: agrupa los movimientos reales (consumos/abonos)
// en la ventana de cada ciclo y encadena el interés generado desde la deuda original.
router.get('/:id/cycles', async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const payments = await db('debt_payments')
      .where({ debt_id: id })
      .orderBy('payment_date', 'asc');

    // Número de ciclos: desde el inicio de la deuda hasta ~3 ciclos más allá de hoy (tope 60).
    const start = new Date(debt.start_date);
    const now = new Date();
    const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12
      + (now.getMonth() - start.getMonth());
    const defaultCount = Math.max(1, Math.min(60, monthsSinceStart + 3));
    const count = req.query.count
      ? Math.max(1, Math.min(120, parseInt(req.query.count, 10) || defaultCount))
      : defaultCount;

    const cycles = buildCycles({
      cutDay: debt.cut_day || null,
      dueDay: debt.payment_day || null,
      count,
      anchorDate: debt.start_date,
    });

    const movements = payments.map((p) => ({
      date: p.payment_date,
      amount: parseFloat(p.amount) || 0,
      type: p.type === 'charge' ? 'charge' : 'payment',
      description: p.description || null,
    }));
    const movementsByCycle = assignMovementsToCycles(cycles, movements);

    // Saldo inicial del primer ciclo = deuda original, antes de movimientos. Los
    // consumos ya están sumados a `total_amount`, así que se descuentan para no
    // contarlos dos veces (luego se reaplican dentro del ciclo donde ocurrieron).
    const totalChargeAmount = movements
      .filter((m) => m.type === 'charge')
      .reduce((s, m) => s + m.amount, 0);
    const originalPrincipal = Math.max(0, (parseFloat(debt.total_amount) || 0) - totalChargeAmount);

    const consolidated = consolidateCycles({
      openingBalance: originalPrincipal,
      monthlyRate: periodicRate(debt.interest_rate),
      cycles,
      movementsByCycle,
    });

    // Índice del ciclo que contiene la fecha de hoy.
    const todayIso = now.toISOString().split('T')[0];
    const currentIndex = consolidated.findIndex(
      (c) => todayIso >= c.cutStart && todayIso <= c.cutEnd
    );

    const summary = {
      count: consolidated.length,
      currentIndex,
      cutDay: debt.cut_day || null,
      dueDay: debt.payment_day || null,
      originalDebt: Math.round(originalPrincipal * 100) / 100,
      totalInterest: Math.round(consolidated.reduce((s, c) => s + c.interest, 0) * 100) / 100,
      totalCharges: Math.round(consolidated.reduce((s, c) => s + c.charges, 0) * 100) / 100,
      totalPayments: Math.round(consolidated.reduce((s, c) => s + c.payments, 0) * 100) / 100,
    };

    res.json({ debt, cycles: consolidated, summary });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar ciclos de corte' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, total_amount, interest_rate, interest_type,
      monthly_payment, term_months, start_date, end_date,
      bank_or_lender, payment_day, cut_day
    } = req.body;

    const [debt] = await db('debts')
      .insert({
        name, total_amount, current_balance: total_amount,
        interest_rate, interest_type, monthly_payment,
        term_months, remaining_months: term_months,
        start_date, end_date, bank_or_lender,
        payment_day: payment_day || null,
        cut_day: cut_day || null,
        user_id: req.user.id
      })
      .returning('*');

    res.status(201).json(debt);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear deuda' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, total_amount, current_balance, interest_rate,
      interest_type, monthly_payment, term_months,
      remaining_months, start_date, end_date,
      bank_or_lender, status, payment_day, cut_day
    } = req.body;

    const [debt] = await db('debts')
      .where({ id, user_id: req.user.id })
      .update({
        name, total_amount, current_balance, interest_rate,
        interest_type, monthly_payment, term_months,
        remaining_months, start_date, end_date,
        bank_or_lender, status, payment_day: payment_day || null,
        cut_day: cut_day || null,
        updated_at: db.fn.now()
      })
      .returning('*');

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    res.json(debt);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar deuda' });
  }
});

router.post('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date } = req.body;

    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const monthlyRate = parseFloat(debt.interest_rate) / 100 / 12;
    const interestPortion = parseFloat(debt.current_balance) * monthlyRate;
    const capitalPortion = parseFloat(amount) - interestPortion;
    const newBalance = parseFloat(debt.current_balance) - capitalPortion;

    const [payment] = await db('debt_payments')
      .insert({
        debt_id: id,
        amount,
        capital_portion: capitalPortion,
        interest_portion: interestPortion,
        payment_date,
        remaining_balance: Math.max(0, newBalance),
        type: 'payment'
      })
      .returning('*');

    await db('debts')
      .where({ id })
      .update({
        current_balance: Math.max(0, newBalance),
        remaining_months: debt.remaining_months - 1,
        status: newBalance <= 0 ? 'paid' : debt.status,
        updated_at: db.fn.now()
      });

    let expenseCategory = await db('categories')
      .where({ user_id: req.user.id, name: 'Pago Deuda', type: 'expense' })
      .first();

    if (!expenseCategory) {
      [expenseCategory] = await db('categories')
        .insert({ name: 'Pago Deuda', type: 'expense', color: '#EF4444', user_id: req.user.id })
        .returning('*');
    }

    await db('expenses')
      .insert({
        amount,
        description: `Pago deuda: ${debt.name}`,
        date: payment_date,
        category_id: expenseCategory.id,
        type: 'fixed',
        recurring: false,
        user_id: req.user.id
      });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// Registrar un consumo/cargo (ej. nueva compra con tarjeta de crédito):
// aumenta el saldo actual y el monto total de la deuda.
router.post('/:id/charges', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, description } = req.body;

    const chargeAmount = parseFloat(amount);
    if (!chargeAmount || chargeAmount <= 0) {
      return res.status(400).json({ error: 'El monto del consumo debe ser mayor a cero' });
    }

    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const newBalance = parseFloat(debt.current_balance) + chargeAmount;
    const newTotal = parseFloat(debt.total_amount) + chargeAmount;

    const [charge] = await db('debt_payments')
      .insert({
        debt_id: id,
        amount: chargeAmount,
        capital_portion: chargeAmount,
        interest_portion: 0,
        payment_date,
        remaining_balance: newBalance,
        type: 'charge',
        description: description || null
      })
      .returning('*');

    await db('debts')
      .where({ id })
      .update({
        current_balance: newBalance,
        total_amount: newTotal,
        status: debt.status === 'paid' ? 'active' : debt.status,
        updated_at: db.fn.now()
      });

    res.status(201).json(charge);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar consumo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('debts').where({ id, user_id: req.user.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    res.json({ message: 'Deuda eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar deuda' });
  }
});

router.put('/:id/payments/:paymentId', async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const { amount, payment_date } = req.body;

    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const oldPayment = await db('debt_payments')
      .where({ id: paymentId, debt_id: id })
      .first();

    if (!oldPayment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Consumo: ajustar saldo y total por la diferencia de monto
    if (oldPayment.type === 'charge') {
      const delta = parseFloat(amount) - parseFloat(oldPayment.amount);
      const newBalance = parseFloat(debt.current_balance) + delta;
      const newTotal = parseFloat(debt.total_amount) + delta;

      const [charge] = await db('debt_payments')
        .where({ id: paymentId })
        .update({
          amount,
          capital_portion: amount,
          payment_date,
          remaining_balance: newBalance
        })
        .returning('*');

      await db('debts')
        .where({ id })
        .update({
          current_balance: newBalance,
          total_amount: newTotal,
          status: newBalance > 0 && debt.status === 'paid' ? 'active' : debt.status,
          updated_at: db.fn.now()
        });

      return res.json(charge);
    }

    const monthlyRate = parseFloat(debt.interest_rate) / 100 / 12;
    const interestPortion = parseFloat(debt.current_balance) * monthlyRate;
    const capitalPortion = parseFloat(amount) - interestPortion;

    const [payment] = await db('debt_payments')
      .where({ id: paymentId })
      .update({
        amount,
        capital_portion: capitalPortion,
        interest_portion: interestPortion,
        payment_date
      })
      .returning('*');

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar pago' });
  }
});

router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    const { id, paymentId } = req.params;

    const debt = await db('debts')
      .where({ id, user_id: req.user.id })
      .first();

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const payment = await db('debt_payments')
      .where({ id: paymentId, debt_id: id })
      .first();

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    await db('debt_payments').where({ id: paymentId }).del();

    // Consumo: revertir el aumento de saldo y total
    if (payment.type === 'charge') {
      const newBalance = Math.max(0, parseFloat(debt.current_balance) - parseFloat(payment.amount));
      const newTotal = Math.max(0, parseFloat(debt.total_amount) - parseFloat(payment.amount));
      await db('debts')
        .where({ id })
        .update({
          current_balance: newBalance,
          total_amount: newTotal,
          status: newBalance <= 0 ? 'paid' : debt.status,
          updated_at: db.fn.now()
        });

      return res.json({ message: 'Consumo eliminado' });
    }

    const newBalance = parseFloat(debt.current_balance) + parseFloat(payment.capital_portion);
    await db('debts')
      .where({ id })
      .update({
        current_balance: newBalance,
        remaining_months: debt.remaining_months + 1,
        status: 'active',
        updated_at: db.fn.now()
      });

    await db('expenses')
      .where({
        user_id: req.user.id,
        description: `Pago deuda: ${debt.name}`,
        date: payment.payment_date
      })
      .del();

    res.json({ message: 'Pago eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
});

module.exports = router;
