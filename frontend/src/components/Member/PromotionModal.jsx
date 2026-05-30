const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80";

function formatDate(date) {
  const parsedDate = date ? new Date(date) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "por confirmar";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

function PromotionModal({ promotion, currentIndex, total, onClose, onPrevious, onNext }) {
  if (!promotion) {
    return null;
  }

  const image = promotion.image || FALLBACK_IMAGE;

  return (
    <div className="promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title">
      <button className="promotion-modal__backdrop" type="button" aria-label="Cerrar modal" onClick={onClose} />

      <article className="promotion-modal__panel">
        <div
          className="promotion-modal__visual"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(3, 12, 33, 0.88), rgba(3, 12, 33, 0.46)), url(${image})` }}
        >
          <button className="promotion-modal__close" type="button" onClick={onClose} aria-label="Cerrar">
            x
          </button>

          <div className="promotion-modal__content">
            <span className="promotion-modal__eyebrow">
              {currentIndex + 1} de {total}
            </span>
            <h2 id="promotion-modal-title">{promotion.title}</h2>
            <p>{promotion.description}</p>
            <strong>
              Vigencia: {formatDate(promotion.startDate)} al {formatDate(promotion.endDate)}
            </strong>
          </div>
        </div>

        <footer className="promotion-modal__actions">
          <button type="button" onClick={onPrevious}>Anterior</button>
          <button type="button" onClick={onNext}>Siguiente</button>
        </footer>
      </article>
    </div>
  );
}

export default PromotionModal;
