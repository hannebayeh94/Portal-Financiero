import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const storedUser = await AsyncStorage.getItem('user')
      if (token && storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: userData } = res.data
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name })
    const { token, user: userData } = res.data
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
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
