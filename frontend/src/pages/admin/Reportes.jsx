// frontend - src - pages - admin - Reportes
import { useState, useEffect, useCallback } from 'react'
import { getTransactionReport } from '../../api/index.js'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'

const NAVY   = '#212E5C'
const GOLD   = '#e8b84b'
const GREEN  = '#27a86a'
const BORDER = '#eaecf3'
const BG     = '#f4f5f8'

const TYPE_META = {
  PURCHASE_TICKET: { label: 'Entradas',  color: NAVY,    icon: 'ti-ticket'      },
  PURCHASE_CANDY:  { label: 'Dulceria',  color: GOLD,    icon: 'ti-candy'       },
  REDEMPTION:      { label: 'Canjes',    color: GREEN,   icon: 'ti-gift'        },
  ADJUSTMENT:      { label: 'Ajustes',   color: '#8892aa', icon: 'ti-adjustments' },
}
const ORIGIN_META = {
  WEB: { label: 'Web',           color: '#5b6ee8' },
  POS: { label: 'POS Taquilla',  color: NAVY      },
}

const card = { background: '#fff', borderRadius: '16px', border: `1px solid ${BORDER}`, padding: '22px 24px' }

/* ── Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontFamily: "'Barlow',sans-serif" }}>
      <p style={{ fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: '#374151' }}>
          {p.name}: <strong style={{ color: NAVY }}>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

/* ── Skeleton ── */
function Skeleton({ w = '100%', h = '20px', r = '8px' }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#f0f2f8 25%,#e4e7f0 50%,#f0f2f8 75%)', backgroundSize: '200% 100%', animation: 'cpShimmer 1.4s ease infinite' }} />
}

/* ── Summary KPI card ── */
function KpiCard({ label, value, icon, color, index }) {
  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '14px', animation: 'cpFadeUp 0.45s ease both', animationDelay: `${index * 80}ms`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: '20px', color }} aria-hidden="true" />
      </div>
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#0f1726', letterSpacing: '-0.03em', margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: '#8892aa', gap: '10px' }}>
      <i className={`ti ${icon}`} style={{ fontSize: '40px', opacity: .25 }} />
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', margin: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: '13px', margin: 0, color: '#b0b8cc' }}>{sub}</p>}
    </div>
  )
}

