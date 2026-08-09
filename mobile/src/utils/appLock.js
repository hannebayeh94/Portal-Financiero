import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Crypto from 'expo-crypto'

const PIN_KEY = 'app_pin'
const BIO_KEY = 'app_biometric'
const PIN_PREFIX = 'sha256$'
const MAX_ATTEMPTS = 5
const LOCKOUT_STEPS = [10000, 30000, 60000, 300000] // 10s → 30s → 1m → 5m

let failedAttempts = 0
let lastFailedAt = 0

async function hashPin(pin) {
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(pin))
  return `${PIN_PREFIX}${hex}`
}

// El PIN se guarda en SecureStore (cifrado por Keystore/Keychain) y, además,
// hasheado con SHA-256 para que no quede recuperable en claro.
export async function isPinSet() {
  try { return !!(await SecureStore.getItemAsync(PIN_KEY)) } catch { return false }
}
export async function setPin(pin) {
  await SecureStore.setItemAsync(PIN_KEY, await hashPin(pin))
}
export async function verifyPin(pin) {
  try {
    const stored = await SecureStore.getItemAsync(PIN_KEY)
    if (stored == null) return false
    if (stored.startsWith(PIN_PREFIX)) {
      if ((await hashPin(pin)) === stored) {
        failedAttempts = 0
        return true
      }
    } else if (stored === String(pin)) {
      // Migración de PINs antiguos en claro.
      await setPin(String(pin))
      failedAttempts = 0
      return true
    }
    failedAttempts += 1
    lastFailedAt = Date.now()
    return false
  } catch {
    return false
  }
}

// Milisegundos restantes de bloqueo tras exceder los intentos máximos.
export function getLockoutDelayMs() {
  if (failedAttempts < MAX_ATTEMPTS) return 0
  const elapsed = Date.now() - lastFailedAt
  const step = Math.min(failedAttempts - MAX_ATTEMPTS, LOCKOUT_STEPS.length - 1)
  return Math.max(0, LOCKOUT_STEPS[step] - elapsed)
}

// Rechaza PINs triviales ("0000", "1234", todos iguales).
export function isTrivialPin(pin) {
  const s = String(pin)
  if (!/^\d{4}$/.test(s)) return true
  if (/^(\d)\1{3}$/.test(s)) return true
  if (/^0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210$/.test(s)) return true
  return false
}

export async function clearLock() {
  try { await SecureStore.deleteItemAsync(PIN_KEY) } catch {}
  try { await SecureStore.deleteItemAsync(BIO_KEY) } catch {}
  failedAttempts = 0
}

export async function isBiometricEnabled() {
  try { return (await SecureStore.getItemAsync(BIO_KEY)) === 'true' } catch { return false }
}
export async function setBiometricEnabled(v) {
  await SecureStore.setItemAsync(BIO_KEY, v ? 'true' : 'false')
}

// ¿El dispositivo tiene hardware biométrico y huellas/rostro registrados?
export async function biometricAvailable() {
  try {
    const hw = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    return hw && enrolled
  } catch { return false }
}

export async function authenticateBiometric() {
  try {
    let r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquea Portal Financiero',
      cancelLabel: 'Usar PIN',
      fallbackLabel: 'Usar PIN',
      disableDeviceFallback: true,
    })
    // Si el sensor quedó bloqueado por intentos fallidos (lockout), Android
    // no vuelve a mostrar el diálogo. Reintentamos permitiendo la credencial
    // del dispositivo para limpiar el bloqueo y recuperar la biometría.
    if (!r.success && (r.error === 'lockout' || r.error === 'lockout_permanent')) {
      r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea Portal Financiero',
        disableDeviceFallback: false,
      })
    }
    return { success: !!r.success, error: r.error || null }
  } catch (e) {
    return { success: false, error: 'exception' }
  }
}
