exports.up = function(knex) {
  return knex.schema.alterTable('debts', table => {
    table.integer('cut_day').nullable(); // día de corte (1-31); el ciclo va de un corte al siguiente
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('debts', table => {
    table.dropColumn('cut_day');
  });
};
