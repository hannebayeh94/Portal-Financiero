import { View } from 'react-native'
import { colors } from '../theme'

export default function ClayCard({ children, style, noHover }) {
  return (
    <View
      style={[{
        backgroundColor: colors.clay.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: colors.clay.shadow,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
        padding: 16,
      }, style]}
    >
      {children}
    </View>
  )
}
