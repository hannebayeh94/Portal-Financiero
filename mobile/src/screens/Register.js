import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import GradientCard from '../components/GradientCard'
import { clay, colors, gradients, shadow } from '../theme'

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
      style={{ flex: 1, backgroundColor: clay.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <GradientCard colors={gradients.brand} radius={24} style={{
            width: 72, height: 72, justifyContent: 'center', alignItems: 'center',
            marginBottom: 16, ...shadow.brand,
          }}>
            <Ionicons name="rocket" size={32} color="#fff" />
          </GradientCard>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5 }}>
            Crear Cuenta
          </Text>
          <Text style={{ fontSize: 14, color: clay.textMuted, marginTop: 4 }}>
            Comienza hoy
          </Text>
        </View>

        <View style={{
          backgroundColor: clay.card, borderRadius: 24, padding: 24,
          borderWidth: 1, borderColor: clay.border,
          ...shadow.md,
        }}>
          <View style={{ gap: 18 }}>
            <ClayInput label="Nombre Completo" value={name} onChangeText={setName} placeholder="Tu nombre" />
            <ClayInput label="Correo Electrónico" value={email} onChangeText={setEmail} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" />
            <ClayInput label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry={!showPassword}
              rightElement={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dark[400]} /></TouchableOpacity>}
            />
            <ClayInput label="Confirmar Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry />
            <ClayButton title="Crear Cuenta" onPress={handleSubmit} loading={loading} variant="success" style={{ marginTop: 4 }} />
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: clay.textMuted }}>
              ¿Ya tienes cuenta?{' '}
              <Text style={{ fontWeight: '700', color: colors.primary[500] }}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
