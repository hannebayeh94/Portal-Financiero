import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import { clay, colors } from '../theme'

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
        || (error.code === 'ECONNABORTED' ? 'El servidor está iniciando, intenta de nuevo' : null)
        || 'Error al iniciar sesión. Verifica tu conexión'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: clay.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: clay.card,
            justifyContent: 'center', alignItems: 'center',
            shadowColor: clay.shadow, shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
            borderWidth: 1, borderColor: clay.highlight,
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32 }}>💰</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5 }}>
            Portal Financiero
          </Text>
          <Text style={{ fontSize: 14, color: clay.textMuted, marginTop: 4 }}>
            Administra tus finanzas personales
          </Text>
        </View>

        {/* Login Card */}
        <View style={{
          backgroundColor: clay.card, borderRadius: 28,
          padding: 24,
          shadowColor: clay.shadow, shadowOffset: { width: 8, height: 8 },
          shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
          borderWidth: 1, borderColor: clay.highlight,
        }}>
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
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dark[400]} />
                </TouchableOpacity>
              }
            />
            <ClayButton title="Iniciar Sesión" onPress={handleSubmit} loading={loading} style={{ marginTop: 4 }} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, color: clay.textMuted }}>
              ¿No tienes cuenta?{' '}
              <Text style={{ fontWeight: '700', color: colors.primary[500] }}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
