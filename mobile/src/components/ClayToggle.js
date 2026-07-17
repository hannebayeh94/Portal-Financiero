import { TouchableOpacity, View, Text } from 'react-native'
import { clay } from '../theme'

export default function ClayToggle({ value, onValueChange, label }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <View style={{
        width: 46, height: 26, borderRadius: 13,
        backgroundColor: value ? '#d4a574' : clay.inset,
        justifyContent: 'center',
        shadowColor: clay.shadow,
        shadowOffset: value ? { width: 2, height: 2 } : { width: -2, height: -2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: '#f5ebe0',
          position: 'absolute', top: 3,
          left: value ? 23 : 3,
          shadowColor: '#b0a090',
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 3,
        }} />
      </View>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '600', color: clay.text, letterSpacing: 0.2 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
