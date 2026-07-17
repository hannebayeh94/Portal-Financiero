import { TouchableOpacity, View, Text, Animated } from 'react-native'
import { useRef, useEffect } from 'react'
import { colors } from '../theme'

export default function ClayToggle({ value, onValueChange, label }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start()
  }, [value])

  const knobLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 23],
  })

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e0d4c4', '#d4a574'],
  })

  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
    >
      <View style={{ width: 44, height: 24, borderRadius: 12, justifyContent: 'center', backgroundColor: value ? '#d4a574' : '#e0d4c4', shadowColor: colors.clay.shadow, shadowOffset: value ? { width: 2, height: 2 } : { width: -2, height: -2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 }}>
        <Animated.View style={{
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: '#f5ebe0',
          position: 'absolute',
          top: 3,
          left: knobLeft,
          shadowColor: '#b0a090',
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 3,
        }} />
      </View>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.dark[600] }}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}
