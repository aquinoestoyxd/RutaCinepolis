// frontend - src - pages - admin - Auditoria
import { Fragment, useState, useEffect, useCallback, useRef } from 'react'
import { getAuditLogs } from '../../api/index.js'

const NAVY = '#212E5C', GOLD = '#e8b84b', GREEN = '#27a86a', RED = '#e53e3e', BORDER = '#eaecf3', BG = '#f4f5f8'

const ACTION_META = {
  CREATE:            { color: GREEN,    bg: '#f0faf5', border: '#6ee7b7', icon: 'ti-plus-circle',    label: 'Creación',       labelShort: 'Creación'    },
  UPDATE:            { color: NAVY,     bg: '#eef1f9', border: '#93a8d4', icon: 'ti-pencil',          label: 'Actualización',  labelShort: 'Actualiz.'   },
  DELETE:            { color: RED,      bg: '#fff4f4', border: '#fca5a5', icon: 'ti-trash',           label: 'Eliminación',    labelShort: 'Elimina.'    },
  LOGIN:             { color: '#0891b2',bg: '#f0f9ff', border: '#7dd3fc', icon: 'ti-login-2',         label: 'Inicio sesión',  labelShort: 'Ingreso'     },
  LOGOUT:            { color: '#6b7280',bg: '#f9fafb', border: '#d1d5db', icon: 'ti-logout-2',        label: 'Cierre sesión',  labelShort: 'Salida'      },
  LEVEL_UPGRADE:     { color: '#92650a',bg: '#fef9ec', border: '#f5d27a', icon: 'ti-trending-up',     label: 'Cambio de nivel',labelShort: 'Nivel up'    },
  POINTS_ADJUSTMENT: { color: '#b45309',bg: '#fffbeb', border: '#fcd34d', icon: 'ti-coins',           label: 'Ajuste puntos',  labelShort: 'Puntos'      },
  REDEMPTION:        { color: '#5b21b6',bg: '#f3f0fe', border: '#c4b5fd', icon: 'ti-gift',            label: 'Canje',          labelShort: 'Canje'       },
  CONFIG_CHANGE:     { color: '#a21caf',bg: '#fdf4ff', border: '#e879f9', icon: 'ti-adjustments',     label: 'Configuración',  labelShort: 'Config'      },
}

const ENTITY_LABELS = {
  Member:          { icon: 'ti-user',         label: 'Miembro'       },
  User:            { icon: 'ti-id-badge-2',   label: 'Usuario staff' },
  Membership:      { icon: 'ti-crown',        label: 'Membresía'     },
  Benefit:         { icon: 'ti-gift',         label: 'Beneficio'     },
  Redemption:      { icon: 'ti-ticket',       label: 'Canje'         },
  SystemConfig:    { icon: 'ti-settings',     label: 'Configuración' },
  Merchandise:     { icon: 'ti-package',      label: 'Merchandising' },
}

function getEventDescription(log) {
  const key = `${log.action}_${log.entity}`
  const map = {
    'CREATE_Member':            'Registró nuevo miembro',
    'UPDATE_Member':            'Actualizó datos de miembro',
    'DELETE_Member':            'Desactivó miembro',
    'CREATE_User':              'Creó usuario de staff',
    'UPDATE_User':              'Actualizó usuario de staff',
    'DELETE_User':              'Eliminó usuario de staff',
    'LOGIN_User':               'Inició sesión en el sistema',
    'LOGOUT_User':              'Cerró sesión del sistema',
    'LEVEL_UPGRADE_Membership': 'Miembro ascendió de nivel',
    'POINTS_ADJUSTMENT_Membership': 'Realizó ajuste de puntos',
    'REDEMPTION_Redemption':    'Procesó canje de beneficio',
    'CREATE_Benefit':           'Creó nuevo beneficio',
    'UPDATE_Benefit':           'Actualizó beneficio',
    'DELETE_Benefit':           'Desactivó beneficio',
    'CONFIG_CHANGE_SystemConfig': 'Modificó configuración del sistema',
    'CREATE_SystemConfig':      'Agregó configuración del sistema',
    'DELETE_SystemConfig':      'Eliminó configuración del sistema',
  }
  return map[key] || `${log.action.charAt(0) + log.action.slice(1).toLowerCase()} en ${log.entity}`
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1)  return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7)  return `Hace ${days}d`
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function formatAbsoluteTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(email = '') {
  const parts = email.split('@')[0].split('.')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : email.slice(0, 2).toUpperCase()
}

function getAvatarColor(email = '') {
  const colors = [
    [NAVY,     '#c7d2e8'],
    ['#0891b2','#e0f2fe'],
    ['#5b21b6','#ede9fe'],
    ['#065f46','#d1fae5'],
    ['#92400e','#fef3c7'],
  ]
  const idx = email.charCodeAt(0) % colors.length
  return colors[idx]
}

