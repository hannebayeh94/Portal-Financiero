import { View, Text, TouchableOpacity } from 'react-native'
import { clay, colors } from '../theme'

// Selector de categoría en forma de chips. `value` es el id (o null).
// `allowNone` muestra el chip "Sin categoría" (por defecto true).
export default function CategoryPicker({ label = 'Categoría', categories = [], value, onChange, allowNone = true }) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: clay.textMuted, letterSpacing: 0.2, marginBottom: 7, marginLeft: 2 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {allowNone && <Chip label="Sin categoría" active={value == null} onPress={() => onChange(null)} />}
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} color={c.color} active={value === c.id} onPress={() => onChange(c.id)} />
        ))}
      </View>
    </View>
  )
}

function Chip({ label, color, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12,
        backgroundColor: active ? colors.primary[500] : clay.inset,
        borderWidth: 1, borderColor: active ? colors.primary[500] : clay.border,
      }}>
      {color ? (
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: active ? '#fff' : color }} />
      ) : null}
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : clay.text }}>{label}</Text>
    </TouchableOpacity>
  )
}
