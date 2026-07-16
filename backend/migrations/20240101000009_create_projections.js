exports.up = function(knex) {
  return knex.schema.createTable('projections', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.enum('scenario', ['optimistic', 'conservative', 'realistic']).defaultTo('realistic');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('monthly_income_projection', 12, 2).notNullable();
    table.decimal('monthly_expense_projection', 12, 2).notNullable();
    table.decimal('monthly_savings_projection', 12, 2).notNullable();
    table.json('monthly_breakdown').nullable();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('projections');
};
