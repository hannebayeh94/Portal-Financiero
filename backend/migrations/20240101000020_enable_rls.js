// RLS sin policies: bloquea todo acceso de los roles anon/authenticated de
// Supabase (PostgREST). El backend se conecta como rol postgres (superuser),
// que hace bypass de RLS, por lo que el comportamiento de la API no cambia.
// Protege contra exposición de datos si se filtra la anon key.
exports.up = async function(knex) {
  const tables = [
    'users',
    'categories',
    'budgets',
    'incomes',
    'expenses',
    'debts',
    'debt_payments',
    'savings',
    'savings_transactions',
    'projections',
    'simulations',
    'business_payments',
  ];
  for (const t of tables) {
    await knex.raw(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
  }
};

exports.down = async function(knex) {
  const tables = [
    'users',
    'categories',
    'budgets',
    'incomes',
    'expenses',
    'debts',
    'debt_payments',
    'savings',
    'savings_transactions',
    'projections',
    'simulations',
    'business_payments',
  ];
  for (const t of tables) {
    await knex.raw(`ALTER TABLE ${t} DISABLE ROW LEVEL SECURITY`);
  }
};
