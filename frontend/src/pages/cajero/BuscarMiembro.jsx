// frontend - src - pages - cajero - BuscarMiembro
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { posLookup } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const LEVEL_META = {
  ESTANDAR: { bg: '#f1f5f9', color: '#475569', label: 'Estandar', icon: 'ti-user',      ring: '#cbd5e1', gradient: ['#f8fafc','#e2e8f0'] },
  PREMIUM:  { bg: '#e8ecf5', color: NAVY,      label: 'Premium',  icon: 'ti-user-star', ring: '#93a8d4', gradient: ['#eef1f9','#c7d2e8'] },
  GOLDEN:   { bg: '#fef9ec', color: '#92650a', label: 'Golden',   icon: 'ti-crown',     ring: '#f5d27a', gradient: ['#fffbeb','#fef3c7'] },
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cpPop    { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .cp-caj * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 4px rgba(33,46,92,0.1) !important; }
  .cp-scan-btn:hover { background:#1a2449 !important; box-shadow:0 6px 20px rgba(33,46,92,0.35) !important; transform:translateY(-1px); }
  .cp-stat-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(33,46,92,0.1); }
  .cp-stat-card { transition:transform 0.2s, box-shadow 0.2s; }
`

export default function BuscarMiembro() {
  const navigate              = useNavigate()
  const [card, setCard]       = useState('')
  const [member, setMember]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const formatCard = v => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19)

  const handleSearch = async e => {
    e.preventDefault()
    setError(''); setMember(null); setLoading(true)
    try {
      const data = await posLookup(card.replace(/\s/g,''))
      setMember(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Tarjeta no encontrada')
    } finally { setLoading(false) }
  }

  const levelName = member?.membership?.level?.name
  const meta      = LEVEL_META[levelName] || LEVEL_META.ESTANDAR
  const isActive  = member?.status === 'ACTIVE'
  const progress  = member ? (() => {
    const visits = member.membership?.totalVisits ?? 0
    if (levelName === 'GOLDEN') return { pct: 100, label: 'Nivel maximo', next: null }
    const thresholds = { ESTANDAR: [0, 10], PREMIUM: [10, 25] }
    const [min, max] = thresholds[levelName] || [0, 10]
    const pct = Math.min(100, Math.round(((visits - min) / (max - min)) * 100))
    const nextLevel = levelName === 'ESTANDAR' ? 'Premium' : 'Golden'
    return { pct, label: `${visits - min} / ${max - min} visitas para ${nextLevel}`, next: nextLevel }
  })() : null

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-caj" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px', animation: 'cpFadeUp 0.4s ease both' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Cajero — Operacion</p>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Identificar miembro</h1>
        </div>

        {/* Search card */}
        <div style={{ background: '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, padding: '28px', marginBottom: '20px', animation: 'cpFadeUp 0.45s ease both', animationDelay: '60ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-credit-card" style={{ fontSize: '20px', color: NAVY }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: 0 }}>Numero de tarjeta RC</p>
              <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Ingresa o escanea la tarjeta del cliente</p>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <i className="ti ti-credit-card" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8892aa', fontSize: '18px', pointerEvents: 'none' }} />
                <input className="cp-inp" style={{ width: '100%', height: '52px', borderRadius: '12px', border: `1.5px solid ${BORDER}`, paddingLeft: '44px', paddingRight: '16px', fontSize: '18px', fontFamily: 'monospace', letterSpacing: '0.12em', outline: 'none', color: '#0f1726', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                  placeholder="5890 0000 0000 0000"
                  value={card}
                  onChange={e => setCard(formatCard(e.target.value))}
                  maxLength={19}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="cp-scan-btn"
                disabled={loading || card.replace(/\s/g,'').length < 16}
                style={{ height: '52px', padding: '0 28px', borderRadius: '12px', background: NAVY, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 4px 16px rgba(33,46,92,0.25)', transition: 'all 0.15s', opacity: card.replace(/\s/g,'').length < 16 ? 0.5 : 1 }}>
                {loading
                  ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: '18px' }} />
                  : <i className="ti ti-search" style={{ fontSize: '18px' }} />
                }
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>

          {error && (
            <div style={{ marginTop: '14px', padding: '13px 16px', borderRadius: '12px', background: '#fff4f4', border: '1px solid #fca5a5', color: RED, fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '18px', flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        {/* Member card */}
        {member && (
          <div style={{ animation: 'cpPop 0.35s cubic-bezier(.34,1.56,.64,1) both' }}>

            {/* Status warning */}
            {!isActive && (
              <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '14px', padding: '14px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: RED }}>
                <i className="ti ti-ban" style={{ fontSize: '20px' }} />
                <div>
                  <p style={{ margin: '0 0 2px' }}>Miembro {member.status === 'SUSPENDED' ? 'suspendido' : 'inactivo'}</p>
                  <p style={{ margin: 0, fontWeight: 400, color: '#b91c1c' }}>No puede realizar transacciones en este estado</p>
                </div>
              </div>
            )}

            {/* Profile card con gradiente segun nivel */}
            <div style={{ background: `linear-gradient(135deg, ${meta.gradient[0]}, ${meta.gradient[1]})`, borderRadius: '20px', border: `1px solid ${meta.ring}33`, padding: '26px', marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
              {/* decorative circle */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: '160px', height: '160px', borderRadius: '50%', background: `${meta.color}08`, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '62px', height: '62px', borderRadius: '16px', background: `${meta.color}18`, border: `2px solid ${meta.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: meta.color }}>
                    {`${member.firstName?.[0]||''}${member.lastName?.[0]||''}`}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f1726', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                      {member.firstName} {member.lastName}
                    </h2>
                    <p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#6b7280', margin: '0 0 4px', letterSpacing: '0.08em' }}>
                      {member.cardNumber?.replace(/(.{4})/g,'$1 ').trim()}
                    </p>
                    {member.email && <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>{member.email}</p>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: meta.bg, color: meta.color, border: `1px solid ${meta.ring}`, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className={`ti ${meta.icon}`} style={{ fontSize: '13px' }} />
                    {meta.label}
                  </span>
                  <p style={{ fontSize: '11px', color: isActive ? GREEN : RED, fontWeight: 700, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <i className={`ti ${isActive ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ fontSize: '13px' }} />
                    {isActive ? 'Activo' : member.status}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', position: 'relative', zIndex: 1 }}>
                {[
                  { label: 'Puntos disponibles', value: (member.membership?.points ?? 0).toLocaleString(), icon: 'ti-star-filled', color: GOLD, big: true },
                  { label: 'Visitas totales',     value: member.membership?.totalVisits ?? 0,               icon: 'ti-ticket',    color: NAVY },
                  { label: 'Nivel actual',        value: meta.label,                                        icon: meta.icon,      color: meta.color },
                ].map((stat, i) => (
                  <div key={i} className="cp-stat-card" style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: `1px solid ${BORDER}`, textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <i className={`ti ${stat.icon}`} style={{ fontSize: '18px', color: stat.color }} />
                    </div>
                    <p style={{ fontSize: stat.big ? '24px' : '18px', fontWeight: 800, color: stat.big ? stat.color : '#0f1726', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.value}</p>
                    <p style={{ fontSize: '11px', color: '#8892aa', margin: 0, fontWeight: 500 }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {progress && progress.next && (
                <div style={{ marginTop: '16px', padding: '14px 16px', background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>{progress.label}</p>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color }}>{progress.pct}%</span>
                  </div>
                  <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress.pct}%`, height: '100%', background: `linear-gradient(90deg, ${NAVY}, ${meta.color})`, borderRadius: '4px', transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            {isActive && (
              <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, padding: '18px 20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Acciones rapidas</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  {[
                    { label: 'Registrar compra',  icon: 'ti-shopping-cart', to: '/cajero/compra', color: NAVY  },
                    { label: 'Aplicar canje',      icon: 'ti-gift',          to: '/cajero/canje',  color: '#8b5cf6' },
                    { label: 'Nuevo miembro',      icon: 'ti-user-plus',     to: '/cajero/registrar', color: GREEN },
                  ].map(action => (
                    <button key={action.to} onClick={() => navigate(action.to)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 10px', borderRadius: '12px', border: `1.5px solid ${BORDER}`, background: '#fff', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Barlow',sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = `${action.color}06` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#fff' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${action.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={`ti ${action.icon}`} style={{ fontSize: '18px', color: action.color }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
