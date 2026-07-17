import { TextInput, View, Text } from 'react-native'
import { colors } from '../theme'

export default function ClayInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, rightElement, style }) {
  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={{
          fontSize: 11,
          fontWeight: '800',
          color: colors.clay.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        }}>
          {label}
        </Text>
      )}
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#b0a090"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[{
            backgroundColor: '#e8ddd0',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            color: colors.clay.text,
            shadowColor: colors.clay.shadow,
            shadowOffset: { width: -4, height: -4 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 3,
          }, style]}
        />
        {rightElement && (
          <View style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}>
            {rightElement}
          </View>
        )}
      </View>
    </View>
  )
}
