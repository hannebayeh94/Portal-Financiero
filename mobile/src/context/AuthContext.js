import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import api from '../api/client'

const AuthContext = createContext(null)

// El token se guarda en SecureStore (cifrado). El objeto user (no sensible) en AsyncStorage.
async function getToken() {
  let token = null
  try { token = await SecureStore.getItemAsync('token') } catch {}
  if (!token) {
    // Migración suave desde el almacenamiento anterior (AsyncStorage)
    const legacy = await AsyncStorage.getItem('token')
    if (legacy) {
      try { await SecureStore.setItemAsync('token', legacy) } catch {}
      await AsyncStorage.removeItem('token')
      token = legacy
    }
  }
  return token
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const token = await getToken()
      const storedUser = await AsyncStorage.getItem('user')
      if (token && storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const persistSession = async (token, userData) => {
    try { await SecureStore.setItemAsync('token', token) } catch { await AsyncStorage.setItem('token', token) }
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData } = res.data
    await persistSession(token, userData)
  }

  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name })
    const { token, user: userData } = res.data
    await persistSession(token, userData)
  }

  const logout = async () => {
    try { await SecureStore.deleteItemAsync('token') } catch {}
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
