import { TextInput, View, Text } from 'react-native'
import { clay } from '../theme'

export default function ClayInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, rightElement, style }) {
  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={{
          fontSize: 11,
          fontWeight: '800',
          color: clay.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 6,
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
            backgroundColor: clay.inset,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '600',
            color: clay.text,
            shadowColor: clay.shadow,
            shadowOffset: { width: -4, height: -4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 2,
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
