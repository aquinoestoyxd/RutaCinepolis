import { useState } from "react";

/**
 * Banner de aviso informativo para el portal del miembro.
 * Edita las props `type` y `message` para cambiar el contenido.
 *
 * type: "info" | "warning" | "success" | "promo"
 */
function AnnouncementBanner({
  type = "info",
  message = "¡Recuerda que tus puntos vencen el 31 de diciembre! Canjéalos antes de que expire tu saldo.",
  link = null,
  linkText = "Ver más",
  dismissible = true,
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const config = {
    info: {
      bg: "linear-gradient(90deg, #0b5cff 0%, #1a74ff 100%)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
    warning: {
      bg: "linear-gradient(90deg, #d97706 0%, #f59e0b 100%)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    success: {
      bg: "linear-gradient(90deg, #059669 0%, #10b981 100%)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    promo: {
      bg: "linear-gradient(90deg, #7c3aed 0%, #a855f7 60%, #ec4899 100%)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  };

  const { bg, icon } = config[type] || config.info;

  return (
    <div style={{ background: bg }} className="announcement-banner">
      <div className="announcement-banner__inner">
        <span className="announcement-banner__icon">{icon}</span>
        <p className="announcement-banner__text">{message}</p>
        {link && (
          <a href={link} className="announcement-banner__link">
            {linkText}
          </a>
        )}
        {dismissible && (
          <button
            className="announcement-banner__close"
            onClick={() => setVisible(false)}
            aria-label="Cerrar aviso"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default AnnouncementBanner;
