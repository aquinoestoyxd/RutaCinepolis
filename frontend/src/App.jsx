import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

import Login from './pages/Login.jsx'
import MemberLogin from './pages/member/Login.jsx'
import MemberDashboard from './pages/member/Dashboard.jsx'

// Cajero
import CajeroLayout from './components/Layout/CajeroLayout.jsx'
import BuscarMiembro from './pages/cajero/BuscarMiembro.jsx'
import RegistrarMiembro from './pages/cajero/RegistrarMiembro.jsx'
import RegistrarCompra from './pages/cajero/RegistrarCompra.jsx'
import AplicarCanje from './pages/cajero/AplicarCanje.jsx'

// Admin
import AdminLayout from './components/Layout/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import Miembros from './pages/admin/Miembros.jsx'
import Beneficios from './pages/admin/Beneficios.jsx'
import Configuracion from './pages/admin/Configuracion.jsx'
import Reportes from './pages/admin/Reportes.jsx'
import Staff from './pages/admin/Staff.jsx'
import Merchandising from './pages/admin/Merchandising.jsx'
import Promociones from './pages/admin/Promociones.jsx'
import Auditoria from './pages/admin/Auditoria.jsx'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  
  if (!user) {
    const isMemberPath = window.location.pathname.startsWith('/member')
    return <Navigate to={isMemberPath ? "/member/login" : "/login"} replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/member/login" replace />
  if (user.role === 'ADMINISTRADOR') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'CAJERO') return <Navigate to="/cajero/buscar" replace />
  if (user.role === 'CLIENTE') return <Navigate to="/member/dashboard" replace />
  return <Navigate to="/member/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/member/dashboard" element={
            <ProtectedRoute allowedRoles={['CLIENTE']}>
              <MemberDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={<RoleRedirect />} />

          {/* CAJERO */}
          <Route path="/cajero" element={
            <ProtectedRoute allowedRoles={['CAJERO', 'ADMINISTRADOR']}>
              <CajeroLayout />
            </ProtectedRoute>
          }>
            <Route path="buscar" element={<BuscarMiembro />} />
            <Route path="registrar" element={<RegistrarMiembro />} />
            <Route path="compra" element={<RegistrarCompra />} />
            <Route path="canje" element={<AplicarCanje />} />
            <Route index element={<Navigate to="buscar" replace />} />
          </Route>

          {/* ADMIN */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="miembros" element={<Miembros />} />
            <Route path="beneficios" element={<Beneficios />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="staff" element={<Staff />} />
            <Route path="merchandising" element={<Merchandising />} />
            <Route path="promociones" element={<Promociones />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
