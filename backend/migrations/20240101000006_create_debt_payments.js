exports.up = function(knex) {
  return knex.schema.createTable('debt_payments', table => {
    table.increments('id').primary();
    table.integer('debt_id').unsigned().references('id').inTable('debts').onDelete('CASCADE');
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('capital_portion', 12, 2).notNullable();
    table.decimal('interest_portion', 12, 2).notNullable();
    table.date('payment_date').notNullable();
    table.decimal('remaining_balance', 12, 2).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('debt_payments');
};
