import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AppState } from 'react-native'
import { getDetectedPayments, removePayment, clearDetectedPayments } from '../../modules/notification-listener'

const NotificationContext = createContext(null)

const idOf = (p) => String(p?.id ?? p?.detected_at ?? '')

export function NotificationProvider({ children }) {
  const [pendingPayments, setPendingPayments] = useState([]) // todos los detectados (para historial + badge)
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentPayment, setCurrentPayment] = useState(null)
  const appState = useRef(AppState.currentState)
  const seenIds = useRef(new Set())     // ignorados/atendidos en esta sesion (no vuelven a hacer popup)
  const initialized = useRef(false)

  const refreshPayments = useCallback(async () => {
    let list = []
    try { list = await getDetectedPayments() } catch { return }
    setPendingPayments(list)

    // Primera carga: el backlog va al historial, no hace popup
    if (!initialized.current) {
      list.forEach(p => seenIds.current.add(idOf(p)))
      initialized.current = true
      return
    }

    const next = list.find(p => !seenIds.current.has(idOf(p)))
    if (next) {
      setCurrentPayment(next)
      setShowPrompt(true)
    } else {
      setCurrentPayment(null)
      setShowPrompt(false)
    }
  }, [])

  useEffect(() => {
    refreshPayments()

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        refreshPayments()
      }
      appState.current = nextState
    })

    const pollInterval = setInterval(refreshPayments, 5000)

    return () => {
      subscription.remove()
      clearInterval(pollInterval)
    }
  }, [refreshPayments])

  // Ignorar: no borra; lo deja en el historial y no vuelve a hacer popup esta sesion
  const skipCurrent = useCallback(() => {
    if (currentPayment) seenIds.current.add(idOf(currentPayment))
    refreshPayments()
  }, [currentPayment, refreshPayments])

  // Registrar/Descartar el actual: elimina solo ese pago del almacenamiento
  const removeCurrent = useCallback(async () => {
    if (currentPayment) {
      const id = idOf(currentPayment)
      seenIds.current.add(id)
      removePayment(id)
    }
    await refreshPayments()
  }, [currentPayment, refreshPayments])

  // Eliminar un pago puntual desde el historial
  const removeOne = useCallback(async (id) => {
    if (id == null) return
    seenIds.current.add(String(id))
    removePayment(String(id))
    await refreshPayments()
  }, [refreshPayments])

  const clearAll = useCallback(async () => {
    clearDetectedPayments()
    await refreshPayments()
  }, [refreshPayments])

  return (
    <NotificationContext.Provider value={{
      pendingPayments, currentPayment, showPrompt,
      skipCurrent, removeCurrent, removeOne, clearAll, refreshPayments,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
