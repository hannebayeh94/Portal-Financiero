exports.up = function(knex) {
  return knex.schema.alterTable('debt_payments', table => {
    table.enum('type', ['payment', 'charge']).notNullable().defaultTo('payment');
    table.string('description');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('debt_payments', table => {
    table.dropColumn('type');
    table.dropColumn('description');
  });
};
