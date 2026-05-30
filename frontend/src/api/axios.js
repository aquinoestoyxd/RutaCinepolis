// axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('rc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('rc_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken: refresh })
          localStorage.setItem('rc_token', data.data.accessToken)
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(error.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
