import { View } from 'react-native'
import { clay, shadow } from '../theme'

export default function ClayCard({ children, style, small }) {
  return (
    <View style={[{
      backgroundColor: clay.card,
      borderRadius: small ? 16 : 20,
      borderWidth: 1,
      borderColor: clay.border,
      padding: small ? 14 : 18,
      ...(small ? shadow.sm : shadow.md),
    }, style]}>
      {children}
    </View>
  )
}
