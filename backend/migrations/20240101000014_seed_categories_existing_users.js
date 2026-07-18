const { DEFAULT_CATEGORIES } = require('../src/utils/defaultCategories');

// Backfill: crea las categorías base para usuarios que aún no tienen ninguna.
exports.up = async function(knex) {
  const users = await knex('users').select('id');
  for (const user of users) {
    const existing = await knex('categories').where('user_id', user.id).first();
    if (!existing) {
      const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id }));
      await knex('categories').insert(rows);
    }
  }
};

exports.down = function() {
  // No revertir el backfill (no se puede distinguir de categorías creadas por el usuario).
  return Promise.resolve();
};
