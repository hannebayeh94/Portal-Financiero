import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ClayCard from '../components/ClayCard'
import ClayToggle from '../components/ClayToggle'
import PinPad from '../components/PinPad'
import { dialog } from '../components/ConfirmDialog'
import { useAppLock } from '../context/AppLockContext'
import { setPin, clearLock, setBiometricEnabled, biometricAvailable, isPinSet, isBiometricEnabled } from '../utils/appLock'
import { clay, colors } from '../theme'

export default function Security({ navigation }) {
  const { refreshConfig } = useAppLock()
  const [pinOn, setPinOn] = useState(false)
  const [bioOn, setBioOn] = useState(false)
  const [bioAvailable, setBioAvailable] = useState(false)

  const [setupVisible, setSetupVisible] = useState(false)
  const [step, setStep] = useState('create') // 'create' | 'confirm'
  const [firstPin, setFirstPin] = useState('')
  const [pin, setPinValue] = useState('')
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setPinOn(await isPinSet())
    setBioOn(await isBiometricEnabled())
    setBioAvailable(await biometricAvailable())
  }, [])

  useEffect(() => { load() }, [load])

  const openSetup = () => { setStep('create'); setFirstPin(''); setPinValue(''); setError(false); setSetupVisible(true) }

  const onPinToggle = async (value) => {
    if (value) {
      openSetup()
    } else {
      dialog.confirm({
        title: 'Desactivar PIN',
        message: 'Se quitará el bloqueo con PIN y la biometría.',
        confirmLabel: 'Desactivar', destructive: true,
        onConfirm: async () => { await clearLock(); await refreshConfig(); await load() },
      })
    }
  }

  const onBioToggle = async (value) => {
    if (value && !bioAvailable) {
      dialog.alert('No disponible', 'Este dispositivo no tiene biometría configurada.')
      return
    }
    await setBiometricEnabled(value)
    await refreshConfig()
    setBioOn(value)
  }

  // Maneja cada dígito del setup
  useEffect(() => {
    if (!setupVisible || pin.length !== 4) return
    (async () => {
      if (step === 'create') {
        setFirstPin(pin)
        setPinValue('')
        setStep('confirm')
      } else {
        if (pin === firstPin) {
          await setPin(pin)
          await refreshConfig()
          setSetupVisible(false)
          await load()
          dialog.alert('Listo', 'Bloqueo con PIN activado.')
        } else {
          setError(true)
          setTimeout(() => { setError(false); setPinValue(''); setStep('create'); setFirstPin('') }, 700)
        }
      }
    })()
  }, [pin, setupVisible, step, firstPin, refreshConfig, load])

  return (
    <View style={{ flex: 1, backgroundColor: clay.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14, backgroundColor: clay.card, borderBottomWidth: 1, borderBottomColor: clay.border, shadowColor: clay.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.dark[600]} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '600', color: clay.textMuted }}>Seguridad</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: clay.text, letterSpacing: -0.5, marginTop: 2 }}>Bloqueo de la app</Text>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          <ClayCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="keypad" size={22} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Bloqueo con PIN</Text>
                <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 1 }}>{pinOn ? 'Activado' : 'Pide un PIN al abrir la app'}</Text>
              </View>
              <ClayToggle value={pinOn} onValueChange={onPinToggle} />
            </View>
          </ClayCard>

          <ClayCard style={{ opacity: pinOn ? 1 : 0.5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.success[50], alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="finger-print" size={22} color={colors.success[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: clay.text }}>Usar biometría</Text>
                <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 1 }}>
                  {!bioAvailable ? 'No disponible en este dispositivo' : bioOn ? 'Activada' : 'Huella o rostro para desbloquear'}
                </Text>
              </View>
              <ClayToggle value={bioOn} onValueChange={onBioToggle} disabled={!pinOn || !bioAvailable} />
            </View>
          </ClayCard>

          <Text style={{ fontSize: 12, color: clay.textMuted, marginTop: 4, paddingHorizontal: 4, lineHeight: 18 }}>
            El PIN y el token de sesión se guardan cifrados en el almacenamiento seguro del dispositivo.
          </Text>
        </View>
      </ScrollView>

      {/* Setup PIN */}
      <Modal visible={setupVisible} transparent animationType="fade" onRequestClose={() => setSetupVisible(false)}>
        <View style={{ flex: 1, backgroundColor: clay.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableOpacity onPress={() => setSetupVisible(false)} style={{ position: 'absolute', top: 56, right: 24, padding: 6 }}>
            <Ionicons name="close" size={26} color={clay.textMuted} />
          </TouchableOpacity>
          <Ionicons name="keypad" size={40} color={colors.primary[500]} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: clay.text }}>
            {step === 'create' ? 'Crea tu PIN' : 'Confirma tu PIN'}
          </Text>
          <Text style={{ fontSize: 14, color: error ? colors.danger[500] : clay.textMuted, marginTop: 6, marginBottom: 30 }}>
            {error ? 'Los PIN no coinciden' : 'Elige un PIN de 4 dígitos'}
          </Text>
          <PinPad value={pin} onChange={setPinValue} maxLength={4} error={error} />
        </View>
      </Modal>
    </View>
  )
}
