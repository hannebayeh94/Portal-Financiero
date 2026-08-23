const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

function monthsToPayOff(balance, annualRatePct, monthlyPayment) {
  const B = Number(balance);
  const P = Number(monthlyPayment);
  const r = (Number(annualRatePct) || 0) / 100 / 12;
  if (!B || !P || P <= r * B) return null;
  if (r === 0) return Math.ceil(B / P);
  return Math.ceil(-Math.log(1 - (r * B) / P) / Math.log(1 + r));
}

// GET /api/insights — observaciones proactivas del mes
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;

    const inPeriod = (col, month, year) =>
      `EXTRACT(MONTH FROM ${col}) = ${month} AND EXTRACT(YEAR FROM ${col}) = ${year}`;

    const [incomeNow, incomePrev, expNow, expPrev] = await Promise.all([
      db('incomes').where('user_id', req.user.id).whereRaw(inPeriod('date', m, y)).sum('amount as total').first(),
      db('incomes').where('user_id', req.user.id).whereRaw(inPeriod('date', prevMonth, prevYear)).sum('amount as total').first(),
      db('expenses').where('user_id', req.user.id).whereRaw(inPeriod('date', m, y)).sum('amount as total').first(),
      db('expenses').where('user_id', req.user.id).whereRaw(inPeriod('date', prevMonth, prevYear)).sum('amount as total').first(),
    ]);

    const totalIncome = parseFloat(incomeNow.total || 0);
    const totalExpenses = parseFloat(expNow.total || 0);
    const prevExpenses = parseFloat(expPrev.total || 0);

    const insights = [];

    // 1. Tendencia de gasto vs mes anterior
    if (prevExpenses > 0 && totalIncome >= 0) {
      const diffPct = Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100);
      if (diffPct >= 10) {
        insights.push({
          id: 'expense-up',
          type: 'warning',
          title: `Gastas ${diffPct}% más que el mes pasado`,
          detail: `Este mes llevas ${round(totalExpenses)} frente a ${round(prevExpenses)} del mes anterior.`,
        });
      } else if (diffPct <= -10) {
        insights.push({
          id: 'expense-down',
          type: 'positive',
          title: `Gastas ${Math.abs(diffPct)}% menos que el mes pasado`,
          detail: `Vas ${round(prevExpenses - totalExpenses)} por debajo del mes anterior. Buen ritmo.`,
        });
      }
    }

    // 2. Tasa de ahorro
    if (totalIncome > 0) {
      const rate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      if (rate >= 20) {
        insights.push({
          id: 'savings-rate-good',
          type: 'positive',
          title: `Tasa de ahorro del ${rate.toFixed(0)}%`,
          detail: 'Estás por encima del 20% recomendado. Excelente mes.',
        });
      } else if (rate < 0) {
        insights.push({
          id: 'deficit',
          type: 'warning',
          title: 'Estás gastando más de lo que ingresa',
          detail: `Balance negativo de ${round(totalIncome - totalExpenses)} este mes.`,
        });
      }
    }

    // 3. Categoría dominante del mes
    const byCategory = await db('expenses')
      .select('categories.name as category')
      .sum('expenses.amount as total')
      .leftJoin('categories', function () {
        this.on('expenses.category_id', '=', 'categories.id').andOn('categories.user_id', '=', req.user.id);
      })
      .where('expenses.user_id', req.user.id)
      .whereRaw(inPeriod('expenses.date', m, y))
      .groupBy('categories.name');

    if (byCategory.length > 0 && totalExpenses > 0) {
      const top = byCategory.sort((a, b) => parseFloat(b.total) - parseFloat(a.total))[0];
      const pct = Math.round((parseFloat(top.total) / totalExpenses) * 100);
      if (pct >= 30) {
        insights.push({
          id: 'top-category',
          type: 'info',
          title: `${top.category || 'Sin categoría'} concentra el ${pct}% de tus gastos`,
          detail: `${round(top.total)} de ${round(totalExpenses)} este mes.`,
        });
      }
    }

    // 4. Presupuestos sobregirados o cerca del límite
    const budgets = await db('budgets')
      .where('user_id', req.user.id)
      .whereRaw('month = ? AND year = ?', [m, y]);

    if (budgets.length > 0) {
      const catIds = budgets.map((b) => b.category_id);
      const spentRows = await db('expenses')
        .select('category_id')
        .sum('amount as spent')
        .where('user_id', req.user.id)
        .whereIn('category_id', catIds)
        .whereRaw(inPeriod('date', m, y))
        .groupBy('category_id');
      const spentBy = Object.fromEntries(spentRows.map((r) => [r.category_id, parseFloat(r.spent || 0)]));

      for (const b of budgets) {
        const limit = parseFloat(b.amount);
        const spent = spentBy[b.category_id] || 0;
        if (limit <= 0) continue;
        if (spent > limit) {
          insights.push({
            id: `budget-over-${b.id}`,
            type: 'warning',
            title: 'Presupuesto sobregirado',
            detail: `Te excediste por ${round(spent - limit)} en una categoría de este mes.`,
          });
        } else if (spent / limit >= 0.8) {
          insights.push({
            id: `budget-near-${b.id}`,
            type: 'info',
            title: 'Presupuesto casi agotado',
            detail: `Ya usaste el ${Math.round((spent / limit) * 100)}% de un presupuesto del mes.`,
          });
        }
      }
    }

    // 5. Consejo de pago de deudas (mejor candidata)
    const activeDebts = await db('debts')
      .where('user_id', req.user.id)
      .where('status', 'active');

    let bestTip = null;
    for (const d of activeDebts) {
      const base = monthsToPayOff(d.current_balance, d.interest_rate, d.monthly_payment);
      if (!base) continue;
      const extra = Math.max(round(parseFloat(d.monthly_payment) * 0.1), 10000);
      const accelerated = monthsToPayOff(d.current_balance, d.interest_rate, parseFloat(d.monthly_payment) + extra);
      if (!accelerated) continue;
      const saved = base - accelerated;
      if (saved >= 1 && (!bestTip || saved > bestTip.savedMonths)) {
        bestTip = { debtName: d.name, extra, savedMonths: saved };
      }
    }
    if (bestTip) {
      insights.push({
        id: 'debt-tip',
        type: 'tip',
        title: `Paga ${bestTip.extra} más al mes en "${bestTip.debtName}"`,
        detail: `Liquidarías la deuda ${bestTip.savedMonths} ${bestTip.savedMonths === 1 ? 'mes' : 'meses'} antes.`,
      });
    }

    // 6. Pagos próximos (7 días)
    const todayDay = now.getDate();
    const upcoming = activeDebts.filter((d) => {
      if (d.payment_day == null) return false;
      return d.payment_day >= todayDay && d.payment_day <= todayDay + 7;
    });
    if (upcoming.length > 0) {
      const names = upcoming.slice(0, 2).map((d) => d.name).join(', ');
      insights.push({
        id: 'upcoming-payments',
        type: 'info',
        title: upcoming.length === 1 ? `Pago de "${names}" próximo` : `${upcoming.length} pagos próximos esta semana`,
        detail: upcoming.length === 1
          ? `Vence el día ${upcoming[0].payment_day} del mes.`
          : `Incluye: ${names}.`,
      });
    }

    res.json({ insights, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error generando insights:', error);
    res.status(500).json({ error: 'Error al generar insights' });
  }
});

module.exports = router;
