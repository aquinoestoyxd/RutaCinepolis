// frontend - src - pages - admin - Merchandising
import { useState, useEffect } from 'react'
import { getMerchandise, updateStock } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const inp = { height: '42px', borderRadius: '10px', border: `1.5px solid ${BORDER}`, padding: '0 13px', fontSize: '13px', outline: 'none', fontFamily: "'Barlow',sans-serif", background: '#fff', color: '#0f1726', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }
const btnP = { height: '42px', padding: '0 20px', borderRadius: '10px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '7px' }
const btnS = { height: '42px', padding: '0 18px', borderRadius: '10px', background: '#fff', color: NAVY, border: `1.5px solid ${BORDER}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px' }

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes barFill { from{width:0} to{width:var(--w)} }
  .cp-merch * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-mcard { transition:box-shadow 0.2s, transform 0.2s; }
  .cp-mcard:hover { box-shadow:0 10px 32px rgba(33,46,92,0.1); transform:translateY(-3px); }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
`

export default function Merchandising() {
  const [items, setItems]         = useState([])
  const [stockModal, setStockModal] = useState(null)
  const [delta, setDelta]         = useState('')
  const [msg, setMsg]             = useState({ text: '', type: 'success' })
  const [loading, setLoading]     = useState(false)

  const load = async () => { try { setItems(await getMerchandise()) } catch {} }
  useEffect(() => { load() }, [])

  const showNotif = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '' }), 3500) }

  const handleStock = async () => {
    setLoading(true)
    try { await updateStock(stockModal.id, parseInt(delta)); showNotif('Stock actualizado'); setStockModal(null); setDelta(''); load() }
    catch (err) { showNotif(err.response?.data?.error || 'Error', 'error') }
    finally { setLoading(false) }
  }

  const lowItems   = items.filter(i => i.stockCurrent <= i.stockMinAlert)
  const okItems    = items.filter(i => i.stockCurrent >  i.stockMinAlert)

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-merch" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Inventario</p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Merchandising Golden</h1>
          </div>
          {lowItems.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '12px', padding: '10px 16px' }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: '18px', color: RED }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: RED, margin: 0 }}>{lowItems.length} item{lowItems.length>1?'s':''} con stock bajo</p>
                <p style={{ fontSize: '11px', color: '#b91c1c', margin: 0 }}>Requieren reposicion</p>
              </div>
            </div>
          )}
        </div>

        {msg.text && (
          <div style={{ marginBottom: '16px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: msg.type==='error'?'#fff4f4':'#f0faf5', border: `1px solid ${msg.type==='error'?'#fca5a5':'#c6f0db'}`, color: msg.type==='error'?RED:GREEN, display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
            <i className={`ti ${msg.type==='error'?'ti-alert-circle':'ti-circle-check'}`} style={{ fontSize: '17px' }} /> {msg.text}
          </div>
        )}

        {/* Alertas primero */}
        {lowItems.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: RED, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: '13px' }} /> Stock critico
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
              {lowItems.map((item, idx) => <StockCard key={item.id} item={item} idx={idx} isLow onAdjust={() => { setStockModal(item); setDelta('') }} />)}
            </div>
          </div>
        )}

        {okItems.length > 0 && (
          <div>
            {lowItems.length > 0 && <p style={{ fontSize: '11px', fontWeight: 800, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-package" style={{ fontSize: '13px' }} /> Stock normal
            </p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
              {okItems.map((item, idx) => <StockCard key={item.id} item={item} idx={idx + lowItems.length} onAdjust={() => { setStockModal(item); setDelta('') }} />)}
            </div>
          </div>
        )}

        {stockModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', animation: 'cpFadeUp 0.25s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${GOLD}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-package" style={{ fontSize: '22px', color: '#92650a' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f1726', margin: '0 0 2px' }}>Ajustar stock</h3>
                  <p style={{ fontSize: '13px', color: '#8892aa', margin: 0 }}>{stockModal.name} · Actual: <strong>{stockModal.stockCurrent}</strong> uds</p>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cantidad a agregar (+) o restar (-)
                </label>
                <input className="cp-inp" style={inp} type="number" value={delta} onChange={e => setDelta(e.target.value)} placeholder="ej: 50 para agregar, -5 para restar" />
                {delta && !isNaN(parseInt(delta)) && (
                  <div style={{ marginTop: '10px', padding: '12px 16px', borderRadius: '10px', background: '#f4f5f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Stock resultante</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: (stockModal.stockCurrent + parseInt(delta)) <= stockModal.stockMinAlert ? RED : GREEN, letterSpacing: '-0.02em' }}>
                        {stockModal.stockCurrent + parseInt(delta)}
                      </span>
                      <span style={{ color: '#8892aa', marginLeft: '4px' }}>uds</span>
                      {(stockModal.stockCurrent + parseInt(delta)) <= stockModal.stockMinAlert && (
                        <p style={{ fontSize: '11px', color: RED, margin: '2px 0 0', fontWeight: 600 }}>Seguira bajo el minimo</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ ...btnS, flex: 1, justifyContent: 'center' }} onClick={() => setStockModal(null)}>Cancelar</button>
                <button style={{ ...btnP, flex: 1, justifyContent: 'center', opacity: (!delta || loading) ? 0.45 : 1 }} onClick={handleStock} disabled={loading || !delta}>
                  {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-check" />}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function StockCard({ item, idx, isLow, onAdjust }) {
  const pct = item.stockTotal > 0 ? Math.round((item.stockCurrent / item.stockTotal) * 100) : 0
  const barColor = isLow ? RED : pct > 50 ? GREEN : '#f59e0b'
  return (
    <div className="cp-mcard" style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${isLow ? '#fca5a5' : '#eaecf3'}`, padding: '22px', animation: 'cpFadeUp 0.4s ease both', animationDelay: `${idx * 70}ms`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: barColor }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isLow ? '#fff4f4' : '#fef9ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-package" style={{ fontSize: '22px', color: isLow ? RED : '#92650a' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, color: '#0f1726', margin: '0 0 3px', fontSize: '15px' }}>{item.name}</p>
            {item.description && <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>{item.description}</p>}
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#fef9ec', color: '#92650a', flexShrink: 0 }}>Golden</span>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8892aa', fontWeight: 500 }}>Stock disponible</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: isLow ? RED : '#0f1726', letterSpacing: '-0.03em', lineHeight: 1 }}>{item.stockCurrent}</span>
            <span style={{ fontSize: '13px', color: '#8892aa', marginLeft: '4px' }}>/ {item.stockTotal}</span>
          </div>
        </div>
        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px', color: '#8892aa' }}>
          <span>Min: {item.stockMinAlert} uds</span>
          <span style={{ fontWeight: 700, color: barColor }}>{pct}% disponible</span>
        </div>
      </div>

      {isLow && (
        <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '9px', padding: '10px 13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: RED, fontWeight: 600 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '15px', flexShrink: 0 }} />
          Stock por debajo del umbral — reposicion necesaria
        </div>
      )}

      <button onClick={onAdjust} style={{ width: '100%', height: '38px', borderRadius: '9px', border: `1.5px solid #eaecf3`, background: '#fff', color: '#212E5C', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='#212E5C'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#212E5C' }}
        onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color='#212E5C'; e.currentTarget.style.borderColor='#eaecf3' }}
      >
        <i className="ti ti-adjustments" style={{ fontSize: '15px' }} /> Ajustar stock
      </button>
    </div>
  )
}
