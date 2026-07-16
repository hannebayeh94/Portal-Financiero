const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/cash-flow', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const incomes = await db('incomes')
      .where('user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [targetMonth, targetYear])
      .sum('amount as total')
      .first();

    const expenses = await db('expenses')
      .where('user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [targetMonth, targetYear])
      .sum('amount as total')
      .first();

    const debtPayments = await db('debt_payments')
      .join('debts', 'debt_payments.debt_id', 'debts.id')
      .where('debts.user_id', req.user.id)
      .whereRaw('EXTRACT(MONTH FROM debt_payments.payment_date) = ? AND EXTRACT(YEAR FROM debt_payments.payment_date) = ?', [targetMonth, targetYear])
      .sum('debt_payments.amount as total')
      .first();

    const savingsDeposits = await db('savings_transactions')
      .join('savings', 'savings_transactions.savings_id', 'savings.id')
      .where('savings.user_id', req.user.id)
      .where('savings_transactions.type', 'deposit')
      .whereRaw('EXTRACT(MONTH FROM savings_transactions.date) = ? AND EXTRACT(YEAR FROM savings_transactions.date) = ?', [targetMonth, targetYear])
      .sum('savings_transactions.amount as total')
      .first();

    const totalIncome = parseFloat(incomes.total || 0);
    const totalExpenses = parseFloat(expenses.total || 0);
    const totalDebtPayments = parseFloat(debtPayments.total || 0);
    const totalSavingsDeposits = parseFloat(savingsDeposits.total || 0);

    const netFlow = totalIncome - totalExpenses - totalDebtPayments - totalSavingsDeposits;

    res.json({
      period: { month: targetMonth, year: targetYear },
      income: totalIncome,
      expenses: totalExpenses,
      debt_payments: totalDebtPayments,
      savings_deposits: totalSavingsDeposits,
      net_flow: netFlow
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte de flujo de caja' });
  }
});

router.get('/monthly-evolution', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const incomes = await db('incomes')
        .where('user_id', req.user.id)
        .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [month, targetYear])
        .sum('amount as total')
        .first();

      const expenses = await db('expenses')
        .where('user_id', req.user.id)
        .whereRaw('EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?', [month, targetYear])
        .sum('amount as total')
        .first();

      monthlyData.push({
        month,
        income: parseFloat(incomes.total || 0),
        expenses: parseFloat(expenses.total || 0),
        net: parseFloat(incomes.total || 0) - parseFloat(expenses.total || 0)
      });
    }

    res.json({ year: targetYear, data: monthlyData });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener evolución mensual' });
  }
});

router.get('/debt-status', async (req, res) => {
  try {
    const debts = await db('debts')
      .where('user_id', req.user.id)
      .where('status', 'active');

    const totalDebt = debts.reduce((sum, debt) => sum + parseFloat(debt.current_balance), 0);
    const totalMonthlyPayment = debts.reduce((sum, debt) => sum + parseFloat(debt.monthly_payment), 0);

    const debtDetails = debts.map(debt => ({
      id: debt.id,
      name: debt.name,
      balance: parseFloat(debt.current_balance),
      monthly_payment: parseFloat(debt.monthly_payment),
      interest_rate: parseFloat(debt.interest_rate),
      remaining_months: debt.remaining_months,
      bank: debt.bank_or_lender
    }));

    res.json({
      total_debt: totalDebt,
      total_monthly_payment: totalMonthlyPayment,
      debts: debtDetails
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de deudas' });
  }
});

router.get('/savings-status', async (req, res) => {
  try {
    const savings = await db('savings')
      .where({ user_id: req.user.id, active: true });

    const totalBalance = savings.reduce((sum, account) => sum + parseFloat(account.current_balance), 0);
    const totalGoal = savings.reduce((sum, account) => sum + (account.goal_amount ? parseFloat(account.goal_amount) : 0), 0);

    const accounts = savings.map(account => ({
      id: account.id,
      name: account.name,
      bank: account.bank,
      balance: parseFloat(account.current_balance),
      goal: account.goal_amount ? parseFloat(account.goal_amount) : null,
      progress: account.goal_amount
        ? Math.round((parseFloat(account.current_balance) / parseFloat(account.goal_amount)) * 100)
        : null,
      interest_rate: parseFloat(account.interest_rate),
      type: account.type
    }));

    res.json({
      total_balance: totalBalance,
      total_goal: totalGoal,
      overall_progress: totalGoal > 0 ? Math.round((totalBalance / totalGoal) * 100) : null,
      accounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de ahorros' });
  }
});

router.get('/interest-projection', async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const debts = await db('debts')
      .where({ user_id: req.user.id, status: 'active' });

    const savings = await db('savings')
      .where({ user_id: req.user.id, active: true });

    const debtProjections = debts.map(debt => {
      const monthlyRate = parseFloat(debt.interest_rate) / 100 / 12;
      let balance = parseFloat(debt.current_balance);
      const projections = [];

      for (let month = 1; month <= Math.min(parseInt(months), debt.remaining_months); month++) {
        const interest = balance * monthlyRate;
        const capital = parseFloat(debt.monthly_payment) - interest;
        balance = Math.max(0, balance - capital);

        projections.push({
          month,
          interest: Math.round(interest * 100) / 100,
          capital: Math.round(capital * 100) / 100,
          balance: Math.round(balance * 100) / 100
        });
      }

      return {
        debt_id: debt.id,
        debt_name: debt.name,
        projections
      };
    });

    const savingsProjections = savings.map(account => {
      const monthlyRate = parseFloat(account.interest_rate) / 100 / 12;
      let balance = parseFloat(account.current_balance);
      const projections = [];

      for (let month = 1; month <= parseInt(months); month++) {
        const interest = balance * monthlyRate;
        balance += interest;

        projections.push({
          month,
          interest: Math.round(interest * 100) / 100,
          balance: Math.round(balance * 100) / 100
        });
      }

      return {
        savings_id: account.id,
        savings_name: account.name,
        projections
      };
    });

    res.json({
      debts: debtProjections,
      savings: savingsProjections
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar proyección de intereses' });
  }
});

module.exports = router;
