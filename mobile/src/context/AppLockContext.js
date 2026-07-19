import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AppState } from 'react-native'
import LockScreen from '../screens/LockScreen'
import { isPinSet, isBiometricEnabled } from '../utils/appLock'

const AppLockContext = createContext(null)

export function AppLockProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(false)
  const [locked, setLocked] = useState(false)
  const appState = useRef(AppState.currentState)

  const refreshConfig = useCallback(async () => {
    const pin = await isPinSet()
    const bio = await isBiometricEnabled()
    setPinEnabled(pin)
    setBioEnabled(bio)
    return { pin, bio }
  }, [])

  // Al iniciar: si hay PIN, arranca bloqueado.
  useEffect(() => {
    (async () => {
      const { pin } = await refreshConfig()
      if (pin) setLocked(true)
      setReady(true)
    })()
  }, [refreshConfig])

  // Bloquea al enviar la app a segundo plano (si hay PIN).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current === 'active' && next.match(/inactive|background/) && pinEnabled) {
        setLocked(true)
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [pinEnabled])

  const unlock = useCallback(() => setLocked(false), [])

  return (
    <AppLockContext.Provider value={{ pinEnabled, bioEnabled, locked, refreshConfig, lockNow: () => setLocked(true) }}>
      {children}
      {ready && locked && pinEnabled && <LockScreen onUnlock={unlock} bioEnabled={bioEnabled} />}
    </AppLockContext.Provider>
  )
}

export function useAppLock() {
  const ctx = useContext(AppLockContext)
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider')
  return ctx
}
