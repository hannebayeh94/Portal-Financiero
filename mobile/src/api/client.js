import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://portal-financiero-backend.onrender.com/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refreshToken'

// Notifica a AuthContext cuando la sesión es irrecuperable (401 sin refresh válido).
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

// El token vive SOLO en SecureStore (cifrado). AsyncStorage se usa únicamente
// como migración única de sesiones antiguas y se limpia al leerla.
async function readToken() {
  try {
    const secure = await SecureStore.getItemAsync(TOKEN_KEY)
    if (secure) return secure
  } catch {}
  const legacy = await AsyncStorage.getItem('token')
  if (legacy) {
    try { await SecureStore.setItemAsync(TOKEN_KEY, legacy) } catch {}
    await AsyncStorage.removeItem('token')
    return legacy
  }
  return null
}

let refreshPromise = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
      if (!refreshToken) throw new Error('Sin refresh token')
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      await SecureStore.setItemAsync(TOKEN_KEY, res.data.token)
      await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken)
      await SecureStore.setItemAsync('user', JSON.stringify(res.data.user))
      return res.data.token
    })()
    refreshPromise
      .catch(() => {})
      .then(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
  await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {})
  await SecureStore.deleteItemAsync('user').catch(() => {})
  await AsyncStorage.removeItem('token')
  await AsyncStorage.removeItem('user')
}

function isAuthEndpoint(url) {
  return /\/auth\/(login|register|refresh|logout)$/.test(url)
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
  async (error) => {
    const { config, response } = error
    const is401 = response?.status === 401
    if (is401 && config && !config._retry && !isAuthEndpoint(config.url)) {
      config._retry = true
      try {
        const token = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      } catch (refreshError) {
        await clearSession()
        if (onUnauthorized) onUnauthorized()
      }
    }
    return Promise.reject(error)
  }
)

export default api
