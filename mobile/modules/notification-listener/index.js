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

// Chequeo real del permiso de acceso a notificaciones (mas fiable que isListening).
export function isNotificationAccessEnabled() {
  if (!NativeMod) return false
  try {
    return NativeMod.isNotificationAccessEnabled()
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

// Elimina un solo pago detectado por su id (sin borrar los demas).
export function removePayment(id) {
  if (!NativeMod || id == null) return
  try {
    NativeMod.removePayment(String(id))
  } catch {}
}

export function openNotificationSettings() {
  if (!NativeMod) return
  NativeMod.openNotificationSettings()
}

// Abre la ficha de la app (donde esta "Permitir ajustes restringidos").
export function openAppDetailsSettings() {
  if (!NativeMod) return
  try {
    NativeMod.openAppDetailsSettings()
  } catch {}
}

export function addPaymentListener(callback) {
  if (!NativeMod) return { remove() {} }
  return NativeMod.addListener('onPaymentDetected', callback)
}
