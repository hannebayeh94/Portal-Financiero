// Motor preciso de tarjeta de crédito (función pura, sin acceso a BD).
//
// Modela compras cuotificadas tal como las factura una tarjeta (RappiCard/Davivienda):
//   - Método "capital fijo": cada mes se abona el mismo capital (monto / n) y el
//     interés se calcula sobre el saldo insoluto -> la cuota es decreciente.
//   - Método "cuota fija" (anualidad francesa): la cuota es constante.
//
// Permite combinar varias compras (unas ya en curso con cuotas pagadas y otras
// nuevas) y devuelve el calendario mes a mes agregado, el resumen por compra y la
// comparación entre ambos métodos.
//
// Entrada (config):
//   {
//     method: 'linear' | 'annuity',      // método principal a detallar
//     firstDueDate: 'YYYY-MM-DD',        // fecha del primer pago (mes 1)
//     purchases: [
//       {
//         description,
//         totalAmount, totalInstallments, paidInstallments, monthlyRate, // % mes vencido
//         // Alternativa avanzada (tiene prioridad): saldo pendiente directo
//         pendingCapital, remainingMonths,
//       }
//     ]
//   }

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function toDate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Suma meses conservando el día (con tope al último día del mes destino).
function addMonths(date, n) {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
}

function monthLabel(date) {
  return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

// Normaliza una compra: cuánto capital queda por facturar y cuántos meses faltan.
function normalizePurchase(p = {}, index = 0) {
  const description = String(p.description || p.name || `Compra ${index + 1}`).trim() || `Compra ${index + 1}`;
  const totalAmount = Math.max(0, num(p.totalAmount ?? p.total_amount ?? p.amount));
  const totalInstallments = clampInt(p.totalInstallments ?? p.installments ?? p.months, 1, 600, 1);
  const paidInstallments = clampInt(p.paidInstallments ?? p.paid, 0, totalInstallments, 0);
  const monthlyRatePct = Math.max(0, num(p.monthlyRate ?? p.rate ?? p.tasa));
  const monthlyRate = monthlyRatePct / 100;

  let pendingCapital = Math.max(0, num(p.pendingCapital ?? p.pending));
  let remaining;

  if (pendingCapital > 0) {
    // Modo avanzado: el usuario ya conoce el capital pendiente por facturar.
    remaining = clampInt(p.remainingMonths ?? p.remaining, 1, 600, Math.max(1, totalInstallments - paidInstallments));
  } else {
    remaining = totalInstallments - paidInstallments;
    if (totalAmount > 0 && remaining > 0) {
      pendingCapital = (totalAmount / totalInstallments) * remaining;
    }
  }

  const perMonth = remaining > 0 ? pendingCapital / remaining : 0;

  return {
    index,
    description,
    totalAmount: round(totalAmount),
    totalInstallments,
    paidInstallments,
    remaining,
    perMonth: round(perMonth),
    pendingCapital: round(pendingCapital),
    monthlyRate,
    monthlyRatePct,
  };
}

// Calendario de una compra (sin redondear, para agregar con precisión).
function buildSchedule(purchase, method) {
  const { remaining, pendingCapital, perMonth, monthlyRate: r } = purchase;
  const rows = [];
  let balance = pendingCapital;
  let fixed = 0;
  if (method === 'annuity' && remaining > 0) {
    fixed = r === 0 ? pendingCapital / remaining : (pendingCapital * r) / (1 - Math.pow(1 + r, -remaining));
  }

  for (let t = 1; t <= remaining; t++) {
    const interest = balance * r;
    let capital;
    let payment;
    if (method === 'annuity') {
      payment = fixed;
      capital = payment - interest;
      if (capital >= balance) {
        capital = balance;
        payment = balance + interest;
      }
    } else {
      capital = Math.min(perMonth, balance);
      payment = capital + interest;
    }
    balance = Math.max(0, balance - capital);
    rows.push({ month: t, capital, interest, payment, balance });
  }
  return rows;
}

function computeForMethod(purchases, method, firstDueDate) {
  const withSchedules = purchases.map((p) => ({ purchase: p, schedule: buildSchedule(p, method) }));
  const maxMonths = withSchedules.reduce((m, s) => Math.max(m, s.schedule.length), 0);

  const months = [];
  for (let t = 1; t <= maxMonths; t++) {
    let capital = 0;
    let interest = 0;
    let balance = 0;
    for (const s of withSchedules) {
      const row = s.schedule[t - 1];
      if (row) {
        capital += row.capital;
        interest += row.interest;
        balance += row.balance;
      }
    }
    const dueDate = firstDueDate ? addMonths(firstDueDate, t - 1) : null;
    months.push({
      month: t,
      label: dueDate ? monthLabel(dueDate) : `Mes ${t}`,
      dueDate: dueDate ? isoDate(dueDate) : null,
      capital: round(capital),
      interest: round(interest),
      payment: round(capital + interest),
      balance: round(balance),
    });
  }

  const pendingCapital = round(purchases.reduce((s, p) => s + p.pendingCapital, 0));
  const totalInterest = round(months.reduce((s, m) => s + m.interest, 0));
  const totalToPay = round(pendingCapital + totalInterest);

  return {
    method,
    summary: {
      pendingCapital,
      nextPayment: months[0] ? months[0].payment : 0,
      totalInterest,
      totalToPay,
      purchaseCount: purchases.length,
      maxMonths,
    },
    months,
    purchases: withSchedules.map((s) => ({
      ...s.purchase,
      schedule: s.schedule.map((row) => ({
        month: row.month,
        capital: round(row.capital),
        interest: round(row.interest),
        payment: round(row.payment),
        balance: round(row.balance),
      })),
    })),
  };
}

/**
 * Calcula el plan de la tarjeta para ambos métodos y detalla el elegido.
 * @returns {{ method, firstDueDate, results: { linear, annuity }, comparison }}
 */
function computeCreditCardPlan(config = {}) {
  const method = config.method === 'annuity' ? 'annuity' : 'linear';
  const firstDueDate = toDate(config.firstDueDate);
  const rawPurchases = Array.isArray(config.purchases) ? config.purchases : [];
  const purchases = rawPurchases.map((p, i) => normalizePurchase(p, i));

  const linear = computeForMethod(purchases, 'linear', firstDueDate);
  const annuity = computeForMethod(purchases, 'annuity', firstDueDate);

  const comparison = {
    linear: {
      nextPayment: linear.summary.nextPayment,
      totalToPay: linear.summary.totalToPay,
      totalInterest: linear.summary.totalInterest,
    },
    annuity: {
      nextPayment: annuity.summary.nextPayment,
      totalToPay: annuity.summary.totalToPay,
      totalInterest: annuity.summary.totalInterest,
    },
    lowerInterest: linear.summary.totalInterest <= annuity.summary.totalInterest ? 'linear' : 'annuity',
  };

  return {
    method,
    firstDueDate: firstDueDate ? isoDate(firstDueDate) : null,
    results: { linear, annuity },
    comparison,
  };
}

module.exports = { computeCreditCardPlan, buildSchedule, normalizePurchase, addMonths, MONTHS_ES };
