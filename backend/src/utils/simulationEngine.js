// Motor de simulación financiera (función pura, sin acceso a BD).
// Recibe la configuración del usuario y sus deudas reales activas, y devuelve
// la proyección mes a mes con saldo disponible/acumulado, más alertas y resumen.

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const fmt = (n) => copFormatter.format(Math.round(Number(n) || 0));

/**
 * Calcula la simulación.
 * @param {object} config  Configuración editable (ver routes/simulations.js).
 * @param {Array}  debts   Deudas activas del usuario (filas de la tabla `debts`).
 * @returns {{ months: Array, alerts: Array, summary: object }}
 */
function computeSimulation(config = {}, debts = []) {
  const {
    startMonth,
    horizonMonths = 12,
    baseIncome = 0,
    baseExpense = 0,
    startingBalance = 0,
    includeDebts = true,
    debtThreshold = null,
    allocations = {},
    overrides = {},
  } = config;

  const horizon = Math.max(1, Math.min(120, parseInt(horizonMonths, 10) || 12));
  const allocMode = allocations.mode === 'fixed' ? 'fixed' : 'percentage';
  const allocSavings = Math.max(0, Number(allocations.savings) || 0);
  const allocInvestment = Math.max(0, Number(allocations.investment) || 0);
  const allocEmergency = Math.max(0, Number(allocations.emergency) || 0);

  // Mes de inicio (formato "YYYY-MM"); por defecto, el mes actual.
  let startYear;
  let startMonthIdx;
  if (typeof startMonth === 'string' && /^\d{4}-\d{2}$/.test(startMonth)) {
    const [y, mo] = startMonth.split('-').map(Number);
    startYear = y;
    startMonthIdx = mo - 1;
  } else {
    const now = new Date();
    startYear = now.getFullYear();
    startMonthIdx = now.getMonth();
  }

  // Estado de amortización por deuda (misma lógica que reports.js/interest-projection).
  const debtState = (includeDebts ? debts : []).map((d) => ({
    name: d.name,
    balance: parseFloat(d.current_balance) || 0,
    monthlyRate: (parseFloat(d.interest_rate) || 0) / 100 / 12,
    payment: parseFloat(d.monthly_payment) || 0,
  }));

  const months = [];
  const alerts = [];
  let accumulated = parseFloat(startingBalance) || 0;
  let minBalance = Infinity;
  let totalIncome = 0;
  let totalExpense = 0;
  let totalAllocated = 0;
  let totalDebtPaid = 0;
  let totalDebtInterest = 0;
  let debtAlertRaised = false;

  for (let m = 0; m < horizon; m++) {
    const ov = overrides[m] || overrides[String(m)] || {};
    const income = round((parseFloat(baseIncome) || 0) + (parseFloat(ov.incomeDelta) || 0));
    const expense = round((parseFloat(baseExpense) || 0) + (parseFloat(ov.expenseDelta) || 0));

    // Cuotas de deuda del mes (amortización con interés + capital).
    let debtPayment = 0;
    let debtInterest = 0;
    for (const d of debtState) {
      if (d.balance <= 0 || d.payment <= 0) continue;
      const interest = d.balance * d.monthlyRate;
      let capital = d.payment - interest;
      let pay = d.payment;
      if (capital >= d.balance) {
        // Última cuota: solo se paga el saldo restante + su interés.
        capital = d.balance;
        pay = d.balance + interest;
      }
      d.balance = Math.max(0, d.balance - capital);
      debtPayment += pay;
      debtInterest += interest;
    }
    debtPayment = round(debtPayment);
    debtInterest = round(debtInterest);
    const remainingDebt = round(debtState.reduce((s, d) => s + d.balance, 0));

    const surplus = round(income - expense - debtPayment);

    // Asignaciones sobre el excedente positivo del mes.
    let savings = 0;
    let investment = 0;
    let emergency = 0;
    if (surplus > 0) {
      if (allocMode === 'percentage') {
        savings = round(surplus * allocSavings / 100);
        investment = round(surplus * allocInvestment / 100);
        emergency = round(surplus * allocEmergency / 100);
      } else {
        let avail = surplus;
        savings = round(Math.min(avail, allocSavings)); avail -= savings;
        investment = round(Math.min(avail, allocInvestment)); avail -= investment;
        emergency = round(Math.min(avail, allocEmergency)); avail -= emergency;
      }
    }
    const allocated = round(savings + investment + emergency);
    const available = round(surplus - allocated);
    accumulated = round(accumulated + available);

    if (accumulated < minBalance) minBalance = accumulated;
    totalIncome += income;
    totalExpense += expense;
    totalAllocated += allocated;
    totalDebtPaid += debtPayment;
    totalDebtInterest += debtInterest;

    const monthIdx = (startMonthIdx + m) % 12;
    const year = startYear + Math.floor((startMonthIdx + m) / 12);
    const monthName = MONTHS_ES[monthIdx];
    const label = `${monthName.slice(0, 3)} ${year}`;

    months.push({
      index: m,
      label,
      monthName,
      year,
      income,
      expense,
      debtPayment,
      debtInterest,
      savings,
      investment,
      emergency,
      allocated,
      available,
      accumulated,
      remainingDebt,
      note: ov.note || null,
    });

    // Alertas.
    if (available < 0 || accumulated < 0) {
      const which = available < 0 ? 'disponible' : 'acumulado';
      const amount = available < 0 ? available : accumulated;
      alerts.push({
        type: 'negative',
        monthIndex: m,
        label,
        message: `Saldo ${which} negativo en ${label}: ${fmt(amount)}`,
      });
    }
    if (
      debtThreshold != null && Number(debtThreshold) > 0 &&
      remainingDebt > Number(debtThreshold) && !debtAlertRaised
    ) {
      debtAlertRaised = true;
      alerts.push({
        type: 'debt',
        monthIndex: m,
        label,
        message: `La deuda total (${fmt(remainingDebt)}) supera el umbral de ${fmt(debtThreshold)} en ${label}`,
      });
    }
  }

  const summary = {
    horizonMonths: horizon,
    startingBalance: round(parseFloat(startingBalance) || 0),
    endBalance: accumulated,
    minBalance: months.length ? round(minBalance) : 0,
    totalIncome: round(totalIncome),
    totalExpense: round(totalExpense),
    totalAllocated: round(totalAllocated),
    totalDebtPaid: round(totalDebtPaid),
    totalDebtInterest: round(totalDebtInterest),
    finalDebt: months.length ? months[months.length - 1].remainingDebt : 0,
    alertCount: alerts.length,
    hasNegative: alerts.some((a) => a.type === 'negative'),
    exceedsDebtThreshold: alerts.some((a) => a.type === 'debt'),
  };

  return { months, alerts, summary };
}

module.exports = { computeSimulation, MONTHS_ES };
