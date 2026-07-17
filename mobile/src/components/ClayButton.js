import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { colors } from '../theme'

const variants = {
  primary: {
    bg: ['#d4a574', '#c49464'],
    text: '#fff',
  },
  danger: {
    bg: ['#c47a7a', '#b06a6a'],
    text: '#fff',
  },
  success: {
    bg: ['#7dab7d', '#6d9b6d'],
    text: '#fff',
  },
  secondary: {
    bg: ['#e8ddd0', '#d4c4b4'],
    text: colors.clay.text,
  },
}

export default function ClayButton({ title, onPress, variant = 'primary', loading, style, textStyle, disabled }) {
  const v = variants[variant] || variants.primary

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: v.bg[0],
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: colors.clay.shadow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
        opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[{
          color: v.text,
          fontWeight: '700',
          fontSize: 15,
        }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}
