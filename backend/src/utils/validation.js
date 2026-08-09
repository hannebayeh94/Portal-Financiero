function isPositiveNumber(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) && num > 0;
}

function normalizeMonths(value, { min = 1, max = 120 } = {}) {
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) return null;
  return Math.max(min, Math.min(max, num));
}

// Verifica que la categoría exista y pertenezca al usuario. null/undefined se
// permiten (la FK de categories es nullable) y devuelven true.
async function categoryBelongsToUser(db, userId, categoryId) {
  if (categoryId == null || categoryId === '') return true;
  const category = await db('categories')
    .where({ id: categoryId, user_id: userId })
    .first();
  return !!category;
}

module.exports = {
  isPositiveNumber,
  normalizeMonths,
  categoryBelongsToUser,
};