/* ── Page ── */
export default function Reportes() {
  const [data, setData]       = useState(null)
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErrMsg('')
    try {
      const res = await getTransactionReport({ from: from || undefined, to: to || undefined })
      setData(res)
    } catch (err) {
      const status = err?.response?.status
      const msg    = err?.response?.data?.error || err?.message || 'Error desconocido'
      if (status === 401)   setErrMsg('Sesion expirada. Vuelve a iniciar sesion.')
      else if (!status)     setErrMsg('Sin conexion con el servidor.')
      else                  setErrMsg(`${msg} (HTTP ${status})`)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  // Carga inicial sin filtros
  useEffect(() => {
    const initial = async () => {
      setLoading(true)
      try {
        const res = await getTransactionReport({})
        setData(res)
      } catch (err) {
        const status = err?.response?.status
        const msg    = err?.response?.data?.error || err?.message || 'Error desconocido'
        if (status === 401) setErrMsg('Sesion expirada.')
        else if (!status)   setErrMsg('Sin conexion con el servidor.')
        else                setErrMsg(`${msg} (HTTP ${status})`)
      } finally {
        setLoading(false)
      }
    }
    initial()
  }, [])

  /* ── Computed ── */
  const totalCount    = (data?.byOrigin || []).reduce((a, x) => a + x.count, 0) || 1
  const totalTx       = (data?.byType   || []).reduce((a, t) => a + t.count, 0)
  const totalRevenue  = (data?.byType   || []).reduce((a, t) => a + Number(t.totalAmount || 0), 0)
  const totalPts      = (data?.byType   || []).reduce((a, t) => a + Number(t.totalPoints  || 0), 0)

  const barData = (data?.byType || []).map(t => ({
    name:   TYPE_META[t.type]?.label || t.type,
    count:  t.count,
    color:  TYPE_META[t.type]?.color || NAVY,
    type:   t.type,
  }))

  const areaData = (data?.dailyVolume || []).map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
  }))

  const inputStyle = {
    height: '38px', borderRadius: '8px', border: `1px solid ${BORDER}`,
    padding: '0 12px', fontSize: '13px', outline: 'none',
    fontFamily: "'Barlow',sans-serif", background: '#fff', color: '#0f1726',
    transition: 'border-color 0.15s',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
        @keyframes cpFadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cpShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        .cp-rpt * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
        .cp-trow:hover td { background:#fafbff !important; }
        .cp-input:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08); }
        .recharts-tooltip-cursor { fill:rgba(33,46,92,0.03) !important; }
      `}</style>

      <div className="cp-rpt" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Analisis</p>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Reportes</h1>
          </div>
          <div style={{ fontSize: '12px', color: '#8892aa', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '9px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <i className="ti ti-chart-bar" style={{ fontSize: '14px', color: NAVY }} aria-hidden="true" />
            Transacciones completadas
          </div>
        </div>

        {/* Filters */}
        <div style={{ ...card, marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: '0 0 5px' }}>Desde</p>
            <input className="cp-input" style={inputStyle} type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: '0 0 5px' }}>Hasta</p>
            <input className="cp-input" style={inputStyle} type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button onClick={load} disabled={loading} style={{ height: '38px', padding: '0 18px', borderRadius: '8px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '7px', opacity: loading ? .65 : 1 }}>
            {loading
              ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Cargando...</>
              : <><i className="ti ti-filter" /> Aplicar filtros</>
            }
          </button>
          {(from || to) && !loading && (
            <button onClick={() => { setFrom(''); setTo('') }} style={{ height: '38px', padding: '0 14px', borderRadius: '8px', background: 'transparent', color: '#8892aa', border: `1px solid ${BORDER}`, fontSize: '13px', cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-x" /> Limpiar
            </button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#8892aa' }}>
            {from && to ? `${from} → ${to}` : from ? `Desde ${from}` : to ? `Hasta ${to}` : 'Todos los registros'}
          </div>
        </div>

        {/* Error */}
        {errMsg && (
          <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e53e3e', animation: 'cpFadeUp 0.2s ease' }}>
            <i className="ti ti-alert-circle" style={{ fontSize: '18px', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, margin: '0 0 2px' }}>No se pudo cargar el reporte</p>
              <p style={{ margin: 0, color: '#b91c1c' }}>{errMsg}</p>
            </div>
            <button onClick={load} style={{ marginLeft: 'auto', height: '32px', padding: '0 14px', borderRadius: '7px', background: '#e53e3e', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", flexShrink: 0 }}>
              Reintentar
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ ...card, display: 'flex', alignItems: 'center', gap: '14px', height: '86px' }}>
                  <Skeleton w="44px" h="44px" r="12px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton w="60%" h="11px" r="5px" />
                    <Skeleton w="80%" h="22px" r="6px" />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>
              <div style={{ ...card, height: '280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Skeleton w="45%" h="14px" r="6px" />
                <Skeleton w="100%" h="210px" r="10px" />
              </div>
              <div style={{ ...card, height: '280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Skeleton w="35%" h="14px" r="6px" />
                <Skeleton w="100%" h="60px" r="8px" />
                <Skeleton w="100%" h="60px" r="8px" />
              </div>
            </div>
          </div>
        )}

        {/* Data */}
        {!loading && data && (
          <>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
              <KpiCard index={0} label="Total transacciones" value={totalTx.toLocaleString()}                                                                             icon="ti-receipt-2"       color={NAVY}  />
              <KpiCard index={1} label="Ingresos totales"    value={`S/. ${totalRevenue.toLocaleString('es-PE',{minimumFractionDigits:2})}`}                             icon="ti-currency-dollar" color={GREEN} />
              <KpiCard index={2} label="Puntos generados"    value={totalPts.toLocaleString()}                                                                            icon="ti-star"            color={GOLD}  />
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px', marginBottom: '20px' }}>

              {/* Bar — por tipo */}
              <div style={{ ...card, animation: 'cpFadeUp 0.45s ease both', animationDelay: '80ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: '0 0 3px' }}>Transacciones por tipo</h2>
                    <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Cantidad de operaciones completadas</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {Object.entries(TYPE_META).map(([k, m]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b7280' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: m.color, display: 'inline-block' }} />
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ left: -16, right: 4, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8892aa', fontFamily: "'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8892aa', fontFamily: "'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Transacciones" radius={[8,8,0,0]} maxBarSize={60}>
                        {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon="ti-chart-bar" title="Sin transacciones" sub="No hay datos para el periodo seleccionado" />
                )}
              </div>

              {/* Por origen */}
              <div style={{ ...card, animation: 'cpFadeUp 0.45s ease both', animationDelay: '160ms' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: '0 0 20px' }}>Por canal de origen</h2>
                {(data.byOrigin || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {data.byOrigin.map(o => {
                      const m   = ORIGIN_META[o.origin] || { label: o.origin, color: NAVY }
                      const pct = Math.min(100, Math.round((o.count / totalCount) * 100))
                      return (
                        <div key={o.origin}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: m.color, display: 'inline-block' }} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f1726' }}>{m.label}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '15px', fontWeight: 700, color: NAVY, margin: 0 }}>{o.count.toLocaleString()}</p>
                              <p style={{ fontSize: '11px', color: '#8892aa', margin: 0 }}>S/. {Number(o.totalAmount).toLocaleString('es-PE',{minimumFractionDigits:2})}</p>
                            </div>
                          </div>
                          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: '4px', transition: 'width 0.9s ease' }} />
                          </div>
                          <p style={{ fontSize: '11px', color: '#8892aa', marginTop: '4px', textAlign: 'right' }}>{pct}% del total</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon="ti-device-desktop" title="Sin datos de origen" sub="No hay transacciones registradas" />
                )}
              </div>
            </div>

            {/* Area — volumen diario */}
            <div style={{ ...card, marginBottom: '20px', animation: 'cpFadeUp 0.45s ease both', animationDelay: '240ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: '0 0 3px' }}>Volumen diario</h2>
                  <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Transacciones completadas por dia</p>
                </div>
                {areaData.length > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: GREEN, background: '#f0faf5', border: '1px solid #c6f0db', borderRadius: '20px', padding: '4px 11px' }}>
                    <i className="ti ti-trending-up" style={{ marginRight: '4px', verticalAlign: '-2px' }} />{areaData.length} dias
                  </span>
                )}
              </div>
              {areaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={areaData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={NAVY} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={NAVY} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8892aa', fontFamily: "'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8892aa', fontFamily: "'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" name="Transacciones" stroke={NAVY} strokeWidth={2.5} fill="url(#rptGrad)"
                      dot={false} activeDot={{ r: 5, fill: NAVY, strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="ti-chart-area" title="Sin datos diarios" sub="Aplica un rango de fechas para ver el volumen dia a dia" />
              )}
            </div>

            {/* Tabla resumen */}
            <div style={{ ...card, animation: 'cpFadeUp 0.45s ease both', animationDelay: '320ms', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: 0 }}>Resumen por tipo de transaccion</h2>
                <span style={{ fontSize: '12px', color: '#8892aa' }}>{(data.byType || []).length} tipos</span>
              </div>
              {(data.byType || []).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#fafbff', borderBottom: `1px solid ${BORDER}` }}>
                      {['Tipo','Cantidad','Monto total','Puntos generados','Promedio/tx'].map((h, i) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.byType.map(t => {
                      const m   = TYPE_META[t.type] || { label: t.type, color: NAVY, icon: 'ti-receipt' }
                      const avg = t.count > 0 ? Number(t.totalAmount) / t.count : 0
                      return (
                        <tr key={t.type} className="cp-trow" style={{ borderBottom: `1px solid #f8f9fb`, transition: 'background 0.12s' }}>
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${m.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className={`ti ${m.icon}`} style={{ fontSize: '15px', color: m.color }} aria-hidden="true" />
                              </div>
                              <span style={{ fontWeight: 600, color: '#0f1726' }}>{m.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>{t.count.toLocaleString()}</td>
                          <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 700, color: '#0f1726' }}>S/. {Number(t.totalAmount).toLocaleString('es-PE',{minimumFractionDigits:2})}</td>
                          <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                            {t.totalPoints > 0
                              ? <span style={{ fontWeight: 700, color: NAVY, background: `${NAVY}08`, padding: '3px 9px', borderRadius: '6px' }}>{Number(t.totalPoints).toLocaleString()}</span>
                              : <span style={{ color: '#b0b8cc' }}>—</span>
                            }
                          </td>
                          <td style={{ padding: '13px 14px', textAlign: 'right', color: '#8892aa', fontSize: '12px' }}>
                            S/. {avg.toLocaleString('es-PE',{minimumFractionDigits:2})}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${BORDER}`, background: '#fafbff' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f1726', fontSize: '13px' }}>Total</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f1726' }}>{totalTx.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f1726' }}>S/. {totalRevenue.toLocaleString('es-PE',{minimumFractionDigits:2})}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: NAVY }}>{totalPts.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#8892aa', fontSize: '12px' }}>
                        S/. {totalTx > 0 ? (totalRevenue / totalTx).toLocaleString('es-PE',{minimumFractionDigits:2}) : '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <EmptyState icon="ti-table-off" title="Sin transacciones registradas" sub="No hay datos para mostrar en este periodo" />
              )}
            </div>
          </>
        )}

        {/* Empty inicial (no datos y no error) */}
        {!loading && !data && !errMsg && (
          <div style={{ ...card, textAlign: 'center', padding: '60px' }}>
            <EmptyState icon="ti-chart-bar" title="Sin datos disponibles" sub="El servidor respondio correctamente pero no hay transacciones registradas aun" />
          </div>
        )}

      </div>
    </>
  )
}
