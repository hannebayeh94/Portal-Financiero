exports.up = function(knex) {
  return knex.schema.createTable('incomes', table => {
    table.increments('id').primary();
    table.decimal('amount', 12, 2).notNullable();
    table.string('description').notNullable();
    table.date('date').notNullable();
    table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('SET NULL');
    table.enum('source', ['salary', 'business', 'investment', 'other']).defaultTo('salary');
    table.boolean('recurring').defaultTo(false);
    table.enum('recurrence_type', ['monthly', 'weekly', 'yearly']).nullable();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('incomes');
};
