// frontend - src - pages - Login
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const CinepolisLogo = ({ white = false }) => (
  <svg viewBox="0 0 999.9999 226.39877" xmlns="http://www.w3.org/2000/svg" aria-label="Cinepolis">
    <g fill={white ? '#ffffff' : '#212E5C'} transform="matrix(1.1712163 0 0 -1.1712163 2 224.39875)">
      <path d="m54.9453 62.4922c-12.914 0-23.6406 9.1914-26.0508 21.4531l-28.8945-5.582c4.92969-25.832 27.6914-45.3125 54.9453-45.3125 15.5391 0 29.5469 6.3476 39.7305 16.5273l-23.6445 18.2774c-4.4883-3.2852-10.0665-5.3633-16.086-5.3633m0 53.0818c6.0195 0 11.5977-2.078 16.086-5.472l23.6445 18.277c-10.1836 10.176-24.1914 16.527-39.7305 16.527-27.2539 0-50.01561-19.484-54.9453-45.3122l28.8945-5.6915c2.3008 12.3677 13.0274 21.6717 26.0508 21.6717m398.5977-57.0232c-14.664 0-25.391 10.7265-27.031 26.4883v8.3164c1.64 15.5425 12.367 26.2655 27.031 26.2655 16.75 0 28.566-12.586 28.566-30.4218-.109-18.0625-11.816-30.6484-28.566-30.6484m8.648 86.3552c-14.886 0-27.25-6.457-35.789-17.402v14.992h-30.207v-142.496h30.207v50.6719c8.43-11.1641 20.903-17.6211 35.789-17.6211 28.567 0 49.25 23.2031 49.25 56.039 0 32.7232-20.683 55.8162-49.25 55.8162m119.735-86.3552c-16.09 0-29.551 14.0078-29.551 30.6484 0 16.5238 13.461 30.4218 29.551 30.4218 15.867 0 29.332-13.898 29.332-30.4218.109-16.6406-13.356-30.6484-29.332-30.6484m0 86.3552c-31.848 0-58.555-25.394-58.555-55.8162 0-30.4296 26.707-56.039 58.555-56.039 31.629 0 58.113 25.6094 58.113 56.039 0 30.4222-26.484 55.8162-58.113 55.8162m72.453-109.3396h30.203v144.4726h-30.203zm144.906 66.3286c-14.449 3.937-18.824 5.578-18.824 11.378 0 3.723 5.144 6.457 12.586 6.457 9.082 0 20.246-3.5 29.988-9.519l12.149 21.449c-11.821 7.883-26.926 13.246-42.137 13.246-25.172 0-41.918-14.449-41.809-34.695.219-21.1212 17.184-27.1446 39.071-32.5079 10.949-2.8437 18.824-4.9258 18.824-11.5976 0-4.7071-5.801-8.1016-13.899-8.1016-14.226 0-26.265 5.1445-35.789 12.0391l-12.914-20.793c12.805-10.2891 30.977-16.0898 48.157-16.0898 26.269 0 43.449 13.4609 43.449 34.4765 0 23.3125-20.465 29.5508-38.852 34.2583m-94.89-66.3286h30.207v106.9296h-30.207zm15.214 154.2106c-9.304 0-16.527-7.66-16.527-16.089 0-9.083 7.223-16.528 16.527-16.528 8.864 0 16.086 7.445 16.086 16.528.114 8.429-7.113 16.089-16.086 16.089m-365.004-9.851h-30.207l-11.273-22.981h30.207zm-49.359-79.02c3.942 10.727 13.461 17.403 24.844 17.403 12.262 0 20.027-6.786 22.984-17.403zm23.641 44.106c-31.192 0-55.051-23.418-55.051-55.5979 0-32.8321 24.844-56.2539 56.691-56.2539 15.762 0 34.149 6.5664 43.672 16.5273l-19.265 19.6992c-5.801-5.582-16.086-9.5195-24.625-9.5195-12.586 0-21.891 7.8789-25.391 19.4805h77.051c0 40.1643-19.594 65.6643-53.082 65.6643m-108.024-.106c-13.898 0-25.828-6.129-32.285-15.871v13.461h-30.207v-106.9296h30.207v63.3711c0 11.6015 9.957 20.5745 22.543 20.5745 12.043 0 20.25-9.082 20.25-22.3245v-61.6211h29.109v68.0786c.114 24.187-16.414 41.261-39.617 41.261m-98.828 44.981c-9.305 0-16.527-7.66-16.527-16.086 0-9.086 7.222-16.531 16.527-16.531 8.863 0 16.09 7.445 16.09 16.531 0 8.426-7.227 16.086-16.09 16.086m-15.324-154.3206h30.207v106.9296h-30.207z"/>
    </g>
  </svg>
)

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'ADMINISTRADOR') navigate('/admin/dashboard')
      else navigate('/cajero/buscar')
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float   {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes floatB  {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(14px) rotate(-2deg); }
        }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

        .cp-login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Barlow', sans-serif;
          background: #0b1220;
        }

        /* ── Left panel ── */
        .cp-left {
          flex: 1;
          background: #212E5C;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          animation: fadeIn 0.8s ease both;
        }
        .cp-left-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: .35; pointer-events: none;
        }

        /* geometric shapes */
        .cp-geo {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.07);
        }
        .cp-geo-1 { width: 420px; height: 420px; top: -140px; right: -140px; animation: float 9s ease-in-out infinite; }
        .cp-geo-2 { width: 260px; height: 260px; top: -60px; right: -60px; border-color: rgba(232,184,75,0.15); animation: float 9s ease-in-out infinite .4s; }
        .cp-geo-3 { width: 320px; height: 320px; bottom: -100px; left: -80px; animation: floatB 11s ease-in-out infinite; }
        .cp-geo-4 { width: 180px; height: 180px; bottom: -50px; left: -30px; border-color: rgba(232,184,75,0.12); animation: floatB 11s ease-in-out infinite .6s; }
        .cp-geo-dot {
          position: absolute;
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
        }

        /* left content */
        .cp-left-logo { width: 180px; position: relative; z-index: 2; }
        .cp-left-body  { position: relative; z-index: 2; }
        .cp-left-footer{ position: relative; z-index: 2; }

        .cp-tagline {
          font-size: 36px; font-weight: 700; color: #fff;
          line-height: 1.15; letter-spacing: -0.03em;
          margin-bottom: 16px;
        }
        .cp-tagline em { font-style: normal; color: #e8b84b; }
        .cp-sub {
          font-size: 15px; color: rgba(255,255,255,0.5);
          font-weight: 300; line-height: 1.6; max-width: 320px;
        }

        .cp-pills { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
        .cp-pill {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px; padding: 7px 14px;
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.7);
          backdrop-filter: blur(4px);
        }
        .cp-pill i { font-size: 14px; color: #e8b84b; }

        /* ── Right panel ── */
        .cp-right {
          width: 480px;
          flex-shrink: 0;
          background: #f4f5f8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          animation: slideUp 0.6s ease both 0.15s;
        }

        .cp-form-wrap {
          width: 100%;
          max-width: 360px;
        }

        .cp-form-header {
          margin-bottom: 36px;
        }
        .cp-form-header h2 {
          font-size: 26px; font-weight: 700; color: #0f1726;
          letter-spacing: -0.03em; margin-bottom: 6px;
        }
        .cp-form-header p {
          font-size: 14px; color: #8892aa; font-weight: 400;
        }

        .cp-field { margin-bottom: 18px; }
        .cp-field label {
          display: block; font-size: 12px; font-weight: 600;
          color: #374151; margin-bottom: 7px; letter-spacing: 0.02em;
        }
        .cp-field-wrap {
          position: relative;
        }
        .cp-field-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          font-size: 16px; color: #8892aa;
          pointer-events: none; transition: color 0.2s;
        }
        .cp-field-icon.focused { color: #212E5C; }
        .cp-input {
          width: 100%; height: 46px;
          border-radius: 10px;
          border: 1.5px solid #e2e5ef;
          background: #fff;
          padding: 0 44px;
          font-size: 14px; font-family: 'Barlow', sans-serif;
          color: #0f1726; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cp-input:focus {
          border-color: #212E5C;
          box-shadow: 0 0 0 4px rgba(33,46,92,0.1);
        }
        .cp-input::placeholder { color: #b0b8cc; }
        .cp-pass-toggle {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #8892aa; font-size: 17px; padding: 2px;
          transition: color 0.15s;
        }
        .cp-pass-toggle:hover { color: #212E5C; }

        .cp-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: #fff4f4; border: 1px solid #fca5a5;
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 20px; font-size: 13px; color: #c53030;
          animation: slideUp 0.2s ease both;
        }
        .cp-error i { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        .cp-btn {
          width: 100%; height: 48px;
          background: #212E5C; color: #fff;
          border: none; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          font-family: 'Barlow', sans-serif;
          cursor: pointer; margin-top: 8px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(33,46,92,0.25);
          letter-spacing: 0.01em;
        }
        .cp-btn:hover:not(:disabled) {
          background: #1a2449;
          box-shadow: 0 6px 22px rgba(33,46,92,0.35);
          transform: translateY(-1px);
        }
        .cp-btn:active:not(:disabled) { transform: translateY(0); }
        .cp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .cp-footer-note {
          margin-top: 32px;
          text-align: center;
          font-size: 12px; color: #b0b8cc;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .cp-footer-note i { font-size: 13px; }

        @media (max-width: 860px) {
          .cp-left { display: none; }
          .cp-right { width: 100%; padding: 32px 24px; }
        }
      `}</style>

      <div className="cp-login-root">

        {/* ── Left decorative panel ── */}
        <div className="cp-left">
          <div className="cp-left-noise" />
          <div className="cp-geo cp-geo-1" />
          <div className="cp-geo cp-geo-2" />
          <div className="cp-geo cp-geo-3" />
          <div className="cp-geo cp-geo-4" />
          {/* scatter dots */}
          {[[18,'22%','30%'],[8,'55%','18%'],[5,'75%','62%'],[9,'30%','78%'],[6,'85%','40%'],[7,'45%','88%']].map(([s,t,l],i) => (
            <div key={i} className="cp-geo-dot" style={{ width: s, height: s, top: t, left: l, animationDelay: `${i*0.3}s` }} />
          ))}

          <div className="cp-left-logo">
            <CinepolisLogo white />
          </div>

          <div className="cp-left-body">
            <h2 className="cp-tagline">
              El programa de<br />
              lealtad más <em>grande</em><br />
              del cine peruano.
            </h2>
            <p className="cp-sub">
              Gestiona membresías, beneficios y canjes del programa Ruta Cinépolis desde un solo panel.
            </p>
            <div className="cp-pills">
              <div className="cp-pill"><i className="ti ti-users" />Miembros</div>
              <div className="cp-pill"><i className="ti ti-gift" />Beneficios</div>
              <div className="cp-pill"><i className="ti ti-chart-bar" />Reportes</div>
              <div className="cp-pill"><i className="ti ti-crown" />Niveles</div>
            </div>
          </div>

          <div className="cp-left-footer">
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>
              © {new Date().getFullYear()} Cinépolis Perú · Uso interno
            </p>
          </div>
        </div>

        {/* ── Right login panel ── */}
        <div className="cp-right">
          <div className="cp-form-wrap">

            <div className="cp-form-header">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#212E5C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 4px 14px rgba(33,46,92,0.25)' }}>
                <i className="ti ti-movie" style={{ fontSize: '22px', color: '#e8b84b' }} aria-hidden="true" />
              </div>
              <h2>Bienvenido de vuelta</h2>
              <p>Ingresa tus credenciales para acceder al panel</p>
            </div>

            {error && (
              <div className="cp-error">
                <i className="ti ti-alert-circle" aria-hidden="true" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="cp-field">
                <label htmlFor="cp-email">Correo electrónico</label>
                <div className="cp-field-wrap">
                  <i className={`ti ti-mail cp-field-icon${focused === 'email' ? ' focused' : ''}`} aria-hidden="true" />
                  <input
                    id="cp-email"
                    className="cp-input"
                    type="email"
                    placeholder="usuario@cinepolis.com.pe"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="cp-field">
                <label htmlFor="cp-pass">Contraseña</label>
                <div className="cp-field-wrap">
                  <i className={`ti ti-lock cp-field-icon${focused === 'pass' ? ' focused' : ''}`} aria-hidden="true" />
                  <input
                    id="cp-pass"
                    className="cp-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused('')}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="cp-pass-toggle" onClick={() => setShowPass(p => !p)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <button type="submit" className="cp-btn" disabled={loading}>
                {loading
                  ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Ingresando…</>
                  : <><i className="ti ti-login" aria-hidden="true" /> Ingresar al panel</>
                }
              </button>
            </form>

            <div className="cp-footer-note">
              <i className="ti ti-shield-lock" aria-hidden="true" />
              Solo para uso interno del equipo Cinépolis Perú
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
