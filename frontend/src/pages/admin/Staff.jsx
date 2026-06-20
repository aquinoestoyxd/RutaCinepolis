// frontend - src - pages - admin - Staff
import { useState, useEffect } from 'react'
import { getStaff, createStaff, toggleStaffStatus } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'
const inp = { height: '42px', borderRadius: '10px', border: `1.5px solid ${BORDER}`, padding: '0 13px', fontSize: '13px', outline: 'none', fontFamily: "'Barlow',sans-serif", background: '#fff', color: '#0f1726', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }
const btnP = { height: '42px', padding: '0 20px', borderRadius: '10px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '7px' }
const btnS = { height: '42px', padding: '0 18px', borderRadius: '10px', background: '#fff', color: NAVY, border: `1.5px solid ${BORDER}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px' }

const ROLE = {
  CAJERO:        { bg: '#e8ecf5', color: NAVY,     label: 'Cajero',         icon: 'ti-user-check'  },
  ADMINISTRADOR: { bg: '#fef9ec', color: '#92650a', label: 'Administrador', icon: 'ti-shield-check' },
}

const getInitials = email => {
  const p = email?.split('@')[0].split('.')
  return p?.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : (email?.slice(0,2).toUpperCase() || '??')
}

const AVATAR_COLORS = [
  ['#e8ecf5', NAVY], ['#fef9ec','#92650a'], ['#f0faf5', '#1a7048'],
  ['#f3f0fe','#5b21b6'], ['#fff4f4','#c53030'],
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .cp-st * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-strow:hover td { background:#fafbff !important; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
  .cp-tgl:hover { opacity:0.8; }
`

export default function Staff() {
  const [staff, setStaff]         = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ email: '', password: '', role: 'CAJERO' })
  const [showPass, setShowPass]   = useState(false)
  const [msg, setMsg]             = useState({ text: '', type: 'success' })
  const [loading, setLoading]     = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [toggling, setToggling]   = useState(null)

  const load = async () => {
    setLoadingList(true)
    try { setStaff(await getStaff()) } catch { setMsg({ text: 'Error al cargar staff', type: 'error' }) }
    finally { setLoadingList(false) }
  }
  useEffect(() => { load() }, [])

  const showNotif = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3500) }

  const handleCreate = async e => {
    e.preventDefault(); setLoading(true)
    try { await createStaff(form); showNotif('Usuario creado'); setShowModal(false); setForm({ email:'', password:'', role:'CAJERO' }); load() }
    catch (err) { showNotif(err.response?.data?.error || 'Error', 'error') }
    finally { setLoading(false) }
  }

  const handleToggle = async (id, isActive) => {
    setToggling(id)
    try { await toggleStaffStatus(id); showNotif(`Usuario ${isActive ? 'desactivado' : 'activado'}`); load() }
    catch { showNotif('Error al cambiar estado', 'error') }
    finally { setToggling(null) }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-st" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Administracion</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Staff</h1>
          </div>
          <button style={btnP} onClick={() => setShowModal(true)}>
            <i className="ti ti-user-plus" /> Nuevo usuario
          </button>
        </div>

        {msg.text && (
          <div style={{ marginBottom: '16px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: msg.type==='error'?'#fff4f4':'#f0faf5', border: `1px solid ${msg.type==='error'?'#fca5a5':'#c6f0db'}`, color: msg.type==='error'?RED:GREEN, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
            <i className={`ti ${msg.type==='error'?'ti-alert-circle':'ti-circle-check'}`} style={{ fontSize: '17px' }} /> {msg.text}
          </div>
        )}

        {/* Cards de staff */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px', animation: 'cpFadeUp 0.4s ease both', animationDelay: '80ms' }}>
          {loadingList ? (
            <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '56px', textAlign: 'center' }}>
              <i className="ti ti-loader-2" style={{ fontSize: '36px', color: NAVY, display: 'block', margin: '0 auto 14px', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#8892aa', margin: 0, fontSize: '14px', fontWeight: 500 }}>Cargando staff...</p>
            </div>
          ) : staff.length === 0 ? (
            <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '56px', textAlign: 'center' }}>
              <i className="ti ti-users" style={{ fontSize: '40px', display: 'block', margin: '0 auto 12px', color: '#d1d5db' }} />
              <p style={{ color: '#8892aa', margin: 0, fontSize: '14px', fontWeight: 500 }}>No hay usuarios de staff registrados</p>
            </div>
          ) : staff.map((st, idx) => {
            const rm = ROLE[st.role] || ROLE.CAJERO
            const [avatarBg, avatarText] = AVATAR_COLORS[idx % AVATAR_COLORS.length]
            return (
              <div key={st.id} style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '20px 22px', animation: 'cpFadeUp 0.4s ease both', animationDelay: `${idx * 60}ms`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: st.isActive ? GREEN : '#d1d5db' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: avatarText, flexShrink: 0 }}>
                      {getInitials(st.email)}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: '0 0 3px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.email}</p>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: rm.bg, color: rm.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className={`ti ${rm.icon}`} style={{ fontSize: '11px' }} /> {rm.label}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: st.isActive?'#f0faf5':'#f8f9fa', color: st.isActive?GREEN:'#6b7280', flexShrink: 0 }}>
                    {st.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#8892aa', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ultimo acceso</p>
                    <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
                      {st.lastLoginAt ? new Date(st.lastLoginAt).toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}) : <span style={{ fontStyle: 'italic', color: '#b0b8cc' }}>Nunca</span>}
                    </p>
                  </div>
                  <button className="cp-tgl" onClick={() => handleToggle(st.id, st.isActive)} disabled={toggling === st.id}
                    style={{ height: '34px', padding: '0 14px', borderRadius: '8px', border: 'none', cursor: toggling === st.id ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: "'Barlow',sans-serif", background: st.isActive?'#fff4f4':'#f0faf5', color: st.isActive?RED:GREEN, display: 'flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.15s', opacity: toggling === st.id ? 0.5 : 1 }}>
                    {toggling === st.id ? <i className="ti ti-loader-2" style={{ fontSize: '14px', animation: 'spin 1s linear infinite' }} /> : <i className={`ti ${st.isActive ? 'ti-user-x' : 'ti-user-check'}`} style={{ fontSize: '14px' }} />}
                    {toggling === st.id ? '...' : (st.isActive ? 'Desactivar' : 'Activar')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', animation: 'cpFadeUp 0.25s ease both' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f1726', margin: '0 0 22px', letterSpacing: '-0.02em' }}>Nuevo usuario de staff</h3>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px' }}>Correo electronico</label>
                  <input className="cp-inp" style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required placeholder="cajero@cinepolis.com.pe" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px' }}>Contrasena temporal</label>
                  <div style={{ position: 'relative' }}>
                    <input className="cp-inp" style={{ ...inp, paddingRight: '44px' }} type={showPass?'text':'password'} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} minLength={8} required />
                    <button type="button" onClick={() => setShowPass(p=>!p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8892aa', fontSize: '17px', padding: '2px', display: 'flex' }}>
                      <i className={`ti ${showPass?'ti-eye-off':'ti-eye'}`} />
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#8892aa', margin: '5px 0 0' }}>Min. 8 caracteres, 1 mayuscula, 1 numero</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px' }}>Rol</label>
                  <select className="cp-inp" style={inp} value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                    <option value="CAJERO">Cajero</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="button" style={{ ...btnS, flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" style={{ ...btnP, flex: 1, justifyContent: 'center', opacity: loading?0.6:1 }} disabled={loading}>
                    {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-user-plus" />}
                    {loading ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
