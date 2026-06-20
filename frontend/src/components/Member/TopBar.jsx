import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TopBar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const go = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="dashboard-navbar__top">
      <div className="dashboard-navbar__inner dashboard-navbar__inner--top">
        <span className="app-navbar__logo">cin&eacute;polis</span>

        <div className="app-navbar__user dashboard-user" ref={menuRef}>
          <button
            className="app-navbar__avatar"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu de usuario"
            aria-expanded={isOpen}
          >
            {(user.name || "U").charAt(0)}
          </button>
          <span className="dashboard-user__name">{user.name || "Usuario"}</span>

          {isOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown__header">
                <strong>{(user.name || "") + " " + (user.lastName || "")}</strong>
                <small>{(user.level || "miembro").toUpperCase()}</small>
              </div>
              <div className="user-dropdown__items">
                <button type="button" onClick={() => go("/member/profile")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Mi Perfil
                </button>
                <button type="button" onClick={() => go("/member/activity")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Historial de Actividad
                </button>
                <button type="button" onClick={() => go("/member/notifications")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Notificaciones
                </button>
                <hr />
                <button type="button" onClick={onLogout} className="user-dropdown__logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar Sesi&oacute;n
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar;
