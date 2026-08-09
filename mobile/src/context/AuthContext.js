import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import api, { setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refreshToken'
const USER_KEY = 'user'

async function getToken() {
  try { return await SecureStore.getItemAsync(TOKEN_KEY) } catch { return null }
}

// user se guarda en SecureStore. Se migra un único valor legacy de AsyncStorage.
async function getUser() {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  try {
    const legacy = await AsyncStorage.getItem('user')
    if (legacy) {
      try { await SecureStore.setItemAsync(USER_KEY, legacy) } catch {}
      await AsyncStorage.removeItem('user')
      return JSON.parse(legacy)
    }
  } catch {}
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
    // 401 irrecuperable → cerrar sesión localmente.
    setUnauthorizedHandler(() => setUser(null))
  }, [])

  const loadUser = async () => {
    try {
      const token = await getToken()
      const storedUser = await getUser()
      if (token && storedUser) {
        setUser(storedUser)
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const persistSession = async (token, userData, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData))
    // Limpia sesiones legacy que pudieran quedar en claro.
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(USER_KEY)
    setUser(userData)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData, refreshToken } = res.data
    await persistSession(token, userData, refreshToken)
  }

  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name })
    const { token, user: userData, refreshToken } = res.data
    await persistSession(token, userData, refreshToken)
  }

  const logout = async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY).catch(() => null)
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken })
    } catch (e) { /* revocación best-effort */ }
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {})
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {})
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
