import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AppState } from 'react-native'
import { getDetectedPayments, clearDetectedPayments } from '../../modules/notification-listener'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [pendingPayments, setPendingPayments] = useState([])
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentPayment, setCurrentPayment] = useState(null)
  const appState = useRef(AppState.currentState)
  const lastCount = useRef(0)

  const refreshPayments = useCallback(async () => {
    try {
      const payments = await getDetectedPayments()
      if (payments.length > 0 && payments.length !== lastCount.current) {
        lastCount.current = payments.length
        setPendingPayments(payments)
        setCurrentPayment(payments[0])
        setShowPrompt(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    refreshPayments()

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
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

  const dismissPayment = useCallback(() => {
    setCurrentPayment(null)
    setShowPrompt(false)
    setPendingPayments([])
    clearDetectedPayments()
  }, [])

  const skipPayment = useCallback(() => {
    setPendingPayments(prev => {
      const rest = prev.slice(1)
      if (rest.length > 0) {
        setCurrentPayment(rest[0])
        return rest
      }
      setCurrentPayment(null)
      setShowPrompt(false)
      return []
    })
  }, [])

  return (
    <NotificationContext.Provider value={{ pendingPayments, currentPayment, showPrompt, dismissPayment, skipPayment, refreshPayments }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
