import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/client'
import {
  configureNotificationHandler, ensureAndroidChannel, requestPermission,
  scheduleAllReminders, cancelAllReminders,
} from '../utils/reminders'

const RemindersContext = createContext(null)
const STORAGE_KEY = 'remindersEnabled'

export function RemindersProvider({ children }) {
  const [enabled, setEnabled] = useState(false)
  const [scheduledCount, setScheduledCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const appState = useRef(AppState.currentState)

  const fetchAndSchedule = useCallback(async () => {
    setLoading(true)
    try {
      const [debtsRes, expRes, incRes] = await Promise.all([
        api.get('/debts', { params: { status: 'active' } }),
        api.get('/expenses'),
        api.get('/incomes'),
      ])
      const recurringExpenses = (expRes.data || []).filter(e => e.recurring)
      const recurringIncomes = (incRes.data || []).filter(i => i.recurring)
      const count = await scheduleAllReminders({
        debts: debtsRes.data || [], recurringExpenses, recurringIncomes,
      })
      setScheduledCount(count)
    } catch (e) {
      // silencioso: reintentará al volver a foreground
    } finally { setLoading(false) }
  }, [])

  // Configuración inicial + carga de preferencia
  useEffect(() => {
    configureNotificationHandler()
    ensureAndroidChannel()
    ;(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setEnabled(true)
        fetchAndSchedule()
      }
    })()
  }, [fetchAndSchedule])

  // Reagenda al volver de background si está activo
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && enabled) {
        fetchAndSchedule()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [enabled, fetchAndSchedule])

  const toggle = useCallback(async (value) => {
    if (value) {
      const granted = await requestPermission()
      if (!granted) return false
      setEnabled(true)
      await AsyncStorage.setItem(STORAGE_KEY, 'true')
      await fetchAndSchedule()
      return true
    } else {
      setEnabled(false)
      await AsyncStorage.setItem(STORAGE_KEY, 'false')
      await cancelAllReminders()
      setScheduledCount(0)
      return true
    }
  }, [fetchAndSchedule])

  return (
    <RemindersContext.Provider value={{ enabled, scheduledCount, loading, toggle, refresh: fetchAndSchedule }}>
      {children}
    </RemindersContext.Provider>
  )
}

export function useReminders() {
  const ctx = useContext(RemindersContext)
  if (!ctx) throw new Error('useReminders must be used within RemindersProvider')
  return ctx
}
