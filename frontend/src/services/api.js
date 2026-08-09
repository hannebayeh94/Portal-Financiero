import axios from 'axios'

let baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
if (baseURL && !baseURL.endsWith('/api')) baseURL += '/api'
const api = axios.create({ baseURL })

let refreshPromise = null

// Renueva el access token y rota el refresh token (una sola llamada compartida).
function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      refreshPromise = Promise.reject(new Error('Sin refresh token'))
    } else {
      refreshPromise = axios
        .post(`${baseURL}/auth/refresh`, { refreshToken })
        .then((res) => {
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('refreshToken', res.data.refreshToken)
          return res.data.token
        })
    }
    refreshPromise
      .catch(() => {})
      .then(() => { refreshPromise = null })
  }
  return refreshPromise
}

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error
    const isAuthRequest = config && /\/auth\/(login|register|refresh|logout)$/.test(config.url)
    if (response?.status === 401 && config && !config._retry && !isAuthRequest) {
      config._retry = true
      try {
        const token = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      } catch (refreshError) {
        clearSession()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
