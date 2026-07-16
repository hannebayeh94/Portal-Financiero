const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { scenario } = req.query;
    let query = db('projections')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    if (scenario) {
      query = query.where('scenario', scenario);
    }

    const projections = await query;
    res.json(projections);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyecciones' });
  }
});

router.get('/generate', async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const incomeResult = await db('incomes')
      .where('user_id', req.user.id)
      .whereRaw("date >= date_trunc('month', CURRENT_DATE)")
      .sum('amount as avg_monthly')
      .first();

    const expenseResult = await db('expenses')
      .where('user_id', req.user.id)
      .whereRaw("date >= date_trunc('month', CURRENT_DATE)")
      .sum('amount as avg_monthly')
      .first();

    const savingsResult = await db('savings')
      .where({ user_id: req.user.id, active: true })
      .sum('current_balance as total')
      .first();

    const avgIncome = parseFloat(incomeResult.avg_monthly || 0);
    const avgExpense = parseFloat(expenseResult.avg_monthly || 0);
    const totalSavings = parseFloat(savingsResult.total || 0);

    const scenarios = {
      optimistic: { incomeGrowth: 1.1, expenseGrowth: 0.95 },
      realistic: { incomeGrowth: 1.03, expenseGrowth: 1.02 },
      conservative: { incomeGrowth: 1.01, expenseGrowth: 1.05 }
    };

    const projections = {};
    const startDate = new Date();

    for (const [scenarioName, rates] of Object.entries(scenarios)) {
      const monthlyBreakdown = [];
      let projectedIncome = avgIncome;
      let projectedExpense = avgExpense;
      let projectedSavings = totalSavings;

      for (let month = 1; month <= parseInt(months); month++) {
        projectedIncome *= rates.incomeGrowth;
        projectedExpense *= rates.expenseGrowth;
        const monthlySavings = projectedIncome - projectedExpense;
        projectedSavings += monthlySavings;

        const monthDate = new Date(startDate);
        monthDate.setMonth(monthDate.getMonth() + month);

        monthlyBreakdown.push({
          month: month,
          date: monthDate.toISOString().split('T')[0],
          income: Math.round(projectedIncome * 100) / 100,
          expenses: Math.round(projectedExpense * 100) / 100,
          savings: Math.round(monthlySavings * 100) / 100,
          totalSavings: Math.round(projectedSavings * 100) / 100
        });
      }

      projections[scenarioName] = {
        monthly_income: Math.round(avgIncome * 100) / 100,
        monthly_expenses: Math.round(avgExpense * 100) / 100,
        current_savings: totalSavings,
        monthly_breakdown: monthlyBreakdown
      };
    }

    res.json(projections);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar proyecciones' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, scenario, start_date, end_date,
      monthly_income_projection, monthly_expense_projection,
      monthly_savings_projection, monthly_breakdown
    } = req.body;

    const [projection] = await db('projections')
      .insert({
        name, scenario, start_date, end_date,
        monthly_income_projection, monthly_expense_projection,
        monthly_savings_projection, monthly_breakdown: JSON.stringify(monthly_breakdown),
        user_id: req.user.id
      })
      .returning('*');

    res.status(201).json(projection);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proyección' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db('projections').where({ id, user_id: req.user.id }).del();

    if (!deleted) {
      return res.status(404).json({ error: 'Proyección no encontrada' });
    }

    res.json({ message: 'Proyección eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyección' });
  }
});

module.exports = router;
