import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/index.js'
import { getDashboardData } from '../services/dashboardService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('rc_user')
    const savedDashboard = localStorage.getItem('rc_dashboard')
    
    if (saved) setUser(JSON.parse(saved))
    if (savedDashboard) setDashboardData(JSON.parse(savedDashboard))
    
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('rc_token', data.tokens.accessToken)
    localStorage.setItem('rc_refresh', data.tokens.refreshToken)
    localStorage.setItem('rc_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const loginByCard = async (cardNumber) => {
    const data = await getDashboardData(cardNumber)
    if (!data) return { ok: false, message: 'Tarjeta inválida o no encontrada' }
    
    localStorage.setItem('rc_user', JSON.stringify({ ...data.user, role: 'CLIENTE' }))
    localStorage.setItem('rc_dashboard', JSON.stringify(data))
    
    setUser({ ...data.user, role: 'CLIENTE' })
    setDashboardData(data)
    return { ok: true, user: data.user }
  }

  const logout = async () => {
    try { await apiLogout() } catch {}
    localStorage.clear()
    setUser(null)
    setDashboardData(null)
  }

  return (
    <AuthContext.Provider value={{ user, dashboardData, login, loginByCard, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
