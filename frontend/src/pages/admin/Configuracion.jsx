// frontend - src - pages - admin - Configuracion
import { useState, useEffect } from 'react'
import { getConfig, upsertConfig } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', BORDER = '#eaecf3', BG = '#f4f5f8'

const CONFIG_META = {
  POINTS_RATE:               { label: 'Tasa de acumulacion de puntos', hint: '% del monto de compra → puntos', icon: 'ti-coins', group: 'Puntos', color: GOLD    },
  PREMIUM_VISITS_THRESHOLD:  { label: 'Visitas para nivel Premium',    hint: 'Visitas necesarias para subir de Estandar a Premium', icon: 'ti-award',  group: 'Niveles', color: NAVY   },
  GOLDEN_VISITS_THRESHOLD:   { label: 'Visitas para nivel Golden',     hint: 'Visitas necesarias para subir de Premium a Golden', icon: 'ti-crown',  group: 'Niveles', color: GOLD   },
  DISCOUNT_TICKET_PREMIUM:   { label: 'Descuento entradas — Premium',  hint: 'Porcentaje de descuento en entradas', icon: 'ti-ticket', group: 'Descuentos Premium', color: NAVY   },
  DISCOUNT_CANDY_PREMIUM:    { label: 'Descuento dulceria — Premium',  hint: 'Porcentaje de descuento en dulceria', icon: 'ti-candy',  group: 'Descuentos Premium', color: NAVY   },
  DISCOUNT_TICKET_GOLDEN:    { label: 'Descuento entradas — Golden',   hint: 'Porcentaje de descuento en entradas', icon: 'ti-ticket', group: 'Descuentos Golden',  color: GOLD   },
  DISCOUNT_CANDY_GOLDEN:     { label: 'Descuento dulceria — Golden',   hint: 'Porcentaje de descuento en dulceria', icon: 'ti-candy',  group: 'Descuentos Golden',  color: GOLD   },
  POINTS_REDEMPTION_RATE:    { label: 'Puntos para canjear 1 entrada', hint: 'Cantidad exacta de puntos necesarios', icon: 'ti-refresh', group: 'Canjes', color: GREEN  },
}

const formatValue = (key, value) => {
  const pct = ['POINTS_RATE','DISCOUNT_TICKET_PREMIUM','DISCOUNT_CANDY_PREMIUM','DISCOUNT_TICKET_GOLDEN','DISCOUNT_CANDY_GOLDEN']
  if (pct.includes(key)) return `${(parseFloat(value) * 100).toFixed(0)}%`
  const meta = CONFIG_META[key]
  if (key.includes('THRESHOLD')) return `${value} visitas`
  if (key === 'POINTS_REDEMPTION_RATE') return `${value} pts`
  return value
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .cp-cfg * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-cfgrow { transition:background 0.12s; }
  .cp-cfgrow:hover { background:#fafbff; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
`

export default function Configuracion() {
  const [configs, setConfigs] = useState([])
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [msg, setMsg]         = useState({ text: '', type: 'success' })
  const [loading, setLoading] = useState(false)

  const load = async () => { try { setConfigs(await getConfig()) } catch {} }
  useEffect(() => { load() }, [])

  const handleSave = async key => {
    setLoading(true)
    try {
      await upsertConfig(key, editValue, configs.find(c=>c.key===key)?.description)
      setMsg({ text: 'Configuracion actualizada', type: 'success' }); setEditing(null); load()
      setTimeout(() => setMsg({ text: '' }), 3500)
    } catch (err) { setMsg({ text: err.response?.data?.error || 'Error', type: 'error' }) }
    finally { setLoading(false) }
  }

  const grouped = configs.reduce((acc, c) => {
    const g = CONFIG_META[c.key]?.group || 'Otros'
    if (!acc[g]) acc[g] = []
    acc[g].push(c); return acc
  }, {})

  const groupColors = {
    'Puntos': GOLD, 'Niveles': NAVY, 'Descuentos Premium': NAVY,
    'Descuentos Golden': GOLD, 'Canjes': '#27a86a',
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-cfg" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ marginBottom: '28px', animation: 'cpFadeUp 0.4s ease both' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Sistema</p>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: '0 0 8px', lineHeight: 1 }}>Configuracion</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#fef9ec', border: '1px solid #f5d27a', borderRadius: '10px', width: 'fit-content' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '15px', color: '#92650a' }} />
            <p style={{ fontSize: '13px', color: '#92650a', margin: 0, fontWeight: 500 }}>Todos los cambios quedan registrados en auditoria</p>
          </div>
        </div>

        {msg.text && (
          <div style={{ marginBottom: '20px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: msg.type==='error'?'#fff4f4':'#f0faf5', border: `1px solid ${msg.type==='error'?'#fca5a5':'#c6f0db'}`, color: msg.type==='error'?'#e53e3e':'#27a86a', display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
            <i className={`ti ${msg.type==='error'?'ti-alert-circle':'ti-circle-check'}`} style={{ fontSize: '17px' }} /> {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
          {Object.entries(grouped).map(([group, items], gi) => {
            const gc = groupColors[group] || NAVY
            return (
              <div key={group} style={{ animation: 'cpFadeUp 0.4s ease both', animationDelay: `${gi * 80}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: gc, display: 'inline-block' }} />
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{group}</p>
                </div>
                <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                  {items.map((c, idx) => {
                    const meta = CONFIG_META[c.key]
                    const isEdit = editing === c.key
                    return (
                      <div key={c.key} className="cp-cfgrow" style={{ padding: '18px 22px', borderBottom: idx<items.length-1?`1px solid ${BORDER}`:'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `${meta?.color||NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`ti ${meta?.icon||'ti-settings'}`} style={{ fontSize: '19px', color: meta?.color||NAVY }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: '0 0 3px' }}>{meta?.label || c.key}</p>
                          {meta?.hint && <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>{meta.hint}</p>}
                        </div>
                        {isEdit ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <input className="cp-inp" style={{ height: '38px', width: '120px', borderRadius: '9px', border: `1.5px solid ${BORDER}`, padding: '0 12px', fontSize: '14px', fontWeight: 700, outline: 'none', fontFamily: "'Barlow',sans-serif", textAlign: 'right', color: '#0f1726' }} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                            <button onClick={() => handleSave(c.key)} disabled={loading} style={{ height: '38px', padding: '0 16px', borderRadius: '9px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif" }}>
                              {loading ? '...' : 'Guardar'}
                            </button>
                            <button onClick={() => setEditing(null)} style={{ height: '38px', padding: '0 14px', borderRadius: '9px', background: '#fff', color: '#374151', border: `1.5px solid ${BORDER}`, fontSize: '13px', cursor: 'pointer', fontFamily: "'Barlow',sans-serif" }}>
                              X
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '22px', fontWeight: 800, color: meta?.color||NAVY, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{formatValue(c.key, c.value)}</p>
                              <p style={{ fontSize: '11px', color: '#b0b8cc', margin: '3px 0 0' }}>raw: {c.value}</p>
                            </div>
                            <button onClick={() => { setEditing(c.key); setEditValue(c.value) }}
                              style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#f4f5f8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892aa', fontSize: '16px', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background=`${NAVY}10`; e.currentTarget.style.color=NAVY }}
                              onMouseLeave={e => { e.currentTarget.style.background='#f4f5f8'; e.currentTarget.style.color='#8892aa' }}
                            >
                              <i className="ti ti-pencil" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
