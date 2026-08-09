// Log estructurado de operaciones financieras (sin datos sensibles).
function logFinancial(userId, action, details = {}) {
  const entry = {
    type: 'financial',
    ts: new Date().toISOString(),
    userId,
    action,
  };
  if (details && typeof details === 'object') {
    Object.assign(entry, details);
  }
  console.log(JSON.stringify(entry));
}

module.exports = { logFinancial };
