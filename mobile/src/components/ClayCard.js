import { View } from 'react-native'
import { clay } from '../theme'

export default function ClayCard({ children, style, small }) {
  return (
    <View style={[{
      backgroundColor: clay.card,
      borderRadius: small ? 20 : 24,
      borderWidth: 1,
      borderColor: clay.highlight,
      shadowColor: clay.shadow,
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
      padding: small ? 14 : 18,
    }, style]}>
      {children}
    </View>
  )
}
