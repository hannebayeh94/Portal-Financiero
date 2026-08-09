exports.up = async function(knex) {
  // Índices en user_id: todas las queries filtran por él y no había ninguno.
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_projections_user_id ON projections (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations (user_id)');
  // Índices en FKs (PostgreSQL no indexa FKs automáticamente).
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments (debt_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_savings_transactions_savings_id ON savings_transactions (savings_id)');

  // CHECK constraints de integridad (datos existentes ya verificados limpios).
  await knex.raw('ALTER TABLE incomes ADD CONSTRAINT incomes_amount_positive CHECK (amount > 0)');
  await knex.raw('ALTER TABLE expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0)');
  await knex.raw('ALTER TABLE debts ADD CONSTRAINT debts_balance_non_negative CHECK (total_amount >= 0 AND current_balance >= 0)');
  await knex.raw('ALTER TABLE debts ADD CONSTRAINT debts_payment_valid CHECK (monthly_payment >= 0 AND interest_rate >= 0)');
  await knex.raw('ALTER TABLE debts ADD CONSTRAINT debts_payment_day_valid CHECK (payment_day IS NULL OR (payment_day >= 1 AND payment_day <= 31))');
  await knex.raw('ALTER TABLE debts ADD CONSTRAINT debts_cut_day_valid CHECK (cut_day IS NULL OR (cut_day >= 1 AND cut_day <= 31))');
  await knex.raw('ALTER TABLE budgets ADD CONSTRAINT budgets_amount_positive CHECK (amount > 0)');
  await knex.raw('ALTER TABLE budgets ADD CONSTRAINT budgets_month_valid CHECK (month >= 1 AND month <= 12)');
  await knex.raw('ALTER TABLE savings ADD CONSTRAINT savings_balance_non_negative CHECK (current_balance >= 0)');
  await knex.raw('ALTER TABLE debt_payments ADD CONSTRAINT debt_payments_amount_positive CHECK (amount > 0)');
  await knex.raw('ALTER TABLE savings_transactions ADD CONSTRAINT savings_transactions_amount_positive CHECK (amount > 0)');

  // categories.user_id NOT NULL (verificado: no hay NULLs actuales).
  await knex.raw('ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL');
};

exports.down = async function(knex) {
  await knex.raw('ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL');
  await knex.raw('ALTER TABLE savings_transactions DROP CONSTRAINT IF EXISTS savings_transactions_amount_positive');
  await knex.raw('ALTER TABLE debt_payments DROP CONSTRAINT IF EXISTS debt_payments_amount_positive');
  await knex.raw('ALTER TABLE savings DROP CONSTRAINT IF EXISTS savings_balance_non_negative');
  await knex.raw('ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_month_valid');
  await knex.raw('ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_amount_positive');
  await knex.raw('ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_cut_day_valid');
  await knex.raw('ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_payment_day_valid');
  await knex.raw('ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_payment_valid');
  await knex.raw('ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_balance_non_negative');
  await knex.raw('ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_amount_positive');
  await knex.raw('ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_amount_positive');
  await knex.raw('DROP INDEX IF EXISTS idx_savings_transactions_savings_id');
  await knex.raw('DROP INDEX IF EXISTS idx_debt_payments_debt_id');
  await knex.raw('DROP INDEX IF EXISTS idx_simulations_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_projections_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_savings_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_debts_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_expenses_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_incomes_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_budgets_user_id');
  await knex.raw('DROP INDEX IF EXISTS idx_categories_user_id');
};
