import "./Dashboard.css";
import "../../styles/global.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BenefitsSection from "../../components/Member/BenefitsSection";
import CinepolisMark from "../../components/Member/CinepolisMark";
import Navbar from "../../components/Member/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getLevelConfig } from "../../utils/member/levelConfig";
import { getLevelNotificationText, getLevelProgress } from "../../utils/member/levelProgress";
import { markNotificationAsReadMember, markAllNotificationsAsReadMember } from "../../api/index.js";

function formatCardNumber(cardNumber) {
  return String(cardNumber || "").replace(/(.{4})/g, "$1 ").trim();
}

function formatNotificationDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Dashboard() {
  const { dashboardData, logout, refetchError } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    if (dashboardData?.notifications) {
      setNotifications(dashboardData.notifications);
    }
  }, [dashboardData]);

  if (!dashboardData) {
    return <div className="flex items-center justify-center h-screen bg-[#020a18] text-white">Cargando dashboard...</div>;
  }

  const user = dashboardData.user || {};
  const benefits = Array.isArray(dashboardData.benefits) ? dashboardData.benefits : [];
  const levelNotifications = Array.isArray(notifications)
    ? notifications.filter((notification) =>
        ["LEVEL_PROGRESS", "LEVEL_UPGRADE"].includes(notification.type)
      )
    : [];
  const levelKey = user?.level?.toLowerCase() || "standard";
  const level = getLevelConfig(levelKey);
  const levelProgress = getLevelProgress(levelKey, user?.visits, user?.progress);
  const levelNotificationText = getLevelNotificationText(levelProgress);
  const fullName = `${user?.name || ""} ${user?.lastName || ""}`.trim().toUpperCase();

  // Normalizar el nombre de la clase para CSS (estandar -> standard)
  const cssLevelClass = levelKey === "estandar" ? "standard" : levelKey;

  const levelStyle = {
    "--level-color": level.color,
    "--level-dark": level.darkColor,
    "--level-soft": level.softColor,
  };

  const showActionMsg = (text, type = 'error') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsReadMember(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      
      const savedDashboard = localStorage.getItem('rc_dashboard');
      if (savedDashboard) {
        const data = JSON.parse(savedDashboard);
        data.notifications = data.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        localStorage.setItem('rc_dashboard', JSON.stringify(data));
      }
    } catch {
      showActionMsg('Error al marcar como leida. Intenta nuevamente.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadMember();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      const savedDashboard = localStorage.getItem('rc_dashboard');
      if (savedDashboard) {
        const data = JSON.parse(savedDashboard);
        data.notifications = data.notifications.map((n) => ({ ...n, isRead: true }));
        localStorage.setItem('rc_dashboard', JSON.stringify(data));
      }
    } catch {
      showActionMsg('Error al marcar todas como leidas. Intenta nuevamente.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/member/login");
  };

  return (
    <main className="dashboard-page">
      <Navbar user={user} onLogout={handleLogout} />

      {actionMsg && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: actionMsg.type === 'error' ? '#fff4f4' : '#f0faf5', border: `1px solid ${actionMsg.type === 'error' ? '#fca5a5' : '#c6f0db'}`, color: actionMsg.type === 'error' ? '#c53030' : '#065f46', display: 'flex', alignItems: 'center', gap: '9px', animation: 'cpFadeUp 0.2s ease' }}>
          <i className={`ti ${actionMsg.type === 'error' ? 'ti-alert-circle' : 'ti-circle-check'}`} style={{ fontSize: '16px', flexShrink: 0 }} />
          {actionMsg.text}
        </div>
      )}

      {refetchError && (
        <div style={{ background: '#fff4f4', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#c53030', fontWeight: 500 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: '16px', flexShrink: 0 }} />
          {refetchError}
        </div>
      )}

      <section className="dashboard-hero">
        <div className="dashboard-welcome">
          <h1 style={{ "--level-color": level.color }}>Bienvenido {user?.name || "Miembro"}</h1>
          <span>Que bueno tenerte de vuelta.</span>
        </div>

        <article className={`membership-card membership-card--${cssLevelClass}`} style={levelStyle}>
          <div>
            <p>club <span>★</span></p>
            <h2>cin&eacute;polis</h2>
          </div>
          <strong>{level.label}</strong>
          <CinepolisMark className="membership-card__brand-mark" />
          <div className="membership-card__footer">
            <span>{fullName}</span>
            <span>{formatCardNumber(user.cardNumber) || "Tarjeta no disponible"}</span>
          </div>
        </article>
      </section>

      <section className="dashboard-stats" style={levelStyle}>
        <article className="dashboard-panel points-panel">
          <div>
            <p>Puntos acumulados</p>
            <h2>{Number(user.points || 0).toLocaleString()} <span>puntos</span></h2>
          </div>
          <span className="panel-icon" aria-hidden="true">☆</span>
        </article>

        <article className="dashboard-panel points-panel">
          <div>
            <p>Visitas registradas</p>
            <h2>{Number(user.visits || 0).toLocaleString()} <span>visitas</span></h2>
          </div>
          <span className="panel-icon" aria-hidden="true">✓</span>
        </article>

        <article className="dashboard-panel progress-panel">
          <div className="progress-panel__heading">
            <div>
              <p>{levelProgress.isMaxLevel ? "Estado de nivel" : "Rumbo a tu siguiente nivel"}</p>
              <h2>
                {levelProgress.isMaxLevel
                  ? "Nivel m\u00e1ximo alcanzado"
                  : `Club Cinepolis ${levelProgress.nextLevel}`}
              </h2>
            </div>
            <span className="gold-icon" aria-hidden="true">☆</span>
          </div>

          <div className="progress-track">
            <span style={{ width: `${levelProgress.percentage}%` }} />
          </div>

          <p className="progress-copy">
            {levelProgress.isMaxLevel
              ? `${levelProgress.currentVisits.toLocaleString()} visitas acumuladas`
              : `${levelProgress.currentVisits.toLocaleString()} de ${Number(levelProgress.requiredVisits || 0).toLocaleString()} visitas para alcanzar ${levelProgress.nextLevel}`}
          </p>
        </article>
      </section>

      <section className="level-alerts" style={levelStyle} aria-label="Avisos de nivel">
        <div className="level-alerts__summary">
          <span>Avance de nivel</span>
          <h2>{levelNotificationText.title}</h2>
          <p>{levelNotificationText.message}</p>
          {levelNotifications.some(n => !n.isRead) && (
            <button 
              className="mark-all-read-btn" 
              type="button" 
              onClick={handleMarkAllAsRead}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "var(--level-color, #f4c430)",
                color: "#020a18",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="level-alerts__list">
          {levelNotifications.length > 0 ? (
            levelNotifications.map((notification) => (
              <article
                className={`level-alert ${notification.isRead ? "" : "level-alert--unread"}`}
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                style={{ cursor: notification.isRead ? "default" : "pointer" }}
                title={notification.isRead ? "" : "Haz clic para marcar como leída"}
              >
                <div>
                  <span>{notification.type === "LEVEL_UPGRADE" ? "Nuevo nivel" : "Progreso"}</span>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
                <time dateTime={notification.createdAt}>{formatNotificationDate(notification.createdAt)}</time>
              </article>
            ))
          ) : (
            <article className="level-alert level-alert--empty">
              <div>
                <span>Sin avisos pendientes</span>
                <strong>Tu progreso se actualiza con cada visita</strong>
                <p>Cuando estes cerca de subir de nivel, veras el aviso aqui.</p>
              </div>
            </article>
          )}
        </div>
      </section>

      <BenefitsSection levelLabel={level.label} levelStyle={levelStyle} benefits={benefits} />
    </main>
  );
}

export default Dashboard;
