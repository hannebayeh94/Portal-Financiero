import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { clay, colors, shadow } from '../theme'

const variants = {
  primary: { bg: colors.primary[500], fg: '#fff', shadow: shadow.brand },
  danger: { bg: colors.danger[500], fg: '#fff', shadow: shadow.md },
  success: { bg: colors.success[500], fg: '#fff', shadow: shadow.md },
  secondary: { bg: clay.surface, fg: clay.text, shadow: shadow.sm, border: clay.border },
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
        borderRadius: small ? 12 : 16,
        paddingVertical: small ? 11 : 15,
        paddingHorizontal: small ? 16 : 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
        opacity: disabled ? 0.5 : 1,
        ...v.shadow,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size={small ? 16 : 20} />
      ) : (
        <Text style={[{
          color: v.fg,
          fontWeight: '800',
          fontSize: small ? 13 : 15,
          letterSpacing: 0.2,
        }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}
