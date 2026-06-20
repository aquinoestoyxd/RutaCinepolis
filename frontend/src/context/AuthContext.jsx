import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/index.js'
import { getDashboardData } from '../services/dashboardService.js'

const AuthContext = createContext(null)

function clearMemberSession() {
  localStorage.removeItem('rc_user')
  localStorage.removeItem('rc_dashboard')
  localStorage.removeItem('rc_member_token')
}

function isTokenValid(token) {
  try {
    if (!token) return false
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refetchError, setRefetchError] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('rc_user')
    const savedDashboard = localStorage.getItem('rc_dashboard')
    const memberToken = localStorage.getItem('rc_member_token')

    if (saved && memberToken) {
      if (isTokenValid(memberToken)) {
        const parsedUser = JSON.parse(saved)
        setUser(parsedUser)
        if (savedDashboard) setDashboardData(JSON.parse(savedDashboard))
        setLoading(false)
        getDashboardData(parsedUser.cardNumber).then(data => {
          if (!data) return
          localStorage.setItem('rc_dashboard', JSON.stringify(data))
          if (data.memberToken) {
            localStorage.setItem('rc_member_token', data.memberToken)
          }
          setDashboardData(data)
          setRefetchError(null)
        }).catch(() => {
          setRefetchError('No se pudo actualizar la informacion. Los datos mostrados pueden no estar actualizados.')
        })
        return
      }
      clearMemberSession()
    } else if (saved && !memberToken) {
      clearMemberSession()
    }

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
    if (!data) return { ok: false, message: 'Tarjeta invalida o no encontrada' }
    
    localStorage.setItem('rc_user', JSON.stringify({ ...data.user, role: 'CLIENTE' }))
    localStorage.setItem('rc_dashboard', JSON.stringify(data))
    if (data.memberToken) {
      localStorage.setItem('rc_member_token', data.memberToken)
    }
    
    setUser({ ...data.user, role: 'CLIENTE' })
    setDashboardData(data)
    return { ok: true, user: data.user }
  }

  const logout = async () => {
    if (user?.role === 'CLIENTE') {
      localStorage.removeItem('rc_user')
      localStorage.removeItem('rc_dashboard')
      localStorage.removeItem('rc_member_token')
    } else {
      try { await apiLogout() } catch {}
      localStorage.removeItem('rc_token')
      localStorage.removeItem('rc_refresh')
      localStorage.removeItem('rc_user')
    }
    setUser(null)
    setDashboardData(null)
  }

  return (
    <AuthContext.Provider value={{ user, dashboardData, login, loginByCard, logout, loading, refetchError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
