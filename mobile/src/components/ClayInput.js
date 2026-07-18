import { TextInput, View, Text } from 'react-native'
import { clay } from '../theme'

export default function ClayInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, rightElement, style }) {
  return (
    <View style={{ marginBottom: 4 }}>
      {label && (
        <Text style={{
          fontSize: 12,
          fontWeight: '700',
          color: clay.textMuted,
          letterSpacing: 0.2,
          marginBottom: 7,
          marginLeft: 2,
        }}>
          {label}
        </Text>
      )}
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={clay.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[{
            backgroundColor: clay.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: clay.border,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '600',
            color: clay.text,
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
