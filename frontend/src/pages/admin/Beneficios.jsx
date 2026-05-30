// frontend - src - pages - admin - Beneficios
import { useState, useEffect } from 'react'
import { getBenefits, getLevels, createBenefit, updateBenefit, deleteBenefit } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const TYPE_META = {
  DISCOUNT_TICKET:   { label: 'Descuento entrada',     icon: 'ti-ticket',     color: NAVY  },
  DISCOUNT_CANDY:    { label: 'Descuento dulceria',     icon: 'ti-candy',      color: '#f59e0b' },
  AVANT_PREMIERE:    { label: 'Avant-premiere',         icon: 'ti-star',       color: '#8b5cf6' },
  PREMIUM_ROOM:      { label: 'Sala premium',           icon: 'ti-armchair',   color: '#0891b2' },
  MERCHANDISE:       { label: 'Kit merchandising',      icon: 'ti-package',    color: GREEN },
  POINTS_REDEMPTION: { label: 'Canje de puntos',        icon: 'ti-coins',      color: GOLD  },
}

const LEVEL_META = {
  ESTANDAR: { bg: '#f1f5f9', color: '#475569', label: 'Estandar', border: '#cbd5e1' },
  PREMIUM:  { bg: '#e8ecf5', color: NAVY,      label: 'Premium',  border: '#93a8d4' },
  GOLDEN:   { bg: '#fef9ec', color: '#92650a', label: 'Golden',   border: '#f5d27a' },
}

const emptyForm = { name: '', description: '', type: 'DISCOUNT_TICKET', discountType: 'PERCENTAGE', discountValue: '', pointsCost: '', levelIds: [] }

