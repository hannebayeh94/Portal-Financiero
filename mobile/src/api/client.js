import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://portal-financiero-backend.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

async function readToken() {
  try {
    const secure = await SecureStore.getItemAsync('token')
    if (secure) return secure
  } catch {}
  // Fallback / compatibilidad con sesiones anteriores
  return AsyncStorage.getItem('token')
}

api.interceptors.request.use(async (config) => {
  const token = await readToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync('token').catch(() => {})
      AsyncStorage.removeItem('token')
      AsyncStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default api
