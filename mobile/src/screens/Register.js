import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import { colors } from '../theme'

export default function Register({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await register(email, password, name)
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f0e8dc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: colors.clay.card, borderRadius: 24, padding: 28, shadowColor: colors.clay.shadow, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.dark[900], marginBottom: 4 }}>
            Crear Cuenta
          </Text>
          <Text style={{ fontSize: 14, color: colors.dark[500], marginBottom: 28 }}>
            Comienza a administrar tus finanzas
          </Text>

          <View style={{ gap: 18 }}>
            <ClayInput label="Nombre Completo" value={name} onChangeText={setName} placeholder="Tu nombre" />
            <ClayInput label="Correo Electrónico" value={email} onChangeText={setEmail} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" />
            <ClayInput label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry={!showPassword} rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary[500], letterSpacing: 0.5 }}>
                  {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                </Text>
              </TouchableOpacity>
            } />
            <ClayInput label="Confirmar Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry />
            <ClayButton title="Crear Cuenta" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.dark[500] }}>
              ¿Ya tienes cuenta?{' '}
              <Text style={{ fontWeight: '700', color: colors.primary[600] }}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
