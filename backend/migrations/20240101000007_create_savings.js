exports.up = function(knex) {
  return knex.schema.createTable('savings', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('bank').notNullable();
    table.decimal('current_balance', 12, 2).notNullable();
    table.decimal('goal_amount', 12, 2).nullable();
    table.decimal('interest_rate', 5, 2).defaultTo(0);
    table.enum('type', ['standard', 'goal', 'investment']).defaultTo('standard');
    table.date('start_date').notNullable();
    table.boolean('active').defaultTo(true);
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('savings');
};
