import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import { colors } from '../theme'

export default function Login({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
    } catch (error) {
      const msg = error.response?.data?.error
        || (error.code === 'ECONNABORTED' ? 'El servidor está iniciando, intenta de nuevo en unos segundos' : null)
        || 'Error al iniciar sesión. Verifica tu conexión'
      Alert.alert('Error', msg)
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
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.dark[900], marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : undefined }}>
            Iniciar Sesión
          </Text>
          <Text style={{ fontSize: 14, color: colors.dark[500], marginBottom: 28 }}>
            Ingresa tus credenciales
          </Text>

          <View style={{ gap: 18 }}>
            <ClayInput
              label="Correo Electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <ClayInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary[500], letterSpacing: 0.5 }}>
                    {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                  </Text>
                </TouchableOpacity>
              }
            />
            <ClayButton title="Iniciar Sesión" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.dark[500] }}>
              ¿No tienes cuenta?{' '}
              <Text style={{ fontWeight: '700', color: colors.primary[600] }}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
