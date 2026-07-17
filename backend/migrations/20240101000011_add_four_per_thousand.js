exports.up = function(knex) {
  return knex.schema.table('expenses', table => {
    table.boolean('apply_four_per_thousand').defaultTo(false);
    table.decimal('four_per_thousand_amount', 12, 2).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('expenses', table => {
    table.dropColumn('apply_four_per_thousand');
    table.dropColumn('four_per_thousand_amount');
  });
};
