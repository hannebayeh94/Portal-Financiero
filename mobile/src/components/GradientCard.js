import { View, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg'

// Gradient background card using react-native-svg (no native gradient dependency).
// The outer View carries the shadow/borderRadius (not clipped); an inner absolute-fill
// View clips the gradient to rounded corners so iOS shadows are not cut off.
export default function GradientCard({ colors, style, children, radius = 24, id = 'grad' }) {
  const [from, to] = colors
  const gid = `${id}-${from}-${to}`.replace(/[^a-zA-Z0-9-]/g, '')
  return (
    <View style={[{ borderRadius: radius, backgroundColor: from }, style]}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radius, overflow: 'hidden' }]}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
        </Svg>
      </View>
      {children}
    </View>
  )
}
