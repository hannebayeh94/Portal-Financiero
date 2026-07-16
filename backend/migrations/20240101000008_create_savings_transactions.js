exports.up = function(knex) {
  return knex.schema.createTable('savings_transactions', table => {
    table.increments('id').primary();
    table.integer('savings_id').unsigned().references('id').inTable('savings').onDelete('CASCADE');
    table.decimal('amount', 12, 2).notNullable();
    table.enum('type', ['deposit', 'withdrawal', 'interest']).notNullable();
    table.date('date').notNullable();
    table.string('description').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('savings_transactions');
};
