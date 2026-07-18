exports.up = function(knex) {
  return knex.schema.createTable('budgets', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('CASCADE');
    table.decimal('amount', 12, 2).notNullable();
    table.integer('month').notNullable();
    table.integer('year').notNullable();
    table.timestamps(true, true);
    table.unique(['user_id', 'category_id', 'month', 'year']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('budgets');
};
