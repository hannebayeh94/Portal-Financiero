import { requireNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'

// El modulo nativo solo existe en Android. En otras plataformas (o si el
// modulo no esta enlazado) devolvemos un stub para no romper el JS.
let NativeMod = null
if (Platform.OS === 'android') {
  try {
    NativeMod = requireNativeModule('NotificationListener')
  } catch {
    NativeMod = null
  }
}

export function isListening() {
  if (!NativeMod) return false
  try {
    return NativeMod.isListening()
  } catch {
    return false
  }
}

export async function getDetectedPayments() {
  if (!NativeMod) return []
  try {
    return await NativeMod.getDetectedPayments()
  } catch {
    return []
  }
}

export function clearDetectedPayments() {
  if (!NativeMod) return
  try {
    NativeMod.clearDetectedPayments()
  } catch {}
}

export function openNotificationSettings() {
  if (!NativeMod) return
  NativeMod.openNotificationSettings()
}

export function addPaymentListener(callback) {
  if (!NativeMod) return { remove() {} }
  return NativeMod.addListener('onPaymentDetected', callback)
}
