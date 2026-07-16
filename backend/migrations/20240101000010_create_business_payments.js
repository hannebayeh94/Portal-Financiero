exports.up = function(knex) {
  return knex.schema.createTable('business_payments', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.date('date').notNullable();
    table.enum('type', ['recurring', 'one_time']).defaultTo('one_time');
    table.enum('frequency', ['monthly', 'weekly', 'yearly', 'quarterly']).nullable();
    table.string('category').nullable();
    table.string('notes').nullable();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('business_payments');
};
