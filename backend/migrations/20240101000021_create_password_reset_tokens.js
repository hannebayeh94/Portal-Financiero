exports.up = function(knex) {
  return knex.schema.createTable('password_reset_tokens', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('code_hash').notNullable().index();
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.integer('attempts').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('password_reset_tokens');
};
