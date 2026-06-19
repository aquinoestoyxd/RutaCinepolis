import { useState, useEffect } from 'react'
import * as promotionService from '../../services/promotionService'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  startDate: '',
  endDate: '',
  terms: '',
  restrictions: '',
}

const inp = { height: '42px', borderRadius: '10px', border: `1.5px solid ${BORDER}`, padding: '0 13px', fontSize: '13px', outline: 'none', fontFamily: "'Barlow',sans-serif", background: '#fff', color: '#0f1726', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }
const lbl = { fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }
const btnP = { height: '42px', padding: '0 20px', borderRadius: '10px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '7px' }
const btnS = { height: '42px', padding: '0 18px', borderRadius: '10px', background: '#fff', color: NAVY, border: `1.5px solid ${BORDER}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px' }

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .cp-prom * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-pcard { transition:box-shadow 0.2s, transform 0.2s; }
  .cp-pcard:hover { box-shadow:0 10px 32px rgba(33,46,92,0.1); transform:translateY(-3px); }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
`

function formatDate(date) {
  const d = date ? new Date(date) : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
}

function toDatetimeLocal(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

function isExpired(endDate) {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

export default function Promociones() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [msg, setMsg] = useState({ text: '', type: 'success' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await promotionService.getPromotions()
      setPromotions(Array.isArray(data) ? data : [])
    } catch {
      setMsg({ text: 'Error al cargar promociones', type: 'error' })
      setTimeout(() => setMsg({ text: '' }), 3500)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      title: p.title,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      startDate: toDatetimeLocal(p.startDate),
      endDate: toDatetimeLocal(p.endDate),
      terms: p.terms || '',
      restrictions: p.restrictions || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined,
        terms: form.terms || undefined,
        restrictions: form.restrictions || undefined,
      }
      if (editing) {
        await promotionService.updatePromotion(editing.id, payload)
        setMsg({ text: 'Promocion actualizada', type: 'success' })
      } else {
        await promotionService.createPromotion(payload)
        setMsg({ text: 'Promocion creada', type: 'success' })
      }
      setShowModal(false)
      load()
      setTimeout(() => setMsg({ text: '' }), 3500)
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Error al guardar la promocion', type: 'error' })
      setTimeout(() => setMsg({ text: '' }), 3500)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Desactivar esta promocion?')) return
    try {
      await promotionService.deletePromotion(id)
      setMsg({ text: 'Promocion desactivada', type: 'success' })
      load()
      setTimeout(() => setMsg({ text: '' }), 3500)
    } catch {
      setMsg({ text: 'Error al desactivar la promocion', type: 'error' })
      setTimeout(() => setMsg({ text: '' }), 3500)
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-prom" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Club Cinepolis</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Promociones</h1>
          </div>
          <button style={btnP} onClick={openCreate}><i className="ti ti-plus" /> Nueva promocion</button>
        </div>

        {msg.text && (
          <div style={{ marginBottom: '16px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: msg.type === 'error' ? '#fff4f4' : '#f0faf5', border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#c6f0db'}`, color: msg.type === 'error' ? RED : GREEN, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
            <i className={`ti ${msg.type === 'error' ? 'ti-alert-circle' : 'ti-circle-check'}`} style={{ fontSize: '17px' }} /> {msg.text}
          </div>
        )}

        {loading ? (
          <div style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '64px', textAlign: 'center' }}>
            <i className="ti ti-loader-2" style={{ fontSize: '36px', color: NAVY, display: 'block', margin: '0 auto 14px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#8892aa', margin: 0, fontSize: '15px', fontWeight: 500 }}>Cargando promociones...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '64px', textAlign: 'center' }}>
            <i className="ti ti-percentage" style={{ fontSize: '48px', display: 'block', margin: '0 auto 14px', color: '#d1d5db' }} />
            <p style={{ color: '#8892aa', margin: '0 0 20px', fontSize: '15px', fontWeight: 500 }}>No hay promociones configuradas aun</p>
            <button style={btnP} onClick={openCreate}><i className="ti ti-plus" /> Crear primera promocion</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {promotions.map((p, idx) => {
              const expired = isExpired(p.endDate)
              return (
                <div key={p.id} className="cp-pcard" style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '22px', animation: 'cpFadeUp 0.4s ease both', animationDelay: `${idx * 60}ms`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: expired ? `linear-gradient(90deg, ${RED}66, ${RED}33)` : `linear-gradient(90deg, ${NAVY}, ${NAVY}66)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${expired ? RED : NAVY}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                        ) : (
                          <i className="ti ti-percentage" style={{ fontSize: '22px', color: expired ? RED : NAVY }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <p style={{ fontWeight: 800, color: '#0f1726', margin: 0, fontSize: '15px', letterSpacing: '-0.01em' }}>{p.title}</p>
                          {expired && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#fff4f4', color: RED, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Vencida</span>
                          )}
                        </div>
                        {p.description && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                      <button onClick={() => openEdit(p)} style={{ height: '32px', padding: '0 12px', borderRadius: '8px', background: `${NAVY}08`, border: 'none', color: NAVY, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-pencil" style={{ fontSize: '13px' }} /> Editar
                      </button>
                      <button onClick={() => handleDeactivate(p.id)} style={{ height: '32px', padding: '0 12px', borderRadius: '8px', background: '#fff4f4', border: 'none', color: RED, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-trash" style={{ fontSize: '13px' }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '12px', borderTop: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#f0f4ff', color: NAVY, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <i className="ti ti-calendar" style={{ fontSize: '12px' }} /> {formatDate(p.startDate)} — {formatDate(p.endDate)}
                    </span>
                    {p.terms && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#f5f3ff', color: '#6d28d9', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-file-text" style={{ fontSize: '12px' }} /> Terminos
                      </span>
                    )}
                    {p.restrictions && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#fef2f2', color: RED, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: '12px' }} /> Restricciones
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
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', animation: 'cpFadeUp 0.25s ease both' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f1726', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                {editing ? 'Editar promocion' : 'Nueva promocion'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={lbl}>Titulo *</label>
                  <input className="cp-inp" style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <label style={lbl}>Descripcion</label>
                  <textarea className="cp-inp" style={{ ...inp, height: '80px', resize: 'vertical', paddingTop: '10px' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>URL de imagen</label>
                  <input className="cp-inp" style={inp} value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://ejemplo.com/imagen.jpg" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={lbl}>Inicio *</label>
                    <input className="cp-inp" style={inp} type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={lbl}>Fin *</label>
                    <input className="cp-inp" style={inp} type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Terminos y condiciones</label>
                  <textarea className="cp-inp" style={{ ...inp, height: '100px', resize: 'vertical', paddingTop: '10px' }} value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Restricciones</label>
                  <textarea className="cp-inp" style={{ ...inp, height: '100px', resize: 'vertical', paddingTop: '10px' }} value={form.restrictions} onChange={e => setForm(f => ({ ...f, restrictions: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="button" style={{ ...btnS, flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" style={{ ...btnP, flex: 1, justifyContent: 'center', opacity: submitting ? 0.45 : 1 }} disabled={submitting}>
                    {submitting ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-check" />}
                    {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear promocion'}
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
