import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { dialog } from '../components/ConfirmDialog'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import { clay, colors, accent, shadow, fonts } from '../theme'

export default function ForgotPassword({ navigation }) {
  const { forgotPassword, resetPassword } = useAuth()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const requestCode = async () => {
    if (!email) {
      dialog.alert('Falta información', 'Ingresa tu correo electrónico')
      return
    }
    setLoading(true)
    try {
      await forgotPassword(email)
      dialog.alert('Revisa tu correo', 'Si el correo está registrado, recibirás un código de 6 dígitos.')
      setStep(2)
    } catch (error) {
      dialog.alert('Error', error.response?.data?.error || 'Error al solicitar el código')
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    if (!code || !password || !confirm) {
      dialog.alert('Falta información', 'Completa el código y la nueva contraseña')
      return
    }
    if (password !== confirm) {
      dialog.alert('Error', 'Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, code, password)
      dialog.alert('Listo', 'Contraseña actualizada. Ya puedes iniciar sesión.')
      navigation.navigate('Login')
    } catch (error) {
      dialog.alert('Error', error.response?.data?.error || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: clay.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <Ionicons name="arrow-back" size={20} color={clay.textMuted} />
          <Text style={{ fontSize: 13, fontFamily: fonts.body, color: clay.textMuted }}>Volver</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: clay.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: clay.border, ...shadow.md }}>
          <Text style={{ fontSize: 11, fontFamily: fonts.monoSemiBold, color: accent.water, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>
            {step === 1 ? 'Recuperación' : 'Último paso'}
          </Text>
          <Text style={{ fontSize: 26, fontFamily: fonts.display, color: clay.text, letterSpacing: -0.5, marginBottom: 8 }}>
            {step === 1 ? 'Olvidé mi contraseña' : 'Nueva contraseña'}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: fonts.body, color: clay.textMuted, marginBottom: 20, lineHeight: 20 }}>
            {step === 1
              ? 'Escribe tu correo y te enviaremos un código de 6 dígitos para restablecerla.'
              : `Ingresa el código enviado a ${email} y tu nueva contraseña.`}
          </Text>

          {step === 1 ? (
            <View style={{ gap: 18 }}>
              <ClayInput
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <ClayButton title="Enviar código" onPress={requestCode} loading={loading} style={{ marginTop: 4 }} />
            </View>
          ) : (
            <View style={{ gap: 18 }}>
              <ClayInput
                label="Código de 6 dígitos"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                placeholder="000000"
                keyboardType="number-pad"
              />
              <ClayInput
                label="Nueva contraseña"
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
              <ClayInput
                label="Confirmar contraseña"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
              />
              <ClayButton title="Restablecer contraseña" onPress={reset} loading={loading} style={{ marginTop: 4 }} />
              <TouchableOpacity onPress={() => setStep(1)} style={{ alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.body, color: clay.textMuted }}>¿No recibiste el código? Reenviar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
