// frontend - src - pages - cajero - RegistrarCompra
import { useState } from 'react'
import { posLookup, posTransaction } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const LEVEL_META = {
  ESTANDAR: { color: '#475569', label: 'Estandar', mult: 1   },
  PREMIUM:  { color: NAVY,      label: 'Premium',  mult: 1.5 },
  GOLDEN:   { color: '#92650a', label: 'Golden',   mult: 2   },
}

const DISCOUNT = {
  PURCHASE_TICKET: { ESTANDAR: 0,  PREMIUM: 20, GOLDEN: 30 },
  PURCHASE_CANDY:  { ESTANDAR: 0,  PREMIUM: 10, GOLDEN: 15 },
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cpPop    { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  .cp-cmp * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 4px rgba(33,46,92,0.1) !important; }
  .cp-type-btn { transition:all 0.15s; cursor:pointer; }
  .cp-type-btn:hover { transform:translateY(-2px); }
`

export default function RegistrarCompra() {
  const [card, setCard]       = useState('')
  const [member, setMember]   = useState(null)
  const [form, setForm]       = useState({ amount: '', transactionType: 'PURCHASE_TICKET', posId: 'POS-01' })
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const formatCard = v => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19)

  const searchMember = async e => {
    e.preventDefault(); setError(''); setMember(null); setResult(null); setSearching(true)
    try { setMember(await posLookup(card.replace(/\s/g,''))) }
    catch (err) { setError(err.response?.data?.error || 'Tarjeta no encontrada') }
    finally { setSearching(false) }
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await posTransaction({ cardNumber: card.replace(/\s/g,''), amount: parseFloat(form.amount), transactionType: form.transactionType, posId: form.posId })
      setResult(data)
      setMember(prev => prev ? { ...prev, membership: { ...prev.membership, points: data.newBalance } } : prev)
      setForm(f => ({ ...f, amount: '' }))
    } catch (err) { setError(err.response?.data?.error || 'Error al procesar') }
    finally { setLoading(false) }
  }

  const levelName  = member?.membership?.level?.name
  const lm         = LEVEL_META[levelName] || LEVEL_META.ESTANDAR
  const amount     = parseFloat(form.amount) || 0
  const discount   = amount > 0 ? DISCOUNT[form.transactionType]?.[levelName] || 0 : 0
  const discountAmt = +(amount * discount / 100).toFixed(2)
  const totalAfter  = +(amount - discountAmt).toFixed(2)
  const pts = amount > 0 ? Math.floor(amount * 0.05 * lm.mult) : 0

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-cmp" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ marginBottom: '28px', animation: 'cpFadeUp 0.4s ease both' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Cajero — Operacion</p>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Registrar compra</h1>
        </div>

        {/* Paso 1 — Identificar */}
        {!member ? (
          <div style={{ background: '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, padding: '28px', animation: 'cpFadeUp 0.45s ease both', animationDelay: '60ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>1</span>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: 0 }}>Identificar miembro</p>
                <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Ingresa el numero de tarjeta RC del cliente</p>
              </div>
            </div>
            {error && (
              <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', color: RED, fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '16px' }} /> {error}
              </div>
            )}
            <form onSubmit={searchMember} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <i className="ti ti-credit-card" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8892aa', fontSize: '18px', pointerEvents: 'none' }} />
                <input className="cp-inp" style={{ width: '100%', height: '50px', borderRadius: '12px', border: `1.5px solid ${BORDER}`, paddingLeft: '44px', fontSize: '17px', fontFamily: 'monospace', letterSpacing: '0.1em', outline: 'none', color: '#0f1726', boxSizing: 'border-box' }}
                  placeholder="5890 0000 0000 0000" value={card} onChange={e => setCard(formatCard(e.target.value))} maxLength={19} />
              </div>
              <button type="submit" disabled={searching || card.replace(/\s/g,'').length < 16}
                style={{ height: '50px', padding: '0 24px', borderRadius: '12px', background: NAVY, color: '#fff', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '8px', opacity: card.replace(/\s/g,'').length < 16 ? 0.5 : 1 }}>
                {searching ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-arrow-right" />}
                {searching ? 'Buscando...' : 'Continuar'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Member strip */}
            <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'cpFadeUp 0.35s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: NAVY }}>
                  {`${member.firstName?.[0]||''}${member.lastName?.[0]||''}`}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#0f1726', margin: '0 0 2px', fontSize: '15px' }}>{member.firstName} {member.lastName}</p>
                  <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#8892aa', margin: 0, letterSpacing: '0.06em' }}>{member.cardNumber?.replace(/(.{4})/g,'$1 ').trim()}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Puntos actuales</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {(member.membership?.points ?? 0).toLocaleString()}
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: '#e8ecf5', color: lm.color }}>
                  {lm.label}
                </span>
                <button onClick={() => { setMember(null); setCard(''); setResult(null); setError('') }}
                  style={{ height: '34px', padding: '0 12px', borderRadius: '8px', background: '#f4f5f8', border: 'none', color: '#8892aa', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ti ti-x" style={{ fontSize: '13px' }} /> Cambiar
                </button>
              </div>
            </div>

            {/* Success */}
            {result && (
              <div style={{ background: '#f0faf5', border: '1px solid #6ee7b7', borderRadius: '16px', padding: '18px 22px', animation: 'cpPop 0.3s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: result.levelUpgraded ? '10px' : 0 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: '22px', color: GREEN, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: '#065f46', margin: '0 0 2px', fontSize: '15px' }}>Compra registrada exitosamente</p>
                    <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                      +{result.pointsEarned} puntos acreditados · Nuevo saldo: <strong>{result.newBalance}</strong> pts
                    </p>
                  </div>
                </div>
                {result.levelUpgraded && (
                  <div style={{ background: '#fef9ec', border: '1px solid #f5d27a', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <i className="ti ti-crown" style={{ fontSize: '18px', color: '#92650a' }} />
                    <p style={{ fontWeight: 700, color: '#92650a', margin: 0, fontSize: '13px' }}>El cliente subio de nivel — felicitalo!</p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '12px', padding: '13px 16px', color: RED, fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '9px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '17px' }} /> {error}
              </div>
            )}

            {/* Paso 2 — Compra */}
            <div style={{ background: '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, padding: '24px', animation: 'cpFadeUp 0.4s ease both', animationDelay: '80ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>2</span>
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: 0 }}>Datos de la compra</p>
                  <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Selecciona el tipo e ingresa el monto</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Tipo */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de compra</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { v: 'PURCHASE_TICKET', l: 'Entrada',  icon: 'ti-ticket', sub: `${DISCOUNT.PURCHASE_TICKET[levelName]||0}% descuento`  },
                      { v: 'PURCHASE_CANDY',  l: 'Dulceria', icon: 'ti-candy',  sub: `${DISCOUNT.PURCHASE_CANDY[levelName]||0}% descuento`   },
                    ].map(opt => {
                      const isSelected = form.transactionType === opt.v
                      return (
                        <label key={opt.v} className="cp-type-btn" style={{ cursor: 'pointer', border: `2px solid ${isSelected ? NAVY : BORDER}`, borderRadius: '14px', padding: '16px', background: isSelected ? '#e8ecf5' : '#fafbff', userSelect: 'none' }}>
                          <input type="radio" value={opt.v} checked={isSelected} onChange={e => setForm(f=>({...f,transactionType:e.target.value}))} style={{ display: 'none' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: isSelected ? `${NAVY}18` : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={`ti ${opt.icon}`} style={{ fontSize: '22px', color: isSelected ? NAVY : '#94a3b8' }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 800, color: isSelected ? NAVY : '#374151', margin: '0 0 2px', fontSize: '14px' }}>{opt.l}</p>
                              <p style={{ fontSize: '12px', color: isSelected ? '#5b7bb0' : '#8892aa', margin: 0 }}>{opt.sub}</p>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monto original (S/.)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 700, color: '#8892aa', pointerEvents: 'none' }}>S/.</span>
                    <input className="cp-inp" style={{ width: '100%', height: '56px', borderRadius: '13px', border: `1.5px solid ${BORDER}`, paddingLeft: '52px', fontSize: '22px', fontWeight: 700, outline: 'none', color: '#0f1726', boxSizing: 'border-box', fontFamily: "'Barlow',sans-serif" }}
                      type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" required />
                  </div>
                </div>

                {/* Preview */}
                {amount > 0 && (
                  <div style={{ background: '#f4f5f8', borderRadius: '14px', padding: '18px', animation: 'cpFadeUp 0.25s ease both' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Resumen de la transaccion</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#6b7280' }}>Monto original</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>S/. {amount.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#6b7280' }}>Descuento {lm.label} ({discount}%)</span>
                          <span style={{ fontWeight: 700, color: GREEN }}>-S/. {discountAmt.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ height: '1px', background: '#e2e8f0', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                        <span style={{ fontWeight: 700, color: '#0f1726' }}>Total a cobrar</span>
                        <span style={{ fontWeight: 800, color: NAVY, fontSize: '18px' }}>S/. {totalAfter.toFixed(2)}</span>
                      </div>
                      <div style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}44`, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ti ti-star-filled" style={{ fontSize: '16px', color: GOLD }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Puntos a acreditar</span>
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#92650a', letterSpacing: '-0.02em' }}>+{pts}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading || !form.amount}
                  style={{ height: '54px', borderRadius: '14px', background: loading || !form.amount ? '#8892aa' : GREEN, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 700, cursor: loading || !form.amount ? 'not-allowed' : 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: loading || !form.amount ? 'none' : '0 4px 16px rgba(39,168,106,0.3)', transition: 'all 0.15s' }}>
                  {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: '20px' }} /> : <i className="ti ti-circle-check" style={{ fontSize: '20px' }} />}
                  {loading ? 'Procesando...' : 'Confirmar y acreditar puntos'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
