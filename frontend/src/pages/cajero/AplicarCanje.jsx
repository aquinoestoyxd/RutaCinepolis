// frontend - src - pages - cajero - AplicarCanje
import { useState } from 'react'
import { posLookup, getBenefits, redeemBenefit } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const TYPE_META = {
  DISCOUNT_TICKET:   { label: 'Descuento entrada',  icon: 'ti-ticket',   color: NAVY    },
  DISCOUNT_CANDY:    { label: 'Descuento dulceria',  icon: 'ti-candy',    color: '#f59e0b' },
  AVANT_PREMIERE:    { label: 'Avant-premiere',      icon: 'ti-star',     color: '#8b5cf6' },
  PREMIUM_ROOM:      { label: 'Sala premium',        icon: 'ti-armchair', color: '#0891b2' },
  MERCHANDISE:       { label: 'Kit Golden',          icon: 'ti-package',  color: GOLD    },
  POINTS_REDEMPTION: { label: 'Canje de puntos',     icon: 'ti-coins',    color: GREEN   },
}

const LEVEL_META = {
  ESTANDAR: { color: '#475569', label: 'Estandar' },
  PREMIUM:  { color: NAVY,      label: 'Premium'  },
  GOLDEN:   { color: '#92650a', label: 'Golden'   },
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cpPop    { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  .cp-can * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 4px rgba(33,46,92,0.1) !important; }
  .cp-ben-item { transition:all 0.15s; }
  .cp-ben-item:hover:not(.disabled) { transform:translateY(-2px); box-shadow:0 6px 20px rgba(33,46,92,0.1); }
`

export default function AplicarCanje() {
  const [card, setCard]       = useState('')
  const [member, setMember]   = useState(null)
  const [benefits, setBenefits] = useState([])
  const [selected, setSelected] = useState(null)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const formatCard = v => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19)

  const searchMember = async e => {
    e.preventDefault(); setError(''); setMember(null); setBenefits([]); setSelected(null); setResult(null); setSearching(true)
    try {
      const data = await posLookup(card.replace(/\s/g,''))
      setMember(data)
      const benefs = await getBenefits({ levelName: data.membership?.level?.name })
      setBenefits(benefs)
    } catch (err) { setError(err.response?.data?.error || 'Tarjeta no encontrada') }
    finally { setSearching(false) }
  }

  const handleRedeem = async () => {
    if (!selected) return
    setError(''); setLoading(true)
    try {
      const data = await redeemBenefit({ memberId: member.id, benefitId: selected.id, posId: 'POS-01' })
      setResult({ benefit: selected, ...data })
      setMember(prev => ({ ...prev, membership: { ...prev.membership, points: prev.membership.points - (selected.pointsCost || 0) } }))
      setSelected(null)
    } catch (err) { setError(err.response?.data?.error || 'Error al procesar canje') }
    finally { setLoading(false) }
  }

  const points    = member?.membership?.points || 0
  const levelName = member?.membership?.level?.name
  const lm        = LEVEL_META[levelName] || LEVEL_META.ESTANDAR
  const canAfford = b => !b.pointsCost || points >= b.pointsCost

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-can" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        <div style={{ marginBottom: '28px', animation: 'cpFadeUp 0.4s ease both' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Cajero — Operacion</p>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Aplicar canje</h1>
        </div>

        {/* Paso 1 — Buscar */}
        {!member ? (
          <div style={{ background: '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, padding: '28px', animation: 'cpFadeUp 0.45s ease both', animationDelay: '60ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>1</span>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: 0 }}>Identificar miembro</p>
                <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>El cliente viene con su numero de tarjeta desde la app</p>
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

            {/* Member + puntos strip */}
            <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2449 100%)`, borderRadius: '18px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'cpFadeUp 0.35s ease both', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  {`${member.firstName?.[0]||''}${member.lastName?.[0]||''}`}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 2px', fontSize: '15px' }}>{member.firstName} {member.lastName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
                      {lm.label}
                    </span>
                    <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                      {member.cardNumber?.replace(/(.{4})/g,'$1 ').trim()}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <i className="ti ti-star-filled" style={{ fontSize: '18px', color: GOLD }} />
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>{points.toLocaleString()}</p>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>puntos disponibles</p>
              </div>
            </div>

            {/* Success */}
            {result && (
              <div style={{ background: '#f0faf5', border: '1px solid #6ee7b7', borderRadius: '16px', padding: '18px 22px', animation: 'cpPop 0.3s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: '22px', color: GREEN, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: '#065f46', margin: '0 0 2px', fontSize: '15px' }}>Canje aplicado exitosamente</p>
                    <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>"{result.benefit?.name}" — canje completado</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '12px', padding: '13px 16px', color: RED, fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '9px' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: '17px' }} /> {error}
              </div>
            )}

            {/* Paso 2 — Beneficios */}
            <div style={{ background: '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, padding: '24px', animation: 'cpFadeUp 0.4s ease both', animationDelay: '80ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>2</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: 0 }}>Seleccionar beneficio</p>
                    <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Beneficios disponibles para nivel {lm.label}</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#8892aa', background: '#f4f5f8', borderRadius: '8px', padding: '5px 10px', fontWeight: 600 }}>
                  {benefits.length} disponibles
                </span>
              </div>

              {benefits.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8892aa' }}>
                  <i className="ti ti-gift-off" style={{ fontSize: '36px', display: 'block', margin: '0 auto 10px', opacity: .3 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>No hay beneficios canjeables para este nivel</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: selected ? '18px' : 0 }}>
                  {benefits.map(b => {
                    const tm  = TYPE_META[b.type] || { label: b.type, icon: 'ti-gift', color: NAVY }
                    const can = canAfford(b)
                    const isSel = selected?.id === b.id
                    return (
                      <div key={b.id} className={`cp-ben-item${can ? '' : ' disabled'}`}
                        onClick={() => can && setSelected(s => s?.id === b.id ? null : b)}
                        style={{
                          border: `2px solid ${isSel ? tm.color : can ? BORDER : '#f1f5f9'}`,
                          borderRadius: '14px', padding: '16px 18px',
                          background: isSel ? `${tm.color}08` : can ? '#fff' : '#fafafa',
                          cursor: can ? 'pointer' : 'not-allowed',
                          opacity: can ? 1 : 0.45,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: `${tm.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className={`ti ${tm.icon}`} style={{ fontSize: '22px', color: tm.color }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: '#0f1726', margin: '0 0 3px', fontSize: '14px' }}>{b.name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#8892aa' }}>{tm.label}</span>
                              {b.discountValue > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: GREEN, background: '#f0faf5', padding: '2px 8px', borderRadius: '20px' }}>
                                  {b.discountValue}{b.discountType==='PERCENTAGE'?'%':' S/.'} off
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          {b.pointsCost > 0 && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '18px', fontWeight: 800, color: can ? (isSel ? tm.color : NAVY) : '#9ca3af', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{b.pointsCost}</p>
                              <p style={{ fontSize: '11px', color: '#8892aa', margin: 0, fontWeight: 600 }}>pts</p>
                            </div>
                          )}
                          {isSel && <i className="ti ti-circle-check" style={{ fontSize: '22px', color: tm.color, flexShrink: 0 }} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Confirm */}
              {selected && (
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '18px', animation: 'cpFadeUp 0.2s ease both' }}>
                  <div style={{ background: '#f4f5f8', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>Canje a procesar</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: 0 }}>{selected.name}</p>
                    </div>
                    {selected.pointsCost > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#8892aa', margin: '0 0 2px', fontWeight: 600 }}>Se descontaran</p>
                        <p style={{ fontSize: '20px', fontWeight: 800, color: RED, margin: 0, letterSpacing: '-0.02em' }}>-{selected.pointsCost} pts</p>
                        <p style={{ fontSize: '11px', color: '#8892aa', margin: '2px 0 0' }}>
                          Saldo tras canje: <strong style={{ color: NAVY }}>{(points - selected.pointsCost).toLocaleString()}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                  <button onClick={handleRedeem} disabled={loading}
                    style={{ width: '100%', height: '52px', borderRadius: '13px', background: loading ? '#8892aa' : `linear-gradient(135deg, #7c3aed, #5b21b6)`, color: '#fff', border: 'none', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: loading ? 'none' : '0 4px 16px rgba(91,33,182,0.3)', transition: 'all 0.15s' }}>
                    {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: '20px' }} /> : <i className="ti ti-gift" style={{ fontSize: '20px' }} />}
                    {loading ? 'Procesando canje...' : 'Confirmar canje'}
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => { setMember(null); setCard(''); setResult(null); setSelected(null); setError('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8892aa', fontSize: '13px', fontWeight: 600, fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', alignSelf: 'flex-start', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = NAVY}
              onMouseLeave={e => e.currentTarget.style.color = '#8892aa'}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: '15px' }} /> Cambiar miembro
            </button>
          </div>
        )}
      </div>
    </>
  )
}
