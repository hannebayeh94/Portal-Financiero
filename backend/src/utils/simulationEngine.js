// Motor de simulación financiera (función pura, sin acceso a BD).
// Recibe la configuración del usuario y sus deudas reales activas, y devuelve
// la proyección mes a mes con saldo disponible/acumulado, más alertas y resumen.

const { buildCycles } = require('./billingCycles');

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
    recurringExpense = 0,
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

  // Estado de amortización por deuda (misma lógica que reports.js/interest-projection),
  // ahora con día de corte y día de pago para segmentar por ciclo.
  const debtState = (includeDebts ? debts : []).map((d) => ({
    name: d.name,
    balance: parseFloat(d.current_balance) || 0,
    monthlyRate: (parseFloat(d.interest_rate) || 0) / 100 / 12,
    payment: parseFloat(d.monthly_payment) || 0,
    cutDay: d.cut_day || null,
    dueDay: d.payment_day || null,
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

  let savedAccumulated = 0; // Total apartado (ahorro + inversión + emergencias) acumulado.

  // Un override define el valor ABSOLUTO de ingreso/gasto de ese mes; si no hay
  // override, se usa el valor base. `expense` es SOLO gasto operativo (la cuota de
  // deuda se calcula aparte y NO debe incluirse aquí, para no contarla dos veces).
  const pickValue = (ov, key, base) => {
    const v = ov[key];
    if (v === null || v === undefined || v === '') return parseFloat(base) || 0;
    return parseFloat(v) || 0;
  };

  // El gasto base mensual es la suma de dos componentes distintos: los gastos
  // NO recurrentes (baseExpense) + los egresos recurrentes fijos seleccionados
  // (recurringExpense). La cuota de deuda va aparte y no se incluye aquí.
  const baseExpenseTotal = (parseFloat(baseExpense) || 0) + (parseFloat(recurringExpense) || 0);

  // --- Amortización por CICLO DE CORTE ---------------------------------------
  // Para cada deuda se construye su calendario de ciclos a lo largo del horizonte.
  // Cada ciclo genera interés (saldo × tasa) y su cuota vence en `dueDate`, que se
  // asigna al mes calendario correspondiente del flujo de caja. Deudas sin día de
  // corte caen al modo mensual calendario (compatibilidad con el comportamiento previo).
  const simStart = new Date(startYear, startMonthIdx, 1);
  const monthsDiff = (toIso) => {
    const t = new Date(toIso);
    return (t.getFullYear() - simStart.getFullYear()) * 12 + (t.getMonth() - simStart.getMonth());
  };

  const monthlyDebtPayment = new Array(horizon).fill(0);
  const monthlyDebtInterest = new Array(horizon).fill(0);
  const remainingByMonth = new Array(horizon).fill(0);
  const debtCycles = []; // Detalle consolidado por deuda.
  const cycleAgg = new Map(); // label -> { label, dueDate, interest, payment } (agregado entre deudas).

  for (const d of debtState) {
    const cycles = buildCycles({
      cutDay: d.cutDay,
      dueDay: d.dueDay,
      count: horizon + 2,
      anchorDate: simStart,
    });

    const balByMonth = new Array(horizon).fill(null);
    let bal = d.balance;
    const rows = [];

    for (const c of cycles) {
      if (bal <= 0 || d.payment <= 0) break;
      const opening = bal;
      const interest = opening * d.monthlyRate;
      let capital = d.payment - interest;
      let pay = d.payment;
      if (capital >= opening) {
        // Última cuota: se salda el resto + su interés.
        capital = opening;
        pay = opening + interest;
      }
      if (capital < 0) capital = 0; // El interés supera la cuota: no se abona capital.
      bal = Math.max(0, opening - capital);

      const mi = monthsDiff(c.dueDate);
      if (mi >= 0 && mi < horizon) {
        monthlyDebtPayment[mi] += pay;
        monthlyDebtInterest[mi] += interest;
        balByMonth[mi] = bal;
        const agg = cycleAgg.get(c.label) || { label: c.label, dueDate: c.dueDate, interest: 0, payment: 0 };
        agg.interest += interest;
        agg.payment += pay;
        cycleAgg.set(c.label, agg);
      }

      rows.push({
        label: c.label,
        cutStart: c.cutStart,
        cutEnd: c.cutEnd,
        dueDate: c.dueDate,
        openingBalance: round(opening),
        interest: round(interest),
        capital: round(capital),
        payment: round(pay),
        closingBalance: round(bal),
      });
    }

    // Rellenar hacia adelante el saldo restante de la deuda mes a mes.
    let last = round(d.balance);
    for (let m = 0; m < horizon; m++) {
      if (balByMonth[m] == null) balByMonth[m] = last;
      else last = round(balByMonth[m]);
      remainingByMonth[m] = round(remainingByMonth[m] + balByMonth[m]);
    }

    debtCycles.push({ name: d.name, cycles: rows });
  }

  for (let m = 0; m < horizon; m++) {
    const ov = overrides[m] || overrides[String(m)] || {};
    const income = round(pickValue(ov, 'income', baseIncome));
    const expense = round(pickValue(ov, 'expense', baseExpenseTotal));

    // Cuotas de deuda del mes (precalculadas por ciclo de corte, asignadas al mes
    // calendario del vencimiento de cada ciclo).
    const debtPayment = round(monthlyDebtPayment[m]);
    const debtInterest = round(monthlyDebtInterest[m]);
    const remainingDebt = round(remainingByMonth[m]);

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
    const outflow = round(expense + debtPayment); // Total salidas obligatorias del mes.
    const available = round(surplus - allocated);
    accumulated = round(accumulated + available);
    savedAccumulated = round(savedAccumulated + allocated);

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
      outflow,
      surplus,
      savings,
      investment,
      emergency,
      allocated,
      available,
      accumulated,
      savedAccumulated,
      remainingDebt,
      overridden: ov.income != null && ov.income !== '' || ov.expense != null && ov.expense !== '',
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
    savedEndBalance: round(savedAccumulated),
    totalDebtPaid: round(totalDebtPaid),
    totalDebtInterest: round(totalDebtInterest),
    finalDebt: months.length ? months[months.length - 1].remainingDebt : 0,
    alertCount: alerts.length,
    hasNegative: alerts.some((a) => a.type === 'negative'),
    exceedsDebtThreshold: alerts.some((a) => a.type === 'debt'),
    byCycle: Array.from(cycleAgg.values())
      .map((c) => ({ label: c.label, dueDate: c.dueDate, interest: round(c.interest), payment: round(c.payment) }))
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0)),
  };

  return { months, alerts, summary, debtCycles };
}

module.exports = { computeSimulation, MONTHS_ES };
