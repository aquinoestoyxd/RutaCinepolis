// frontend - src - pages - admin - Miembros
import { useState, useEffect, useCallback } from 'react'
import { getMembers, updateMemberStatus, adjustPoints } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const LEVEL = {
  ESTANDAR: { bg: '#f1f5f9', color: '#475569', label: 'Estandar', dot: '#94a3b8' },
  PREMIUM:  { bg: '#e8ecf5', color: NAVY,      label: 'Premium',  dot: NAVY      },
  GOLDEN:   { bg: '#fef9ec', color: '#92650a', label: 'Golden',   dot: GOLD      },
}
const STATUS = {
  ACTIVE:    { bg: '#f0faf5', color: GREEN,    label: 'Activo',     dot: GREEN  },
  INACTIVE:  { bg: '#f8f9fa', color: '#6b7280', label: 'Inactivo',  dot: '#9ca3af' },
  SUSPENDED: { bg: '#fff4f4', color: RED,      label: 'Suspendido', dot: RED   },
}

const inp = { height: '40px', borderRadius: '9px', border: `1.5px solid ${BORDER}`, padding: '0 13px', fontSize: '13px', outline: 'none', fontFamily: "'Barlow',sans-serif", background: '#fff', color: '#0f1726', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }
const btnP = { height: '40px', padding: '0 20px', borderRadius: '9px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '7px', transition: 'opacity 0.15s', letterSpacing: '0.01em' }
const btnS = { height: '40px', padding: '0 16px', borderRadius: '9px', background: '#fff', color: NAVY, border: `1.5px solid ${BORDER}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'border-color 0.15s' }

function Badge({ map, value }) {
  const m = map[value] || { bg: '#f1f5f9', color: '#6b7280', label: value, dot: '#9ca3af' }
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: m.bg, color: m.color, display: 'inline-flex', alignItems: 'center', gap: '5px', letterSpacing: '0.03em' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: m.dot, flexShrink: 0, display: 'inline-block' }} />
      {m.label}
    </span>
  )
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', animation: 'cpFadeUp 0.25s ease both' }}>
        <div style={{ marginBottom: '22px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f1726', margin: '0 0 5px', letterSpacing: '-0.02em' }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '13px', color: '#8892aa', margin: 0 }}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .cp-mb * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-tr:hover td { background:#fafbff !important; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
`

export default function Miembros() {
  const [data, setData]             = useState({ members: [], total: 0 })
  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState('')
  const [levelName, setLevelName]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState(null)
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ delta: '', reason: '' })
  const [msg, setMsg]               = useState({ text: '', type: 'success' })

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3500) }

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await getMembers({ search: search || undefined, status: status || undefined, levelName: levelName || undefined, page, limit: 20 })
      setData(res)
    } catch {} finally { setLoading(false) }
  }, [search, status, levelName])

  useEffect(() => { load(1) }, [load])

  const handleStatus = async (id, newStatus) => {
    try { await updateMemberStatus(id, newStatus); showMsg('Estado actualizado'); load(data.meta?.page || 1); setSelected(null) }
    catch (err) { showMsg(err.response?.data?.error || 'Error', 'error') }
  }

  const handleAdjust = async () => {
    try { await adjustPoints(adjustModal.id, parseInt(adjustForm.delta), adjustForm.reason); showMsg('Puntos ajustados'); setAdjustModal(null); setAdjustForm({ delta:'', reason:'' }); load() }
    catch (err) { showMsg(err.response?.data?.error || 'Error', 'error') }
  }

  const totalPages  = Math.ceil((data.meta?.total || data.total || 0) / 20)
  const currentPage = data.meta?.page || data.page || 1
  const members     = data.members || data.data || []

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-mb" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Administracion</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Miembros</h1>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '9px 16px', fontSize: '13px', color: '#8892aa', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-users" style={{ color: NAVY, fontSize: '15px' }} />
            <strong style={{ color: NAVY }}>{(data.meta?.total || data.total || 0).toLocaleString()}</strong> miembros registrados
          </div>
        </div>

        {/* Toast */}
        {msg.text && (
          <div style={{ marginBottom: '16px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', background: msg.type === 'error' ? '#fff4f4' : '#f0faf5', border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#c6f0db'}`, color: msg.type === 'error' ? RED : GREEN, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease', fontWeight: 500 }}>
            <i className={`ti ${msg.type === 'error' ? 'ti-alert-circle' : 'ti-circle-check'}`} style={{ fontSize: '17px' }} />
            {msg.text}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', animation: 'cpFadeUp 0.4s ease both', animationDelay: '60ms' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8892aa', fontSize: '15px', pointerEvents: 'none' }} />
            <input className="cp-inp" style={{ ...inp, width: '100%', paddingLeft: '36px' }} placeholder="Buscar por nombre, DNI o tarjeta..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="cp-inp" style={{ ...inp, width: '170px' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
          <select className="cp-inp" style={{ ...inp, width: '155px' }} value={levelName} onChange={e => setLevelName(e.target.value)}>
            <option value="">Todos los niveles</option>
            <option value="ESTANDAR">Estandar</option>
            <option value="PREMIUM">Premium</option>
            <option value="GOLDEN">Golden</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, overflow: 'hidden', animation: 'cpFadeUp 0.4s ease both', animationDelay: '120ms' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#fafbff', borderBottom: `1px solid ${BORDER}` }}>
                {['Miembro','DNI','Tarjeta','Nivel','Puntos','Visitas','Estado','Acciones'].map((h,i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i>=4&&i<6?'right':'left', fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#8892aa' }}>
                  <i className="ti ti-loader-2" style={{ fontSize: '22px', animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                  Cargando miembros...
                </td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '56px', textAlign: 'center' }}>
                  <i className="ti ti-users-off" style={{ fontSize: '36px', display: 'block', margin: '0 auto 10px', color: '#d1d5db' }} />
                  <p style={{ color: '#8892aa', margin: 0, fontSize: '14px', fontWeight: 500 }}>No se encontraron miembros</p>
                </td></tr>
              ) : members.map(m => (
                <tr key={m.id} className="cp-tr">
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: NAVY, flexShrink: 0 }}>
                        {`${m.firstName?.[0]||''}${m.lastName?.[0]||''}`}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f1726', margin: 0, fontSize: '13px' }}>{m.firstName} {m.lastName}</p>
                        {m.email && <p style={{ fontSize: '11px', color: '#8892aa', margin: 0 }}>{m.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontWeight: 500 }}>{m.dni}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#8892aa', letterSpacing: '0.08em' }}>
                    {m.cardNumber?.replace(/(.{4})/g,'$1 ').trim()}
                  </td>
                  <td style={{ padding: '14px 16px' }}><Badge map={LEVEL} value={m.membership?.level?.name} /></td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: NAVY, fontSize: '14px' }}>{(m.membership?.points ?? 0).toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>{m.membership?.totalVisits ?? 0}</td>
                  <td style={{ padding: '14px 16px' }}><Badge map={STATUS} value={m.status} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setAdjustModal(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: NAVY, padding: 0, fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-adjustments-horizontal" style={{ fontSize: '14px' }} /> Puntos
                      </button>
                      <button onClick={() => setSelected(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#8892aa', padding: 0, fontFamily: "'Barlow',sans-serif" }}>
                        Estado
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ padding: '13px 18px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#8892aa' }}>
              <span>Total: <strong style={{ color: '#374151' }}>{(data.meta?.total || data.total || 0).toLocaleString()}</strong> miembros</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button style={{ ...btnS, height: '34px', padding: '0 14px', fontSize: '12px' }} onClick={() => load(currentPage-1)} disabled={currentPage<=1}>
                  <i className="ti ti-chevron-left" /> Anterior
                </button>
                <span style={{ padding: '0 10px', fontWeight: 700, color: NAVY }}>{currentPage} / {totalPages}</span>
                <button style={{ ...btnS, height: '34px', padding: '0 14px', fontSize: '12px' }} onClick={() => load(currentPage+1)} disabled={currentPage>=totalPages}>
                  Siguiente <i className="ti ti-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal estado */}
        {selected && (
          <Modal title={`Estado — ${selected.firstName} ${selected.lastName}`} subtitle="Selecciona el nuevo estado del miembro" onClose={() => setSelected(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {['ACTIVE','INACTIVE','SUSPENDED'].map(s => {
                const m = STATUS[s]; const isAct = selected.status === s
                return (
                  <button key={s} onClick={() => handleStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', border: `2px solid ${isAct ? m.color : BORDER}`, background: isAct ? m.bg : '#fff', cursor: 'pointer', fontFamily: "'Barlow',sans-serif", fontWeight: isAct ? 800 : 500, fontSize: '14px', color: isAct ? m.color : '#374151', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
                      {m.label}
                    </div>
                    {isAct && <i className="ti ti-check" style={{ fontSize: '17px' }} />}
                  </button>
                )
              })}
            </div>
            <button style={{ ...btnS, width: '100%', justifyContent: 'center' }} onClick={() => setSelected(null)}>Cancelar</button>
          </Modal>
        )}

        {/* Modal ajuste puntos */}
        {adjustModal && (
          <Modal title="Ajuste de puntos" subtitle={`${adjustModal.firstName} ${adjustModal.lastName} · ${(adjustModal.membership?.points ?? 0).toLocaleString()} pts actuales`} onClose={() => setAdjustModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px' }}>Cantidad <span style={{ fontWeight: 400, color: '#8892aa' }}>(+ suma / - resta)</span></label>
                <input className="cp-inp" style={{ ...inp, width: '100%' }} type="number" value={adjustForm.delta} onChange={e => setAdjustForm(f => ({ ...f, delta: e.target.value }))} placeholder="ej: 50 o -20" />
                {adjustForm.delta && !isNaN(parseInt(adjustForm.delta)) && (
                  <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '9px', background: '#f4f5f8', fontSize: '13px', color: '#374151' }}>
                    Saldo resultante: <strong style={{ color: NAVY, fontSize: '15px' }}>{((adjustModal.membership?.points ?? 0) + parseInt(adjustForm.delta)).toLocaleString()} pts</strong>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px' }}>Razon del ajuste *</label>
                <input className="cp-inp" style={{ ...inp, width: '100%' }} value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="ej: Compensacion por error en POS" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...btnS, flex: 1, justifyContent: 'center' }} onClick={() => setAdjustModal(null)}>Cancelar</button>
              <button style={{ ...btnP, flex: 1, justifyContent: 'center', opacity: (!adjustForm.delta || !adjustForm.reason) ? 0.45 : 1 }} onClick={handleAdjust} disabled={!adjustForm.delta || !adjustForm.reason}>
                <i className="ti ti-check" /> Aplicar ajuste
              </button>
            </div>
          </Modal>
        )}
      </div>
    </>
  )
}
