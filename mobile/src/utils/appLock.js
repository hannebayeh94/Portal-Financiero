import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'

const PIN_KEY = 'app_pin'
const BIO_KEY = 'app_biometric'

// El PIN se guarda en SecureStore (cifrado por Keystore/Keychain del SO).
export async function isPinSet() {
  try { return !!(await SecureStore.getItemAsync(PIN_KEY)) } catch { return false }
}
export async function setPin(pin) { await SecureStore.setItemAsync(PIN_KEY, String(pin)) }
export async function verifyPin(pin) {
  try { const s = await SecureStore.getItemAsync(PIN_KEY); return s != null && s === String(pin) } catch { return false }
}
export async function clearLock() {
  try { await SecureStore.deleteItemAsync(PIN_KEY) } catch {}
  try { await SecureStore.deleteItemAsync(BIO_KEY) } catch {}
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
