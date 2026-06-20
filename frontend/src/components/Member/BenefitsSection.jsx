const levelColors = {
  standard: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'ESTÁNDAR' },
  premium: { bg: '#e8ecf5', color: '#212E5C', border: '#93a8d4', label: 'PREMIUM' },
  golden: { bg: '#fef9ec', color: '#92650a', border: '#f5d27a', label: 'GOLDEN' },
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
        <p className="benefits-count">{safeBenefits.length} {safeBenefits.length === 1 ? 'beneficio' : 'beneficios'} activo{safeBenefits.length !== 1 ? 's' : ''} para tu nivel</p>
      </div>

      <div className="benefits-grid" aria-label={`Beneficios para nivel ${levelLabel}`}>
        {safeBenefits.map((benefit) => (
          <BenefitCard key={benefit.id} benefit={benefit} />
        ))}
      </div>
    </section>
  )
}

function BenefitCard({ benefit }) {
  const lc = levelColors[benefit.level] || levelColors.standard

  const getIcon = (type) => {
    switch (type) {
      case 'DISCOUNT_TICKET':
        return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a4 4 0 0 1 4-4h6"/><polyline points="23 7 23 17 17 17 17 7"/><polyline points="17 21 7 21 7 7"/></svg>
      case 'DISCOUNT_CANDY':
        return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 15 10-15-10-15z"/><path d="M2 17l10 5 10-5"/><path d="M7 17l5-5 5 5"/></svg>
      case 'FREE_TICKET':
        return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="20" height="14" rx="2"/><path d="M12 4v4M8 12h8M12 16v4"/></svg>
      case 'MERCHANDISE':
        return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v-10"/><path d="M8 17h8"/></svg>
      default:
        return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
    }
  }

  const iconColor = lc.color
  const iconBg = lc.bg

  return (
    <article className="benefit-card">
      <div className="benefit-card__icon" style={{ background: iconBg, color: iconColor }}>
        {getIcon(benefit.type)}
      </div>
      <div className="benefit-card__content">
        <h3 className="benefit-card__title">{benefit.title}</h3>
        {benefit.description && (
          <p className="benefit-card__description">{benefit.description}</p>
        )}
      </div>
      <div className="benefit-card__footer">
        <span className="benefit-badge" style={{ background: lc.bg, color: lc.color, borderColor: lc.border }}>
          {lc.label}
        </span>
        <span className="benefit-status benefit-status--active">ACTIVO</span>
      </div>
    </article>
  )
}

export default BenefitsSection
