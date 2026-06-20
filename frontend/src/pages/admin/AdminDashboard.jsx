// frontend - src - pages - admin - AdminDashboard
import { useState, useEffect, useCallback } from 'react'
import { getKpi, getMemberGrowth } from '../../api/index.js'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const NAVY   = '#212E5C'
const GOLD   = '#e8b84b'
const GREEN  = '#27a86a'
const RED    = '#e53e3e'

const LEVEL_META = {
  ESTANDAR: { color: '#94a3b8', bg: '#f1f5f9', text: '#475569', label: 'Estandar',  gradient: ['#e2e8f0','#94a3b8'] },
  PREMIUM:  { color: NAVY,      bg: '#e8ecf5', text: NAVY,      label: 'Premium',   gradient: ['#c7d2e8','#212E5C'] },
  GOLDEN:   { color: GOLD,      bg: '#fef9ec', text: '#92650a', label: 'Golden',    gradient: ['#fef3c7','#e8b84b'] },
}

/* ── SVG Icons embebidos ──────────────────────────────────── */
const IconTicket = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 -7.59 154.79 154.79" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-517.238 -128.444)">
      <path d="M528.737,170.978l-10.13,14.781a7.885,7.885,0,0,0,2.04,10.929l17.983,12.326a5.554,5.554,0,0,1,9.159,6.278l74.993,51.4a7.887,7.887,0,0,0,10.931-2.041l10.1-14.733a13.752,13.752,0,0,1,15.548-22.685l11.3-16.487a7.887,7.887,0,0,0-2.04-10.931l-75.037-51.427a4.715,4.715,0,0,1-.315.578,5.569,5.569,0,0,1-9.186-6.3,4.772,4.772,0,0,1,.425-.5l-18.024-12.354a7.885,7.885,0,0,0-10.93,2.042l-11.333,16.536a13.754,13.754,0,0,1-15.482,22.587Z" fill="#f39014" opacity="0.9"/>
    </g>
  </svg>
)

const IconPopcorn = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="-8.21 0 141.542 141.542" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-835.069 -127.481)">
      <path d="M959.4,173.13a14.516,14.516,0,1,1-14.747-14.281A14.515,14.515,0,0,1,959.4,173.13Z" fill="#fce4ab"/>
      <path d="M878.922,166.5a17.867,17.867,0,1,1-18.152-17.576A17.867,17.867,0,0,1,878.922,166.5Z" fill="#fce4ab"/>
      <path d="M940.9,145.059a17.867,17.867,0,1,1-18.154-17.576A17.869,17.869,0,0,1,940.9,145.059Z" fill="#fce4ab"/>
      <path d="M841.115,188.493l15.6,72.695,84.236-1.359L954.2,186.669Z" fill="#f39014"/>
      <path d="M863.6,188.13l9.8,72.788,16.843-.272L886.2,187.765Z" fill="#e5eff3"/>
      <path d="M841.115,188.493l15.6,72.695,16.69-.27-9.8-72.788Z" fill="#ed4d55"/>
      <path d="M954.2,186.669l-22.816.367L923.935,260.1l17.017-.274Z" fill="#ed4d55"/>
      <path d="M960.185,185.649a6.925,6.925,0,0,1-6.812,7.036l-111.238,1.794a6.925,6.925,0,0,1-7.036-6.811l-.029-1.847a6.925,6.925,0,0,1,6.811-7.036l111.238-1.793a6.925,6.925,0,0,1,7.036,6.811Z" fill="#ed4d55"/>
    </g>
  </svg>
)

const IconSeat = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="-14.66 0 139.807 139.807" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-539.386 -380.488)">
      <path d="M607.241,380.488H582.024a25.937,25.937,0,0,0-25.862,25.864v80.463H633.1V406.352A25.938,25.938,0,0,0,607.241,380.488Z" fill="#ed4d55"/>
      <path d="M633.1,486.815H556.162a5.461,5.461,0,0,0-5.461,5.461v21.568H638.56V492.276A5.461,5.461,0,0,0,633.1,486.815Z" fill="#c52c58" opacity="0.8"/>
      <path d="M549.386,507.568H640.5v5.461a5.461,5.461,0,0,1-5.461,5.461H554.847a5.461,5.461,0,0,1-5.461-5.461Z" fill="#483b44" opacity="0.7"/>
    </g>
  </svg>
)

