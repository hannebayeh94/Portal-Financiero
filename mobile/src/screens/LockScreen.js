import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, AppState } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PinPad from '../components/PinPad'
import GradientCard from '../components/GradientCard'
import { verifyPin, authenticateBiometric, biometricAvailable } from '../utils/appLock'
import { clay, colors, gradients, shadow } from '../theme'

export default function LockScreen({ onUnlock, bioEnabled }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [canBio, setCanBio] = useState(false)
  const busyRef = useRef(false)

  const tryBiometric = useCallback(async () => {
    if (!bioEnabled || busyRef.current) return
    // Nunca lanzar el prompt si la app no está en primer plano: en background
    // authenticateAsync no puede mostrar el diálogo y la promesa queda colgada,
    // lo que dejaría el botón inservible al volver. El botón siempre está activo
    // porque cuando el usuario lo toca la app está, por definición, en foreground.
    if (AppState.currentState !== 'active') return
    const ok = await biometricAvailable()
    setCanBio(ok)
    if (!ok) return
    busyRef.current = true
    try {
      const { success } = await authenticateBiometric()
      if (success) onUnlock()
    } finally {
      busyRef.current = false
    }
  }, [bioEnabled, onUnlock])

  // Mostrar el botón (comprobar disponibilidad) sin lanzar el prompt.
  useEffect(() => {
    let alive = true
    if (bioEnabled) biometricAvailable().then((ok) => { if (alive) setCanBio(ok) })
    return () => { alive = false }
  }, [bioEnabled])

  // Lanzar la biometría cuando la app está/vuelve a primer plano.
  useEffect(() => {
    if (AppState.currentState === 'active') tryBiometric()
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') tryBiometric()
      // Si la app se va a background, libera la guardia por si una llamada
      // anterior quedó pendiente, para no bloquear el próximo intento.
      else busyRef.current = false
    })
    return () => sub.remove()
  }, [tryBiometric])

  useEffect(() => {
    if (pin.length === 4) {
      (async () => {
        if (await verifyPin(pin)) {
          onUnlock()
        } else {
          setError(true)
          setTimeout(() => { setPin(''); setError(false) }, 600)
        }
      })()
    }
  }, [pin, onUnlock])

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: clay.bg, zIndex: 9999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <GradientCard colors={gradients.brand} radius={24} style={{ width: 72, height: 72, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...shadow.brand }}>
        <Ionicons name="lock-closed" size={32} color="#fff" />
      </GradientCard>
      <Text style={{ fontSize: 22, fontWeight: '800', color: clay.text, letterSpacing: -0.3 }}>Portal Financiero</Text>
      <Text style={{ fontSize: 14, color: error ? colors.danger[500] : clay.textMuted, marginTop: 6, marginBottom: 30 }}>
        {error ? 'PIN incorrecto, intenta de nuevo' : 'Ingresa tu PIN para continuar'}
      </Text>

      <PinPad value={pin} onChange={setPin} maxLength={4} error={error} />

      {bioEnabled && canBio && (
        <TouchableOpacity onPress={tryBiometric} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: clay.card, borderWidth: 1, borderColor: clay.border, ...shadow.sm }}>
          <Ionicons name="finger-print" size={22} color={colors.primary[500]} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary[500] }}>Usar biometría</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
