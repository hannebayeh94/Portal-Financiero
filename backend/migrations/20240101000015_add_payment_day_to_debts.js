exports.up = function(knex) {
  return knex.schema.alterTable('debts', table => {
    table.integer('payment_day').nullable(); // día del mes (1-31) en que vence la cuota
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('debts', table => {
    table.dropColumn('payment_day');
  });
};