const IconFilm = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 -6.41 144.064 144.064" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-825.595 -628.744)">
      <path d="M825.653,741.516a2.705,2.705,0,0,1,3.149-2.1v-.005c.268.052.51.107.726.152,31.678,6.616,54.417.582,69.352-7.005a77.9,77.9,0,0,0,16.574-11.233c1.8-1.614,3.141-2.986,4.015-3.94.436-.476.757-.852.963-1.1s.275-.341.277-.339L925,719.255c-.168.215-7.776,10.038-23.663,18.128-15.867,8.093-40.05,14.361-72.861,7.491l-.059-.013c-.241-.05-.457-.1-.659-.137h-.012l-.01,0h0A2.708,2.708,0,0,1,825.653,741.516Z" fill="#483b44"/>
    </g>
  </svg>
)

const IconReport = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <path d="M314.5 334.1h84.4v319.7h-84.4z" fill="#55B7A8"/>
    <path d="M475.3 145.7h84.4v508.1h-84.4z" fill="#DC444A"/>
    <path d="M636 241.8h84.4v412H636z" fill="#68A4D9"/>
    <path d="M135.3 373h753.1v493H135.3z" fill="none" stroke="#0A0408" strokeWidth="16"/>
  </svg>
)

/* ── Tooltip ─────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #eaecf3', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontFamily: "'Barlow',sans-serif" }}>
      <p style={{ fontWeight: 700, color: NAVY, margin: '0 0 5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: '#374151', fontSize: '13px' }}>
          {p.name}: <strong style={{ color: NAVY }}>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

/* ── Skeleton ────────────────────────────────────────────── */
const Skeleton = ({ w = '100%', h = '20px', r = '8px' }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#f0f2f8 25%,#e4e7f0 50%,#f0f2f8 75%)', backgroundSize: '200% 100%', animation: 'cpShimmer 1.4s ease infinite' }} />
)

/* ── KPI Card ────────────────────────────────────────────── */
function KpiCard({ label, value, sub, accent, index, icon: Icon, trend, trendUp }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '18px', border: '1px solid #eaecf3',
      padding: '22px 24px', position: 'relative', overflow: 'hidden',
      animation: 'cpFadeUp 0.5s ease both', animationDelay: `${index * 70}ms`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      {/* Decorative circle */}
      <div style={{ position: 'absolute', bottom: -28, right: -20, width: '100px', height: '100px', borderRadius: '50%', background: `${accent}08`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -14, right: 14, opacity: 0.07, pointerEvents: 'none', transform: 'scale(1.1)' }}>
        {Icon && <Icon size={64} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '18px', flexShrink: 0 }}>
          <i className={`ti ${Icon ? 'ti-star' : 'ti-chart-bar'}`} style={{ display: 'none' }} />
          {Icon ? <Icon size={22} /> : <i className="ti ti-chart-bar" aria-hidden="true" />}
        </div>
      </div>
      <p style={{ fontSize: '32px', fontWeight: 700, color: '#0f1726', letterSpacing: '-0.04em', margin: '0 0 6px', lineHeight: 1 }}>
        {value ?? <span style={{ color: '#d1d5db', fontSize: '22px' }}>—</span>}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {trend && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: trendUp ? GREEN : RED, background: trendUp ? '#f0faf5' : '#fff4f4', padding: '2px 8px', borderRadius: '20px' }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
        {sub && <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ── Error State ─────────────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '48px', fontFamily: "'Barlow',sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '20px', background: '#fff4f4', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px', color: '#e53e3e' }}>
          <i className="ti ti-wifi-off" />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f1726', margin: '0 0 10px', letterSpacing: '-0.02em' }}>No se pudieron cargar los datos</h3>
        <p style={{ fontSize: '14px', color: '#8892aa', margin: '0 0 8px', lineHeight: 1.6 }}>{message}</p>
        <p style={{ fontSize: '13px', color: '#b0b8cc', margin: '0 0 28px' }}>
          Verifica que el backend este corriendo en{' '}
          <code style={{ background: '#f4f5f8', padding: '2px 7px', borderRadius: '5px', fontSize: '12px', color: '#374151' }}>localhost:3001</code>
        </p>
        <button onClick={onRetry}
          style={{ height: '44px', padding: '0 28px', borderRadius: '10px', background: NAVY, color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(33,46,92,0.25)' }}>
          <i className="ti ti-refresh" /> Reintentar
        </button>
      </div>
    </div>
  )
}

/* ── LEVEL CARD con ilustracion SVG ─────────────────────── */
function LevelCard({ levelData, total, delay }) {
  const meta = LEVEL_META[levelData.level] || LEVEL_META.ESTANDAR
  const pct  = levelData.percentage || 0
  const icons = { ESTANDAR: 'ti-user', PREMIUM: 'ti-user-star', GOLDEN: 'ti-crown' }
  return (
    <div style={{
      borderRadius: '14px', padding: '16px 18px', border: `1px solid ${meta.color}22`,
      background: `linear-gradient(135deg, ${meta.gradient[0]}55, ${meta.gradient[1]}22)`,
      animation: 'cpFadeUp 0.5s ease both', animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`ti ${icons[levelData.level] || 'ti-user'}`} style={{ fontSize: '15px', color: meta.color }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: meta.text }}>{meta.label}</span>
        </div>
        <span style={{ fontSize: '20px', fontWeight: 800, color: meta.text, letterSpacing: '-0.03em' }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: `${meta.color}20`, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: '3px', transition: 'width 1.2s cubic-bezier(.22,1,.36,1)' }} />
      </div>
      <p style={{ fontSize: '13px', fontWeight: 600, color: meta.text, margin: 0 }}>
        {(levelData.count || 0).toLocaleString()} miembros
      </p>
    </div>
  )
}

