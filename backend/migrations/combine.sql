-- 01_users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 02_categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(255) DEFAULT '#3B82F6',
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 03_incomes
CREATE TABLE IF NOT EXISTS incomes (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  source VARCHAR(50) DEFAULT 'salary' CHECK (source IN ('salary', 'business', 'investment', 'other')),
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_type VARCHAR(50) CHECK (recurrence_type IN ('monthly', 'weekly', 'yearly')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 04_expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'variable' CHECK (type IN ('fixed', 'variable')),
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_type VARCHAR(50) CHECK (recurrence_type IN ('monthly', 'weekly', 'yearly')),
  apply_four_per_thousand BOOLEAN DEFAULT FALSE,
  four_per_thousand_amount NUMERIC(12,2),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 05_debts
CREATE TABLE IF NOT EXISTS debts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  interest_type VARCHAR(50) DEFAULT 'fixed' CHECK (interest_type IN ('fixed', 'variable')),
  monthly_payment NUMERIC(12,2) NOT NULL,
  term_months INTEGER NOT NULL,
  remaining_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  bank_or_lender VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paid', 'defaulted')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 06_debt_payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id SERIAL PRIMARY KEY,
  debt_id INTEGER REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  capital_portion NUMERIC(12,2) NOT NULL,
  interest_portion NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  remaining_balance NUMERIC(12,2) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'payment' CHECK (type IN ('payment', 'charge')),
  description VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 07_savings
CREATE TABLE IF NOT EXISTS savings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bank VARCHAR(255) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  goal_amount NUMERIC(12,2),
  interest_rate NUMERIC(5,2) DEFAULT 0,
  type VARCHAR(50) DEFAULT 'standard' CHECK (type IN ('standard', 'goal', 'investment')),
  start_date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 08_savings_transactions
CREATE TABLE IF NOT EXISTS savings_transactions (
  id SERIAL PRIMARY KEY,
  savings_id INTEGER REFERENCES savings(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'interest')),
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 09_projections
CREATE TABLE IF NOT EXISTS projections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  scenario VARCHAR(50) DEFAULT 'realistic' CHECK (scenario IN ('optimistic', 'conservative', 'realistic')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_income_projection NUMERIC(12,2) NOT NULL,
  monthly_expense_projection NUMERIC(12,2) NOT NULL,
  monthly_savings_projection NUMERIC(12,2) NOT NULL,
  monthly_breakdown JSONB,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10_business_payments
CREATE TABLE IF NOT EXISTS business_payments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'one_time' CHECK (type IN ('recurring', 'one_time')),
  frequency VARCHAR(50) CHECK (frequency IN ('monthly', 'weekly', 'yearly', 'quarterly')),
  category VARCHAR(255),
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
