const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80";

function formatValidity(endDate) {
  const date = endDate ? new Date(endDate) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "vigencia por confirmar";
  }

  return `hasta ${new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)}`;
}

function PromotionCard({ promotion, onSelect }) {
  const image = promotion.image || FALLBACK_IMAGE;

  return (
    <button className="promotion-card" type="button" onClick={onSelect}>
      <span
        className="promotion-card__image"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />

      <span className="promotion-card__content">
        <span className="promotion-card__label">Beneficio vigente</span>
        <strong>{promotion.title}</strong>
        <span>{formatValidity(promotion.endDate)}</span>
      </span>
    </button>
  );
}

export default PromotionCard;
