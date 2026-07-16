exports.up = function(knex) {
  return knex.schema.createTable('debts', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.decimal('total_amount', 12, 2).notNullable();
    table.decimal('current_balance', 12, 2).notNullable();
    table.decimal('interest_rate', 5, 2).notNullable();
    table.enum('interest_type', ['fixed', 'variable']).defaultTo('fixed');
    table.decimal('monthly_payment', 12, 2).notNullable();
    table.integer('term_months').notNullable();
    table.integer('remaining_months').notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.string('bank_or_lender').notNullable();
    table.enum('status', ['active', 'paid', 'defaulted']).defaultTo('active');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('debts');
};
