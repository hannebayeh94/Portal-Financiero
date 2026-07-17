import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native'
import { clay } from '../theme'

const variants = {
  primary: { bg: '#d4a574', active: '#c49464' },
  danger: { bg: '#c47a7a', active: '#b06a6a' },
  success: { bg: '#7dab7d', active: '#6d9b6d' },
  secondary: { bg: '#e8ddd0', active: '#d4c4b4' },
}

export default function ClayButton({ title, onPress, variant = 'primary', loading, style, textStyle, disabled, small }) {
  const v = variants[variant] || variants.primary

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[{
        backgroundColor: v.bg,
        borderRadius: small ? 14 : 16,
        paddingVertical: small ? 10 : 14,
        paddingHorizontal: small ? 14 : 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: clay.shadow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
        opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size={small ? 16 : 20} />
      ) : (
        <Text style={[{
          color: variant === 'secondary' ? clay.text : '#fff',
          fontWeight: '800',
          fontSize: small ? 13 : 15,
          letterSpacing: 0.3,
        }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}