/* ── STYLES ──────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cpShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
  .cp-dash * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-dash ::-webkit-scrollbar { width:5px }
  .cp-dash ::-webkit-scrollbar-thumb { background:#d1d5e0; border-radius:3px }
  .recharts-tooltip-cursor { fill:rgba(33,46,92,0.03) !important }
  .cp-sprow:hover td { background:#fafbff !important }
  .cp-kpi-mini:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(33,46,92,0.1); }
  .cp-kpi-mini { transition: transform 0.2s, box-shadow 0.2s; }
`

/* ── PAGE ────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [kpi, setKpi]         = useState(null)
  const [growth, setGrowth]   = useState([])
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg]   = useState('')
  const year = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true); setErrMsg('')
    try {
      const kpiResult = await getKpi({})
      setKpi(kpiResult)
      try {
        const g = await getMemberGrowth(year)
        setGrowth(Array.isArray(g) ? g.map(d => ({ ...d, month: MONTHS[(d.month ?? 1) - 1] })) : [])
      } catch { setGrowth([]) }
    } catch (err) {
      const status = err?.response?.status
      const msg    = err?.response?.data?.error || err?.message || 'Error desconocido'
      if (status === 401)   setErrMsg('Sesion expirada. Vuelve a iniciar sesion.')
      else if (status === 403) setErrMsg('Sin permiso para ver estos datos.')
      else if (!status)        setErrMsg('Sin conexion con el servidor.')
      else                     setErrMsg(`${msg} (HTTP ${status})`)
    } finally { setLoading(false) }
  }, [year])

  useEffect(() => { load() }, [load])

  /* Loading */
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="cp-dash" style={{ padding: '28px 32px', background: '#f4f5f8', minHeight: '100%' }}>
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div><Skeleton w="160px" h="12px" r="5px" /><div style={{marginTop:'10px'}}><Skeleton w="200px" h="30px" r="8px" /></div></div>
          <Skeleton w="180px" h="36px" r="9px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[0,1,2,3].map(i => <div key={i} style={{ background:'#fff', borderRadius:'18px', border:'1px solid #eaecf3', padding:'22px', height:'130px', display:'flex', flexDirection:'column', gap:'14px' }}><Skeleton w="50%" h="11px" r="5px"/><Skeleton w="70%" h="34px" r="8px"/><Skeleton w="40%" h="11px" r="5px"/></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[0,1].map(i => <div key={i} style={{ background:'#fff', borderRadius:'18px', border:'1px solid #eaecf3', padding:'22px', height:'300px', display:'flex', flexDirection:'column', gap:'14px' }}><Skeleton w="45%" h="14px" r="6px"/><Skeleton w="100%" h="220px" r="10px"/></div>)}
        </div>
      </div>
    </>
  )

  /* Error */
  if (errMsg) return (
    <><style>{STYLES}</style>
    <div className="cp-dash" style={{ background: '#f4f5f8', minHeight: '100%' }}>
      <ErrorState message={errMsg} onRetry={load} />
    </div></>
  )

  const s        = kpi?.summary || {}
  const totalPts = s.totalPointsEarned ?? null
  const pieData  = (kpi?.levelDistribution || []).map(d => ({
    name:  LEVEL_META[d.level]?.label || d.level,
    value: d.count ?? 0,
    color: LEVEL_META[d.level]?.color || '#ccc',
  }))
  const now = new Date()
  const dateLabel = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const maxGrowth = Math.max(...growth.map(g => g.count || 0), 1)

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-dash" style={{ padding: '28px 32px', background: '#f4f5f8', minHeight: '100%' }}>

        {/* ── HEADER ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>
              Programa Ruta Cinepolis
            </p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#8892aa', background: '#fff', border: '1px solid #eaecf3', borderRadius: '10px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-calendar-event" style={{ fontSize: '15px', color: NAVY }} />
              <span style={{ textTransform: 'capitalize' }}>{dateLabel}</span>
            </div>
            <button onClick={load} title="Actualizar"
              style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fff', border: '1px solid #eaecf3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#8892aa', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#eaecf3'; e.currentTarget.style.color = '#8892aa' }}
            >
              <i className="ti ti-refresh" />
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          <KpiCard index={0} label="Total miembros"      value={s.totalMembers?.toLocaleString()}        accent={NAVY}    icon={IconSeat}    sub="registrados" />
          <KpiCard index={1} label="Nuevos este periodo" value={s.newMembersThisPeriod?.toLocaleString()} accent={GREEN}   icon={IconTicket}  trend="este mes" trendUp />
          <KpiCard index={2} label="Ingresos totales"    value={s.totalRevenue != null ? `S/. ${Number(s.totalRevenue).toLocaleString('es-PE',{minimumFractionDigits:2})}` : null} accent={GOLD} icon={IconPopcorn} />
          <KpiCard index={3} label="Transacciones"       value={s.totalTransactions?.toLocaleString()}   accent="#5b6ee8" sub="periodo actual" />
        </div>

        {/* ── BANNER PUNTOS ─────────────────────────────── */}
        {totalPts != null && (
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #1a2449 60%, #2d3f7a 100%)`,
            borderRadius: '18px', padding: '22px 32px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'cpFadeUp 0.5s ease both', animationDelay: '280ms',
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', right: 80, bottom: -50, width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(232,184,75,0.07)' }} />
            <div style={{ position: 'absolute', left: 320, top: '50%', transform: 'translateY(-50%)', opacity: 0.05 }}>
              <IconFilm size={120} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(232,184,75,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-star-filled" style={{ fontSize: '26px', color: GOLD }} />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>Puntos generados en el periodo</p>
                <p style={{ fontSize: '30px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
                  {totalPts.toLocaleString()}
                  <span style={{ fontSize: '16px', fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>pts acumulados</span>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 1 }}>
              {[
                { label: 'Promedio/miembro', value: s.totalMembers > 0 ? Math.round(totalPts / s.totalMembers).toLocaleString() : '—' },
                { label: 'Ano en curso', value: String(year) },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, letterSpacing: '-0.02em' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ROW: GROWTH + DISTRIBUTION ────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', marginBottom: '24px' }}>

          {/* Area chart crecimiento */}
          <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #eaecf3', padding: '24px', animation: 'cpFadeUp 0.5s ease both', animationDelay: '140ms' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Crecimiento de miembros</h2>
                <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Nuevos registros por mes — {year}</p>
              </div>
              {growth.length > 0 && (
                <div style={{ textAlign: 'right', background: '#f4f5f8', borderRadius: '10px', padding: '10px 16px' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: NAVY, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {growth.reduce((a,d) => a+(d.count||0), 0).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '11px', color: '#8892aa', margin: '3px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>total {year}</p>
                </div>
              )}
            </div>
            {growth.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growth} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={NAVY} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={NAVY} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8892aa', fontFamily: "'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8892aa', fontFamily: "'Barlow',sans-serif" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Nuevos miembros" stroke={NAVY} strokeWidth={2.5} fill="url(#growthGrad)"
                    dot={{ r: 3.5, fill: NAVY, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: NAVY, strokeWidth: 2.5, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#b0b8cc', gap: '10px' }}>
                <i className="ti ti-chart-area" style={{ fontSize: '40px', opacity: .2 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Sin datos para {year}</p>
              </div>
            )}
          </div>

          {/* Distribucion niveles */}
          <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #eaecf3', padding: '24px', animation: 'cpFadeUp 0.5s ease both', animationDelay: '210ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Por nivel</h2>
                <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Distribucion actual</p>
              </div>
              <span style={{ fontSize: '12px', color: '#8892aa', background: '#f4f5f8', borderRadius: '8px', padding: '5px 10px', fontWeight: 600 }}>
                {(kpi?.levelDistribution || []).reduce((a,d) => a+(d.count||0), 0).toLocaleString()} total
              </span>
            </div>

            {/* Donut */}
            {pieData.length > 0 && (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Level cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(kpi?.levelDistribution || []).map((d, i) => (
                <LevelCard key={d.level} levelData={d} total={s.totalMembers} delay={280 + i * 60} />
              ))}
            </div>
          </div>
        </div>

        {/* ── TOP SPENDERS ─────────────────────────────── */}
        {kpi?.topSpenders?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid #eaecf3', overflow: 'hidden', animation: 'cpFadeUp 0.5s ease both', animationDelay: '350ms' }}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f1726', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Top miembros por gasto</h2>
                <p style={{ fontSize: '12px', color: '#8892aa', margin: 0 }}>Los 5 con mayor gasto acumulado en el periodo</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#fef9ec', border: '1px solid #f5d27a', borderRadius: '9px', padding: '7px 14px' }}>
                <i className="ti ti-crown" style={{ fontSize: '15px', color: '#92650a' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#92650a' }}>Ranking</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#fafbff', borderBottom: '1px solid #f1f5f9' }}>
                  {['#','Miembro','Tarjeta','Nivel','Gasto total','Visitas','Puntos'].map((h,i) => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: i>=4?'right':'left', fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpi.topSpenders.slice(0,5).map((sp, i) => {
                  const lk   = sp.level?.toUpperCase()
                  const meta = LEVEL_META[lk] || LEVEL_META.ESTANDAR
                  const rankColors = ['#e8b84b','#94a3b8','#cd7f32','#8892aa','#8892aa']
                  return (
                    <tr key={i} className="cp-sprow" style={{ borderBottom: '1px solid #f8f9fb', transition: 'background 0.12s' }}>
                      <td style={{ padding: '15px 18px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${rankColors[i]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: rankColors[i] }}>
                          {i+1}
                        </div>
                      </td>
                      <td style={{ padding: '15px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: NAVY, flexShrink: 0, letterSpacing: '-0.02em' }}>
                            {(sp.member||'?').split(' ').map(w=>w[0]).slice(0,2).join('')}
                          </div>
                          <span style={{ fontWeight: 600, color: '#0f1726' }}>{sp.member}</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px 18px', fontFamily: 'monospace', fontSize: '12px', color: '#8892aa', letterSpacing: '0.08em' }}>
                        {sp.cardNumber?.replace(/(.{4})/g,'$1 ').trim()}
                      </td>
                      <td style={{ padding: '15px 18px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px', background: meta.bg, color: meta.text, display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                          {lk === 'GOLDEN' && <i className="ti ti-crown" style={{ fontSize: '11px' }} />}
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: '15px 18px', textAlign: 'right', fontWeight: 800, color: '#0f1726', fontSize: '15px', letterSpacing: '-0.02em' }}>
                        S/. {Number(sp.totalSpent||0).toFixed(2)}
                      </td>
                      <td style={{ padding: '15px 18px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                          <i className="ti ti-ticket" style={{ fontSize: '13px', color: '#8892aa' }} />
                          {sp.totalVisits||0}
                        </div>
                      </td>
                      <td style={{ padding: '15px 18px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: NAVY, background: `${NAVY}08`, padding: '4px 10px', borderRadius: '7px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="ti ti-star" style={{ fontSize: '12px', color: GOLD }} />
                          {Number(sp.points||0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  )
}
