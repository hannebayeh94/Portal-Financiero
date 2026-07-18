import { TouchableOpacity, View, Text } from 'react-native'
import { clay, colors, shadow } from '../theme'

export default function ClayToggle({ value, onValueChange, label }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <View style={{
        width: 48, height: 28, borderRadius: 14,
        backgroundColor: value ? colors.primary[500] : clay.border,
        justifyContent: 'center',
      }}>
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: '#fff',
          position: 'absolute', top: 3,
          left: value ? 23 : 3,
          ...shadow.sm,
        }} />
      </View>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '600', color: clay.text, letterSpacing: 0.1 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
