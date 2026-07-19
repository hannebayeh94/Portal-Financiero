import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { clay, colors } from '../theme'

// Teclado numérico + puntos. Controlado: value (string), onChange, maxLength.
export default function PinPad({ value = '', onChange, maxLength = 4, error, accent = colors.primary[500] }) {
  const press = (d) => { if (value.length < maxLength) onChange(value + d) }
  const back = () => onChange(value.slice(0, -1))

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Dots */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28 }}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View key={i} style={{
            width: 16, height: 16, borderRadius: 8,
            backgroundColor: i < value.length ? (error ? colors.danger[500] : accent) : clay.inset,
            borderWidth: 1, borderColor: error ? colors.danger[400] : clay.border,
          }} />
        ))}
      </View>

      {/* Keypad */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'space-between' }}>
        {keys.map((k, i) => {
          if (k === '') return <View key={i} style={{ width: 76, height: 76, margin: 3 }} />
          const isDel = k === 'del'
          return (
            <TouchableOpacity key={i} activeOpacity={0.7} onPress={() => (isDel ? back() : press(k))}
              style={{
                width: 76, height: 76, margin: 3, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDel ? 'transparent' : clay.card,
                borderWidth: isDel ? 0 : 1, borderColor: clay.border,
                ...(isDel ? {} : { shadowColor: clay.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }),
              }}>
              {isDel
                ? <Ionicons name="backspace-outline" size={26} color={clay.textMuted} />
                : <Text style={{ fontSize: 26, fontWeight: '700', color: clay.text }}>{k}</Text>}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