function DiffPanel({ log }) {
  const { action, oldValue, newValue } = log
  const hasOld = oldValue && Object.keys(oldValue).length > 0
  const hasNew = newValue && Object.keys(newValue).length > 0

  if (['LOGIN', 'LOGOUT'].includes(action)) {
    return (
      <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6b7280' }}>
        <i className="ti ti-info-circle" style={{ fontSize: '16px', flexShrink: 0 }} />
        Esta acción no genera cambios de datos registrables.
      </div>
    )
  }

  if (!hasOld && !hasNew) {
    return (
      <div style={{ padding: '14px 18px', background: '#f9fafb', borderRadius: '12px', fontSize: '13px', color: '#8892aa' }}>
        Sin detalles adicionales registrados.
      </div>
    )
  }

  const isMutation = hasOld && hasNew

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {hasOld && (
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fca5a5', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {isMutation ? 'Antes del cambio' : 'Valor eliminado'}
            </span>
          </div>
          <pre style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#374151', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.7 }}>
            {JSON.stringify(oldValue, null, 2)}
          </pre>
        </div>
      )}
      {isMutation && (
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '32px', flexShrink: 0 }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f4f5f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-arrow-right" style={{ fontSize: '14px', color: '#8892aa' }} />
          </div>
        </div>
      )}
      {hasNew && (
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#86efac', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {isMutation ? 'Después del cambio' : 'Valor registrado'}
            </span>
          </div>
          <pre style={{ background: '#f8fff9', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#374151', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.7 }}>
            {JSON.stringify(newValue, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function FeedItem({ log, isOpen, onToggle }) {
  const am = ACTION_META[log.action] || { color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', icon: 'ti-dots', label: log.action, labelShort: log.action }
  const en = ENTITY_LABELS[log.entity] || { icon: 'ti-database', label: log.entity }
  const hasDetails = log.oldValue || log.newValue
  const [avatarColor, avatarBg] = getAvatarColor(log.user?.email)
  const entityIdShort = log.entityId ? log.entityId.slice(0, 8) + '…' : null

  return (
    <div style={{
      background: isOpen ? '#fafbff' : '#fff',
      borderLeft: `3px solid ${isOpen ? am.color : BORDER}`,
      transition: 'all 0.2s ease',
    }}>
      {/* Main row */}
      <div
        onClick={() => hasDetails && onToggle()}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: hasDetails ? 'pointer' : 'default' }}
        className="cp-feed-item"
      >
        {/* Action icon bubble */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: am.bg, border: `1px solid ${am.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: '1px',
        }}>
          <i className={`ti ${am.icon}`} style={{ fontSize: '17px', color: am.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
            {/* Description */}
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f1726', margin: 0, lineHeight: 1.3 }}>
              {getEventDescription(log)}
            </p>
            {/* Time + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: am.bg, color: am.color, border: `1px solid ${am.border}`, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <i className={`ti ${am.icon}`} style={{ fontSize: '11px' }} />
                {am.labelShort}
              </span>
            </div>
          </div>

          {/* Meta row: user + entity + time */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
            {/* User */}
            {log.user?.email ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: avatarColor, flexShrink: 0 }}>
                  {getInitials(log.user.email)}
                </div>
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{log.user.email}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="ti ti-robot" style={{ fontSize: '12px', color: '#9ca3af' }} />
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sistema</span>
              </div>
            )}

            {/* Separator */}
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />

            {/* Entity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className={`ti ${en.icon}`} style={{ fontSize: '12px', color: '#8892aa' }} />
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{en.label}</span>
              {entityIdShort && (
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9ca3af', background: '#f4f5f8', padding: '1px 6px', borderRadius: '4px' }}>
                  {entityIdShort}
                </span>
              )}
            </div>

            {/* Separator */}
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />

            {/* Time */}
            <span title={formatAbsoluteTime(log.createdAt)} style={{ fontSize: '12px', color: '#9ca3af', cursor: 'default' }}>
              <i className="ti ti-clock" style={{ fontSize: '11px', marginRight: '3px' }} />
              {formatRelativeTime(log.createdAt)}
            </span>
          </div>

          {/* Expand hint */}
          {hasDetails && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: isOpen ? am.color : '#8892aa', transition: 'color 0.15s' }}>
                <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '11px', marginRight: '3px' }} />
                {isOpen ? 'Ocultar detalle' : 'Ver detalle del cambio'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {isOpen && hasDetails && (
        <div style={{ padding: '0 20px 20px 72px', animation: 'cpSlideDown 0.2s ease both' }}>
          <div style={{ borderTop: `1px dashed ${BORDER}`, paddingTop: '16px' }}>
            <DiffPanel log={log} />
          </div>
        </div>
      )}
    </div>
  )
}

function ActionChip({ actionKey, am, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '34px', padding: '0 14px', borderRadius: '20px',
        border: `1.5px solid ${active ? am.color : BORDER}`,
        background: active ? am.bg : '#fff',
        color: active ? am.color : '#6b7280',
        fontSize: '12px', fontWeight: active ? 700 : 500,
        cursor: 'pointer', fontFamily: "'Barlow',sans-serif",
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      <i className={`ti ${am.icon}`} style={{ fontSize: '13px' }} />
      {am.labelShort}
    </button>
  )
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');
  @keyframes cpFadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cpSlideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin        { to{transform:rotate(360deg)} }
  @keyframes cpShimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .cp-aud * { box-sizing:border-box; font-family:'Barlow',sans-serif; }
  .cp-inp:focus { border-color:${NAVY} !important; box-shadow:0 0 0 3px rgba(33,46,92,0.08) !important; }
  .cp-feed-item:hover { background:#fafbff; }
  .cp-feed-item { transition:background 0.15s; }
`

const INP = {
  height: '38px', borderRadius: '9px', border: `1.5px solid ${BORDER}`,
  padding: '0 12px', fontSize: '13px', outline: 'none',
  fontFamily: "'Barlow',sans-serif", background: '#fff',
  color: '#0f1726', transition: 'border-color 0.15s',
}

export default function Auditoria() {
  const [data, setData]         = useState({ logs: [], total: 0 })
  const [filters, setFilters]   = useState({ action: '', entity: '', from: '', to: '', page: 1 })
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(null)
  const searchRef               = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, limit: 20 }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      setData(await getAuditLogs(params))
    } catch {} finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const totalPages  = Math.ceil((data.meta?.total || data.total || 0) / 20)
  const currentPage = data.meta?.page || filters.page
  const logs        = data.logs || data.data || []
  const total       = data.meta?.total || data.total || 0
  const hasFilters  = filters.action || filters.entity || filters.from || filters.to

  const setAction = (a) => setFilters(f => ({ ...f, action: f.action === a ? '' : a, page: 1 }))
  const clearAll  = () => { setFilters({ action: '', entity: '', from: '', to: '', page: 1 }); if (searchRef.current) searchRef.current.value = '' }

  return (
    <>
      <style>{STYLES}</style>
      <div className="cp-aud" style={{ padding: '28px 32px', background: BG, minHeight: '100%' }}>

        {/* ── HEADER ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', animation: 'cpFadeUp 0.4s ease both' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px' }}>
              Seguridad · Trazabilidad
            </p>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f1726', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              Actividad del sistema
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={load} title="Actualizar"
              style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fff', border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892aa', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = '#8892aa' }}
            >
              <i className={`ti ti-refresh${loading ? '' : ''}`} style={{ fontSize: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-shield-check" style={{ fontSize: '14px', color: NAVY }} />
              </div>
              <div>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#0f1726', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{total.toLocaleString()}</p>
                <p style={{ fontSize: '11px', color: '#8892aa', margin: 0, fontWeight: 500 }}>registros</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTROS ──────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: '16px', animation: 'cpFadeUp 0.4s ease both', animationDelay: '60ms' }}>

          {/* Buscador + fechas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#8892aa', fontSize: '15px', pointerEvents: 'none' }} />
              <input
                ref={searchRef}
                className="cp-inp"
                style={{ ...INP, width: '100%', paddingLeft: '34px' }}
                placeholder="Buscar por entidad (Member, Config, Benefit…)"
                defaultValue={filters.entity}
                onChange={e => setFilters(f => ({ ...f, entity: e.target.value, page: 1 }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ti ti-calendar" style={{ fontSize: '14px', color: '#8892aa' }} />
                <input className="cp-inp" style={{ ...INP, width: '145px' }} type="date" value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value, page: 1 }))} />
              </div>
              <span style={{ color: '#8892aa', fontSize: '12px' }}>—</span>
              <input className="cp-inp" style={{ ...INP, width: '145px' }} type="date" value={filters.to}
                onChange={e => setFilters(f => ({ ...f, to: e.target.value, page: 1 }))} />
              {hasFilters && (
                <button onClick={clearAll}
                  style={{ height: '38px', padding: '0 14px', borderRadius: '9px', background: '#f9fafb', color: '#6b7280', border: `1.5px solid ${BORDER}`, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = RED; e.currentTarget.style.borderColor = '#fca5a5' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = BORDER }}>
                  <i className="ti ti-x" style={{ fontSize: '13px' }} /> Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Chips de acción */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8892aa', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '4px' }}>
              Filtrar por:
            </span>
            {Object.entries(ACTION_META).map(([key, am]) => (
              <ActionChip key={key} actionKey={key} am={am} active={filters.action === key} onClick={() => setAction(key)} />
            ))}
          </div>
        </div>

        {/* ── FEED ──────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${BORDER}`, overflow: 'hidden', animation: 'cpFadeUp 0.4s ease both', animationDelay: '120ms' }}>

          {/* Feed header */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-activity" style={{ fontSize: '16px', color: NAVY }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f1726' }}>
                {filters.action
                  ? `Mostrando: ${ACTION_META[filters.action]?.label}`
                  : 'Todos los eventos'
                }
              </span>
              {!loading && (
                <span style={{ fontSize: '12px', color: '#8892aa', background: '#f4f5f8', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  {logs.length} en esta página
                </span>
              )}
            </div>
            {filters.action && (
              <button onClick={() => setFilters(f => ({ ...f, action: '', page: 1 }))}
                style={{ fontSize: '12px', fontWeight: 600, color: '#8892aa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = NAVY}
                onMouseLeave={e => e.currentTarget.style.color = '#8892aa'}>
                <i className="ti ti-x" style={{ fontSize: '12px' }} /> Ver todos
              </button>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <i className="ti ti-loader-2" style={{ fontSize: '22px', color: NAVY, animation: 'spin 1s linear infinite' }} />
              </div>
              <p style={{ color: '#8892aa', margin: 0, fontSize: '14px', fontWeight: 500 }}>Cargando actividad...</p>
            </div>

          ) : logs.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#f4f5f8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="ti ti-mood-empty" style={{ fontSize: '28px', color: '#d1d5db' }} />
              </div>
              <p style={{ color: '#374151', margin: '0 0 6px', fontSize: '15px', fontWeight: 700 }}>Sin actividad registrada</p>
              <p style={{ color: '#8892aa', margin: '0 0 20px', fontSize: '13px' }}>
                {hasFilters ? 'No hay eventos que coincidan con los filtros aplicados.' : 'Aún no hay actividad en el sistema.'}
              </p>
              {hasFilters && (
                <button onClick={clearAll}
                  style={{ height: '38px', padding: '0 20px', borderRadius: '10px', background: NAVY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                  <i className="ti ti-filter-off" /> Quitar filtros
                </button>
              )}
            </div>

          ) : (
            <div>
              {logs.map((log, idx) => (
                <Fragment key={log.id}>
                  {idx > 0 && <div style={{ height: '1px', background: BORDER, margin: '0 20px' }} />}
                  <FeedItem
                    log={log}
                    isOpen={expanded === log.id}
                    onToggle={() => setExpanded(p => p === log.id ? null : log.id)}
                  />
                </Fragment>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbff' }}>
              <span style={{ fontSize: '13px', color: '#8892aa' }}>
                Página <strong style={{ color: '#374151' }}>{currentPage}</strong> de <strong style={{ color: '#374151' }}>{totalPages}</strong>
                {' · '}
                <strong style={{ color: '#374151' }}>{total.toLocaleString()}</strong> registros
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: 1 }))}
                  disabled={currentPage <= 1}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#d1d5db' : NAVY, opacity: currentPage <= 1 ? 0.5 : 1 }}>
                  <i className="ti ti-chevrons-left" style={{ fontSize: '13px' }} />
                </button>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  disabled={currentPage <= 1}
                  style={{ height: '32px', padding: '0 14px', borderRadius: '8px', background: '#fff', border: `1.5px solid ${BORDER}`, fontSize: '12px', fontWeight: 600, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#d1d5db' : NAVY, opacity: currentPage <= 1 ? 0.5 : 1, fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ti ti-chevron-left" style={{ fontSize: '13px' }} /> Anterior
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p
                  if (totalPages <= 5) p = i + 1
                  else if (currentPage <= 3) p = i + 1
                  else if (currentPage >= totalPages - 2) p = totalPages - 4 + i
                  else p = currentPage - 2 + i
                  return (
                    <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1.5px solid ${p === currentPage ? NAVY : BORDER}`, background: p === currentPage ? NAVY : '#fff', color: p === currentPage ? '#fff' : '#6b7280', fontSize: '12px', fontWeight: p === currentPage ? 700 : 500, cursor: 'pointer', fontFamily: "'Barlow',sans-serif" }}>
                      {p}
                    </button>
                  )
                })}

                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={currentPage >= totalPages}
                  style={{ height: '32px', padding: '0 14px', borderRadius: '8px', background: '#fff', border: `1.5px solid ${BORDER}`, fontSize: '12px', fontWeight: 600, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#d1d5db' : NAVY, opacity: currentPage >= totalPages ? 0.5 : 1, fontFamily: "'Barlow',sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Siguiente <i className="ti ti-chevron-right" style={{ fontSize: '13px' }} />
                </button>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: totalPages }))}
                  disabled={currentPage >= totalPages}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#d1d5db' : NAVY, opacity: currentPage >= totalPages ? 0.5 : 1 }}>
                  <i className="ti ti-chevrons-right" style={{ fontSize: '13px' }} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
