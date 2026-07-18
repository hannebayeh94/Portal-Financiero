// Categorías base que se crean automáticamente al registrar un usuario.
const DEFAULT_CATEGORIES = [
  // Egresos
  { name: 'Alimentación', type: 'expense', color: '#F43F5E' },
  { name: 'Transporte', type: 'expense', color: '#F59E0B' },
  { name: 'Vivienda', type: 'expense', color: '#6D54E8' },
  { name: 'Servicios', type: 'expense', color: '#0EA5E9' },
  { name: 'Salud', type: 'expense', color: '#22C55E' },
  { name: 'Ocio', type: 'expense', color: '#A855F7' },
  { name: 'Educación', type: 'expense', color: '#3B82F6' },
  { name: 'Otros', type: 'expense', color: '#8A90A6' },
  // Ingresos
  { name: 'Salario', type: 'income', color: '#16A34A' },
  { name: 'Negocio', type: 'income', color: '#9333EA' },
  { name: 'Inversión', type: 'income', color: '#0EA5E9' },
  { name: 'Otros', type: 'income', color: '#8A90A6' },
];

// Inserta las categorías base para un usuario recién creado.
async function seedDefaultCategories(db, userId) {
  const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
  await db('categories').insert(rows);
}

module.exports = { DEFAULT_CATEGORIES, seedDefaultCategories };