const inp = { height: '42px', borderRadius: '10px', border: `1.5px solid ${BORDER}`, padding: '0 13px', fontSize: '13px', outline: 'none', fontFamily: "'Barlow',sans-serif", background: '#fff', color: '#0f1726', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }
const lbl = { fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }
const btnP = { height: '42px', padding: '0 20px', borderRadius: '10px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '7px' }
const btnS = { height: '42px', padding: '0 18px', borderRadius: '10px', background: '#fff', color: NAVY, border: `1.5px solid ${BORDER}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px' }

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .cp-ben * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-bcard { transition:box-shadow 0.2s, transform 0.2s; }
  .cp-bcard:hover { box-shadow:0 10px 32px rgba(33,46,92,0.1); transform:translateY(-3px); }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
`

export default function Beneficios() {
  const [benefits, setBenefits] = useState([])
  const [levels, setLevels]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [msg, setMsg]           = useState({ text: '', type: 'success' })
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    try { const [b, l] = await Promise.all([getBenefits({}), getLevels()]); setBenefits(b); setLevels(l) } catch {}
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit   = b => {
    setEditing(b)
    setForm({ name: b.name, description: b.description||'', type: b.type, discountType: b.discountType||'PERCENTAGE',
      discountValue: b.discountValue||'', pointsCost: b.pointsCost||'', levelIds: b.levelBenefits?.map(lb=>lb.levelId)||[] })
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form, discountValue: form.discountValue ? Number(form.discountValue) : undefined, pointsCost: form.pointsCost ? Number(form.pointsCost) : undefined }
      if (editing) await updateBenefit(editing.id, payload); else await createBenefit(payload)
      setMsg({ text: editing ? 'Beneficio actualizado' : 'Beneficio creado', type: 'success' }); setShowModal(false); load()
      setTimeout(() => setMsg({ text: '' }), 3500)
    } catch (err) { setMsg({ text: err.response?.data?.error || 'Error', type: 'error' }) }
    finally { setLoading(false) }
  }

  const handleDelete = async id => {
    if (!confirm('Desactivar este beneficio?')) return
    try { await deleteBenefit(id); load(); setMsg({ text: 'Beneficio desactivado', type: 'success' }); setTimeout(() => setMsg({ text: '' }), 3500) } catch {}
  }

  const toggleLevel = id => setForm(f => ({ ...f, levelIds: f.levelIds.includes(id) ? f.levelIds.filter(x=>x!==id) : [...f.levelIds, id] }))

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-ben" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Programa</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Beneficios</h1>
          </div>
          <button style={btnP} onClick={openCreate}><i className="ti ti-plus" /> Nuevo beneficio</button>
        </div>

        {msg.text && (
          <div style={{ marginBottom: '16px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: msg.type==='error'?'#fff4f4':'#f0faf5', border: `1px solid ${msg.type==='error'?'#fca5a5':'#c6f0db'}`, color: msg.type==='error'?RED:GREEN, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
            <i className={`ti ${msg.type==='error'?'ti-alert-circle':'ti-circle-check'}`} style={{ fontSize: '17px' }} /> {msg.text}
          </div>
        )}

        {benefits.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '64px', textAlign: 'center' }}>
            <i className="ti ti-gift" style={{ fontSize: '48px', display: 'block', margin: '0 auto 14px', color: '#d1d5db' }} />
            <p style={{ color: '#8892aa', margin: '0 0 20px', fontSize: '15px', fontWeight: 500 }}>No hay beneficios configurados aun</p>
            <button style={btnP} onClick={openCreate}><i className="ti ti-plus" /> Crear primer beneficio</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {benefits.map((b, idx) => {
              const tm = TYPE_META[b.type] || { label: b.type, icon: 'ti-gift', color: NAVY }
              return (
                <div key={b.id} className="cp-bcard" style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '22px', animation: 'cpFadeUp 0.4s ease both', animationDelay: `${idx*60}ms`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${tm.color}, ${tm.color}66)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${tm.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`ti ${tm.icon}`} style={{ fontSize: '22px', color: tm.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, color: '#0f1726', margin: '0 0 3px', fontSize: '15px', letterSpacing: '-0.01em' }}>{b.name}</p>
                        <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>{tm.label}</p>
                        {b.description && <p style={{ fontSize: '12px', color: '#6b7280', margin: '5px 0 0', lineHeight: 1.5 }}>{b.description}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                      <button onClick={() => openEdit(b)} style={{ height: '32px', padding: '0 12px', borderRadius: '8px', background: `${NAVY}08`, border: 'none', color: NAVY, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-pencil" style={{ fontSize: '13px' }} /> Editar
                      </button>
                      <button onClick={() => handleDelete(b.id)} style={{ height: '32px', padding: '0 12px', borderRadius: '8px', background: '#fff4f4', border: 'none', color: RED, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-trash" style={{ fontSize: '13px' }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
                    {b.levelBenefits?.map(lb => {
                      const lm = LEVEL_META[lb.level?.name] || LEVEL_META.ESTANDAR
                      return (
                        <span key={lb.levelId} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: lm.bg, color: lm.color, border: `1px solid ${lm.border}` }}>
                          {lm.label}
                        </span>
                      )
                    })}
                    {b.pointsCost > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#fef9ec', color: '#92650a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-coins" style={{ fontSize: '12px' }} /> {b.pointsCost} pts
                      </span>
                    )}
                    {b.discountValue > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#f0faf5', color: '#1a7048', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-tag" style={{ fontSize: '12px' }} /> {b.discountValue}{b.discountType==='PERCENTAGE'?'%':' S/.'} off
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', animation: 'cpFadeUp 0.25s ease both' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f1726', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                {editing ? 'Editar beneficio' : 'Nuevo beneficio'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div><label style={lbl}>Nombre *</label><input className="cp-inp" style={inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required /></div>
                <div><label style={lbl}>Descripcion</label><textarea className="cp-inp" style={{ ...inp, height: '80px', resize: 'vertical', paddingTop: '10px' }} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /></div>
                <div>
                  <label style={lbl}>Tipo *</label>
                  <select className="cp-inp" style={inp} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                    {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </div>
                {['DISCOUNT_TICKET','DISCOUNT_CANDY'].includes(form.type) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={lbl}>Tipo descuento</label>
                      <select className="cp-inp" style={inp} value={form.discountType} onChange={e => setForm(f=>({...f,discountType:e.target.value}))}>
                        <option value="PERCENTAGE">Porcentaje (%)</option>
                        <option value="FIXED_AMOUNT">Monto fijo (S/.)</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Valor</label>
                      <input className="cp-inp" style={inp} type="number" value={form.discountValue} onChange={e => setForm(f=>({...f,discountValue:e.target.value}))} placeholder={form.discountType==='PERCENTAGE'?'ej: 20':'ej: 5.00'} />
                    </div>
                  </div>
                )}
                {form.type === 'POINTS_REDEMPTION' && (
                  <div>
                    <label style={lbl}>Costo en puntos</label>
                    <input className="cp-inp" style={inp} type="number" value={form.pointsCost} onChange={e => setForm(f=>({...f,pointsCost:e.target.value}))} placeholder="ej: 500" />
                  </div>
                )}
                <div>
                  <label style={lbl}>Niveles que aplican *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {levels.map(l => {
                      const selected = form.levelIds.includes(l.id)
                      const lm = LEVEL_META[l.name] || LEVEL_META.ESTANDAR
                      return (
                        <label key={l.id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '11px', border: `2px solid ${selected ? lm.color : BORDER}`, background: selected ? lm.bg : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: selected ? lm.color : '#374151', transition: 'all 0.15s', userSelect: 'none' }}>
                          <input type="checkbox" checked={selected} onChange={() => toggleLevel(l.id)} style={{ display: 'none' }} />
                          {lm.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="button" style={{ ...btnS, flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" style={{ ...btnP, flex: 1, justifyContent: 'center', opacity: (loading || form.levelIds.length===0) ? 0.45 : 1 }} disabled={loading || form.levelIds.length===0}>
                    {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-check" />}
                    {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear beneficio'}
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
