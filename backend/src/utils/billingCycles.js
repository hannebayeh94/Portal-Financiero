// Módulo reutilizable de ciclos de corte (fecha de corte / fecha de pago).
// Funciones puras, sin acceso a BD: reutilizable por el módulo de deudas, el
// simulador y cualquier otro módulo que trabaje créditos/tarjetas por ciclo.
//
// Modelo: un ciclo va del día de corte de un mes al día anterior al siguiente
// corte (ej. corte 10 → 10-jul..09-ago). El pago vence en `dueDay` (día de pago),
// en la próxima ocurrencia en/después del cierre (ej. 20-ago).

const MONTHS_ES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Último día del mes (monthIdx 0-11).
function lastDayOfMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

// Ajusta un día (1-31) al último día válido del mes (31 → 28/30 según corresponda).
function clampDay(year, monthIdx, day) {
  const d = Math.min(Math.max(parseInt(day, 10) || 1, 1), 31);
  return Math.min(d, lastDayOfMonth(year, monthIdx));
}

// Tasa periódica mensual a partir de una tasa anual en %.
function periodicRate(annualRatePct) {
  return (parseFloat(annualRatePct) || 0) / 100 / 12;
}

// Normaliza cualquier valor a un Date a medianoche local.
function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function label(d) {
  return `${MONTHS_ES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// Próxima ocurrencia de `dueDay` en/después de `fromDate`.
function nextDueOnOrAfter(fromDate, dueDay) {
  const y = fromDate.getFullYear();
  const m = fromDate.getMonth();
  const candidate = new Date(y, m, clampDay(y, m, dueDay));
  if (candidate >= fromDate) return candidate;
  const nm = new Date(y, m + 1, 1);
  return new Date(nm.getFullYear(), nm.getMonth(), clampDay(nm.getFullYear(), nm.getMonth(), dueDay));
}

/**
 * Construye `count` ciclos de corte.
 * @param {object} opts
 * @param {number} [opts.cutDay]     Día de corte (1-31). Sin él → ciclos mensuales calendario.
 * @param {number} [opts.dueDay]     Día de pago (1-31).
 * @param {number} [opts.count]      Número de ciclos a generar (default 12).
 * @param {Date|string} [opts.anchorDate]  Fecha ancla; el primer ciclo contiene esta fecha.
 * @returns {Array<{index,cutStart,cutEnd,dueDate,label}>}  Fechas en ISO "YYYY-MM-DD".
 */
function buildCycles({ cutDay, dueDay, count = 12, anchorDate } = {}) {
  const n = Math.max(1, Math.min(120, parseInt(count, 10) || 12));
  const anchor = toDate(anchorDate || new Date());
  const cycles = [];

  // Fallback sin día de corte: ciclos mensuales calendario alineados al día de pago.
  if (!cutDay) {
    let y = anchor.getFullYear();
    let m = anchor.getMonth();
    for (let i = 0; i < n; i++) {
      const cutStart = new Date(y, m, 1);
      const cutEnd = new Date(y, m, lastDayOfMonth(y, m));
      const dueDate = dueDay
        ? new Date(y, m, clampDay(y, m, dueDay))
        : cutEnd;
      cycles.push({
        index: i,
        cutStart: isoDate(cutStart),
        cutEnd: isoDate(cutEnd),
        dueDate: isoDate(dueDate),
        label: label(cutStart),
      });
      const nm = new Date(y, m + 1, 1);
      y = nm.getFullYear();
      m = nm.getMonth();
    }
    return cycles;
  }

  // Modelo corte + pago. El primer corte es el más reciente en/antes del ancla,
  // de modo que el ancla caiga dentro del primer ciclo.
  let firstCut = new Date(anchor.getFullYear(), anchor.getMonth(), clampDay(anchor.getFullYear(), anchor.getMonth(), cutDay));
  if (firstCut > anchor) {
    const pm = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
    firstCut = new Date(pm.getFullYear(), pm.getMonth(), clampDay(pm.getFullYear(), pm.getMonth(), cutDay));
  }

  let y = firstCut.getFullYear();
  let m = firstCut.getMonth();
  for (let i = 0; i < n; i++) {
    const cutStart = new Date(y, m, clampDay(y, m, cutDay));
    const nmDate = new Date(y, m + 1, 1);
    const ny = nmDate.getFullYear();
    const nmo = nmDate.getMonth();
    const nextCut = new Date(ny, nmo, clampDay(ny, nmo, cutDay));
    const cutEnd = addDays(nextCut, -1);
    const dueDate = nextDueOnOrAfter(cutEnd, dueDay || cutDay);
    cycles.push({
      index: i,
      cutStart: isoDate(cutStart),
      cutEnd: isoDate(cutEnd),
      dueDate: isoDate(dueDate),
      label: label(cutEnd),
    });
    y = ny;
    m = nmo;
  }
  return cycles;
}

/**
 * Agrupa movimientos en la ventana [cutStart, cutEnd] de cada ciclo.
 * @param {Array} cycles      Salida de buildCycles.
 * @param {Array} movements   Cada uno con { date, amount, type: 'charge'|'payment' }.
 * @returns {Array<Array>}    Movimientos por ciclo (paralelo a `cycles`).
 */
function assignMovementsToCycles(cycles, movements = []) {
  return cycles.map((c) => {
    const start = toDate(c.cutStart);
    const end = toDate(c.cutEnd);
    return (movements || []).filter((mv) => {
      const d = toDate(mv.date);
      return d >= start && d <= end;
    });
  });
}

/**
 * Consolida cada ciclo encadenando el saldo:
 *   interés = saldo inicial × tasa periódica
 *   saldo cierre = saldo inicial + interés + consumos − abonos
 * @returns {Array}  Ciclos con { openingBalance, interest, charges, payments, closingBalance, movements }.
 */
function consolidateCycles({ openingBalance = 0, monthlyRate = 0, cycles = [], movementsByCycle = [] }) {
  let opening = round(openingBalance);
  return cycles.map((c, i) => {
    const movs = movementsByCycle[i] || [];
    const charges = round(movs.filter((m) => m.type === 'charge').reduce((s, m) => s + (parseFloat(m.amount) || 0), 0));
    const payments = round(movs.filter((m) => m.type !== 'charge').reduce((s, m) => s + (parseFloat(m.amount) || 0), 0));
    const interest = round(opening * monthlyRate);
    const closingRaw = opening + interest + charges - payments;
    const closingBalance = Math.max(0, round(closingRaw));
    const row = {
      ...c,
      openingBalance: round(opening),
      interest,
      charges,
      payments,
      closingBalance,
      movements: movs,
    };
    opening = closingBalance;
    return row;
  });
}

module.exports = {
  MONTHS_ES_SHORT,
  clampDay,
  lastDayOfMonth,
  periodicRate,
  buildCycles,
  assignMovementsToCycles,
  consolidateCycles,
};
