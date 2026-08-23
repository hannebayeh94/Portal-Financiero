import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { dialog } from '../components/ConfirmDialog'
import ClayInput from '../components/ClayInput'
import ClayButton from '../components/ClayButton'
import { clay, colors, accent, shadow, fonts } from '../theme'

/* Corrientes decorativas — firma visual de Flujo */
function FlowRivers() {
  return (
    <Svg viewBox="0 0 320 150" width="100%" style={{ height: 130 }}>
      <Path d="M10 75 C 80 75, 100 30, 160 30 C 220 30, 240 15, 310 15"
        stroke={accent.water} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.9} />
      <Path d="M10 75 C 80 75, 105 75, 165 75 C 225 75, 250 58, 310 58"
        stroke={accent.coral} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.85} />
      <Path d="M10 75 C 80 75, 110 120, 175 120 C 235 120, 255 135, 310 135"
        stroke={accent.amber} strokeWidth={4.5} strokeLinecap="round" fill="none" opacity={0.85} />
      <Circle cx={296} cy={15} r={5.5} fill={accent.water} />
      <Circle cx={296} cy={58} r={4.5} fill={accent.coral} />
      <Circle cx={296} cy={135} r={4} fill={accent.amber} />
      <Circle cx={20} cy={75} r={11} fill="#FFFFFF" stroke={clay.text} strokeWidth={2.5} />
      <Circle cx={20} cy={75} r={4} fill={clay.text} />
    </Svg>
  )
}

export default function Login({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async () => {
    if (!email || !password) {
      dialog.alert('Error', 'Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
    } catch (error) {
      const msg = error.response?.data?.error
        || (error.code === 'ECONNABORTED' ? 'El servidor está iniciando, intenta de nuevo' : null)
        || 'Error al iniciar sesión. Verifica tu conexión'
      dialog.alert('Error', msg)
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
        {/* Marca */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: colors.primary[500],
              justifyContent: 'center', alignItems: 'center',
              ...shadow.brand,
            }}>
              <Text style={{ color: '#fff', fontSize: 18, fontFamily: fonts.display }}>PF</Text>
            </View>
            <View>
              <Text style={{ fontSize: 22, fontFamily: fonts.display, color: clay.text, letterSpacing: -0.3 }}>
                Portal Financiero
              </Text>
              <Text style={{ fontSize: 10, fontFamily: fonts.monoSemiBold, color: accent.water, letterSpacing: 2, textTransform: 'uppercase' }}>
                El mapa de tu dinero
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 30, fontFamily: fonts.display, color: clay.text, lineHeight: 36, letterSpacing: -0.5 }}>
            Mira hacia dónde{' '}
            <Text style={{ color: accent.water }}>fluye</Text> tu plata
          </Text>

          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <FlowRivers />
          </View>

          <Text style={{ fontSize: 14, fontFamily: fonts.body, color: clay.textMuted, lineHeight: 21 }}>
            Ingresos, egresos, deudas y ahorros como corrientes en un solo mapa.
          </Text>
        </View>

        {/* Formulario */}
        <View style={{
          backgroundColor: clay.card, borderRadius: 24,
          padding: 24,
          borderWidth: 1, borderColor: clay.border,
          ...shadow.md,
        }}>
          <Text style={{ fontSize: 11, fontFamily: fonts.monoSemiBold, color: accent.water, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 16 }}>
            Acceso
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
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.dark[400]} />
                </TouchableOpacity>
              }
            />
            <ClayButton title="Iniciar Sesión" onPress={handleSubmit} loading={loading} style={{ marginTop: 4 }} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.body, color: clay.textMuted }}>
              ¿No tienes cuenta?{' '}
              <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary[600] }}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
