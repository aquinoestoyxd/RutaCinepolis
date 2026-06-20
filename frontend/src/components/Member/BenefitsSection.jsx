const NAVY = '#212E5C', BORDER = '#eaecf3'

const levelColors = {
  standard: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Estandar' },
  premium: { bg: '#e8ecf5', color: '#212E5C', border: '#93a8d4', label: 'Premium' },
  golden: { bg: '#fef9ec', color: '#92650a', border: '#f5d27a', label: 'Golden' },
}

function BenefitCard({ benefit }) {
  const lc = levelColors[benefit.level] || levelColors.standard
  return (
    <div style={{
      background: '#fff', borderRadius: '14px', border: `1px solid ${BORDER}`,
      padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(33,46,92,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <p style={{ fontWeight: 700, color: '#0f1726', margin: 0, fontSize: '14px', flex: 1 }}>{benefit.title}</p>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
          background: lc.bg, color: lc.color, border: `1px solid ${lc.border}`,
          letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {lc.label}
        </span>
      </div>
      {benefit.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{benefit.description}</p>
      )}
    </div>
  )
}

function BenefitsSection({ levelLabel, levelStyle, benefits }) {
  const safeBenefits = Array.isArray(benefits) ? benefits : []

  return (
    <section className="benefits-section" id="beneficios" style={levelStyle}>
      <div className="benefits-section__heading">
        <div>
          <span>Club Cinepolis {levelLabel}</span>
          <h2>Beneficios Vigentes</h2>
        </div>
        <p>{safeBenefits.length} beneficios activos para tu nivel</p>
      </div>

      <div className="promotions-row" aria-label={`Beneficios para nivel ${levelLabel}`}>
        {safeBenefits.map((benefit) => (
          <BenefitCard key={benefit.id} benefit={benefit} />
        ))}
      </div>
    </section>
  )
}

export default BenefitsSection
