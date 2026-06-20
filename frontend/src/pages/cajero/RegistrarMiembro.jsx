// frontend - src - pages - cajero - RegistrarMiembro
import { useState, useEffect } from 'react'
import { registerMember, getLevels } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const LEVEL_META = {
  ESTANDAR: { bg: '#f8fafc', border: '#cbd5e1', activeBg: '#e8ecf5', activeBorder: NAVY,      activeText: NAVY,      icon: 'ti-user',      desc: 'Nivel de entrada, comienza a acumular puntos' },
  PREMIUM:  { bg: '#f8fafc', border: '#cbd5e1', activeBg: '#e8ecf5', activeBorder: NAVY,      activeText: NAVY,      icon: 'ti-user-star', desc: '10+ visitas, descuentos en entradas y dulceria' },
  GOLDEN:   { bg: '#fffbeb', border: '#fde68a', activeBg: '#fef9ec', activeBorder: '#d97706', activeText: '#92650a', icon: 'ti-crown',      desc: '25+ visitas, maximos beneficios y kit exclusivo' },
}

const inp = (err) => ({ height: '44px', borderRadius: '11px', border: `1.5px solid ${err ? '#fca5a5' : BORDER}`, padding: '0 14px', fontSize: '14px', outline: 'none', fontFamily: "'Barlow',sans-serif", background: err ? '#fff4f4' : '#fff', color: '#0f1726', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' })
const lbl = { fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cpPop    { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  .cp-reg * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 4px rgba(33,46,92,0.1) !important; }
  .cp-inp-err:focus { border-color:${RED} !important; box-shadow:0 0 0 4px rgba(229,62,62,0.1) !important; }
`

export default function RegistrarMiembro() {
  const [levels, setLevels]         = useState([])
  const [form, setForm]             = useState({ dni:'', firstName:'', lastName:'', email:'', phone:'', birthDate:'', levelId:'' })
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading]       = useState(false)
  const [levelsLoading, setLevelsLoading] = useState(true)

  useEffect(() => {
    setLevelsLoading(true)
    getLevels().then(data => {
      setLevels(data)
      if (data.length > 0) setForm(f => ({ ...f, levelId: data[0].id }))
    }).catch(() => setError('Error al cargar niveles de membresia'))
    .finally(() => setLevelsLoading(false))
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setFieldErrors({}); setResult(null); setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.email) delete payload.email
      if (!payload.phone) delete payload.phone
      if (!payload.birthDate) delete payload.birthDate
      const data = await registerMember(payload)
      setResult(data)
      setForm({ dni:'', firstName:'', lastName:'', email:'', phone:'', birthDate:'', levelId: levels[0]?.id || '' })
    } catch (err) {
      const res = err.response?.data
      setError(res?.error || 'Error al registrar')
      if (res?.errors) setFieldErrors(res.errors)
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-reg" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ marginBottom: '28px', animation: 'cpFadeUp 0.4s ease both' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Cajero — Operacion</p>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Registrar nuevo miembro</h1>
        </div>

        {/* Success */}
        {result && (
          <div style={{ background: '#f0faf5', border: '1px solid #6ee7b7', borderRadius: '20px', padding: '24px', marginBottom: '24px', animation: 'cpPop 0.35s cubic-bezier(.34,1.56,.64,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-check" style={{ fontSize: '24px', color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#065f46', margin: '0 0 2px' }}>Miembro registrado exitosamente</p>
                <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>Entrega la tarjeta al cliente</p>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 22px', border: '1px solid #a7f3d0' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Nombre del miembro</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#0f1726', margin: '0 0 16px', letterSpacing: '-0.01em' }}>{result.firstName} {result.lastName}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px' }}>Numero de tarjeta Ruta Cinepolis</p>
              <div style={{ background: '#f4f5f8', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '26px', fontFamily: 'monospace', fontWeight: 800, color: NAVY, letterSpacing: '0.15em', margin: 0 }}>
                  {result.cardNumber?.replace(/(.{4})/g,'$1 ').trim()}
                </p>
                <i className="ti ti-credit-card" style={{ fontSize: '28px', color: '#d1d5db' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: '#e8ecf5', color: NAVY }}>
                  {result.membership?.level?.displayName || 'Estandar'}
                </span>
                <span style={{ fontSize: '12px', color: '#8892aa' }}>nivel inicial asignado</span>
              </div>
            </div>
          </div>
        )}

        {/* Error general */}
        {error && (
          <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '12px', padding: '13px 16px', marginBottom: '16px', color: RED, fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
            <i className="ti ti-alert-circle" style={{ fontSize: '18px', flexShrink: 0 }} /> {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, padding: '28px', animation: 'cpFadeUp 0.45s ease both', animationDelay: '80ms' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Nivel */}
            <div>
              <label style={lbl}>Nivel de membresia *</label>
              {levelsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', color: '#8892aa', fontSize: '13px' }}>
                  <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
                  Cargando niveles...
                </div>
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {levels.map(level => {
                  const lm = LEVEL_META[level.name] || LEVEL_META.ESTANDAR
                  const isSelected = form.levelId === level.id
                  return (
                    <label key={level.id} style={{ cursor: 'pointer', border: `2px solid ${isSelected ? lm.activeBorder : lm.border}`, borderRadius: '14px', padding: '16px', background: isSelected ? lm.activeBg : lm.bg, transition: 'all 0.15s', userSelect: 'none' }}>
                      <input type="radio" name="level" value={level.id} checked={isSelected} onChange={set('levelId')} style={{ display: 'none' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${isSelected ? lm.activeBorder : '#94a3b8'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`ti ${lm.icon}`} style={{ fontSize: '20px', color: isSelected ? lm.activeText : '#94a3b8' }} />
                        </div>
                        <p style={{ fontWeight: 800, color: isSelected ? lm.activeText : '#374151', margin: 0, fontSize: '14px' }}>{level.displayName}</p>
                        <p style={{ fontSize: '11px', color: '#8892aa', margin: 0, lineHeight: 1.4 }}>{lm.desc}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
              )}
            </div>

            {/* DNI */}
            <div>
              <label style={lbl}>DNI *</label>
              <input className={fieldErrors.dni ? 'cp-inp-err' : 'cp-inp'} style={inp(fieldErrors.dni)} value={form.dni} onChange={set('dni')} maxLength={8} placeholder="12345678" required />
              {fieldErrors.dni && <p style={{ fontSize: '12px', color: RED, margin: '5px 0 0', fontWeight: 500 }}>{fieldErrors.dni[0]}</p>}
            </div>

            {/* Nombres */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={lbl}>Nombre *</label>
                <input className={fieldErrors.firstName ? 'cp-inp-err' : 'cp-inp'} style={inp(fieldErrors.firstName)} value={form.firstName} onChange={set('firstName')} placeholder="Ana" required />
                {fieldErrors.firstName && <p style={{ fontSize: '12px', color: RED, margin: '5px 0 0', fontWeight: 500 }}>{fieldErrors.firstName[0]}</p>}
              </div>
              <div>
                <label style={lbl}>Apellido *</label>
                <input className={fieldErrors.lastName ? 'cp-inp-err' : 'cp-inp'} style={inp(fieldErrors.lastName)} value={form.lastName} onChange={set('lastName')} placeholder="Garcia" required />
                {fieldErrors.lastName && <p style={{ fontSize: '12px', color: RED, margin: '5px 0 0', fontWeight: 500 }}>{fieldErrors.lastName[0]}</p>}
              </div>
            </div>

            {/* Opcionales */}
            <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '18px', border: `1px dashed ${BORDER}` }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ti ti-info-circle" style={{ fontSize: '14px' }} /> Datos opcionales
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ ...lbl, color: '#8892aa' }}>Correo</label>
                  <input className="cp-inp" style={{ ...inp(false), background: '#fff' }} type="email" value={form.email} onChange={set('email')} placeholder="ana@gmail.com" />
                </div>
                <div>
                  <label style={{ ...lbl, color: '#8892aa' }}>Telefono</label>
                  <input className="cp-inp" style={{ ...inp(false), background: '#fff' }} value={form.phone} onChange={set('phone')} placeholder="987654321" />
                </div>
              </div>
              <div>
                <label style={{ ...lbl, color: '#8892aa' }}>Fecha de nacimiento</label>
                <input className="cp-inp" style={{ ...inp(false), background: '#fff', width: '50%' }} type="date" value={form.birthDate} onChange={set('birthDate')} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ height: '52px', borderRadius: '13px', background: loading ? '#8892aa' : NAVY, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: loading ? 'none' : '0 4px 16px rgba(33,46,92,0.25)', transition: 'all 0.15s' }}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: '20px' }} /> Registrando...</>
                : <><i className="ti ti-user-check" style={{ fontSize: '20px' }} /> Registrar miembro</>
              }
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
