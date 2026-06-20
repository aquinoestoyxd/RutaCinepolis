import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Member/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getMemberNotifications, markNotificationAsReadMember, markAllNotificationsAsReadMember } from "../../api/index.js";
import "../member/Dashboard.css";
import "../../styles/global.css";

const iconMap = {
  LEVEL_UPGRADE: "level_upgrade",
  LEVEL_PROGRESS: "level_progress",
  POINTS_EARNED: "points_earned",
  BENEFIT_AVAILABLE: "benefit_available",
  WELCOME: "welcome",
  PROMOTION: "promotion",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function Notifications() {
  const { user, dashboardData, logout, updateDashboardData } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const result = await getMemberNotifications({ page: 1, limit: 50 });
        if (!cancelled) setNotifications(result.data || []);
      } catch {
        if (!cancelled && dashboardData?.notifications) {
          setNotifications(dashboardData.notifications);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [dashboardData]);

  const handleLogout = () => { logout(); navigate("/member/login"); };

  const handleRead = async (id) => {
    try {
      await markNotificationAsReadMember(id);
      setNotifications((prev) => {
        const next = prev.map((n) => n.id === id ? { ...n, isRead: true } : n);
        updateDashboardData({ unreadNotifications: next.filter((n) => !n.isRead).length });
        return next;
      });
    } catch {}
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsAsReadMember();
      setNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, isRead: true }));
        updateDashboardData({ unreadNotifications: 0 });
        return next;
      });
    } catch {}
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="member-subpage">
      <Navbar user={user || {}} onLogout={handleLogout} />
      <div className="member-subpage__header">
        <span>Cinepolis</span>
        <h2>Notificaciones {unread > 0 && <span className="notification-badge" style={{ verticalAlign: "middle", marginLeft: 10 }}>{unread}</span>}</h2>
      </div>
      <div className="member-subpage__content">
        {notifications.length > 0 && (
          <div className="notifications-header-actions">
            <span style={{ fontSize: "13px", color: "#6b7280" }}>{notifications.length} notificaciones</span>
            {unread > 0 && <button type="button" onClick={handleReadAll}>Marcar todas como leidas</button>}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>Cargando notificaciones...</p>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p>No tienes notificaciones.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((n) => {
              const ic = iconMap[n.type] || "level_progress";
              return (
                <div
                  className={`notification-item ${n.isRead ? "" : "notification-item--unread"}`}
                  key={n.id}
                  onClick={() => !n.isRead && handleRead(n.id)}
                  style={{ cursor: n.isRead ? "default" : "pointer" }}
                >
                  <div className={`notification-item__icon notification-item__icon--${ic}`}>
                    {n.type === "LEVEL_UPGRADE" || n.type === "LEVEL_PROGRESS" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    ) : n.type === "POINTS_EARNED" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    )}
                  </div>
                  <div className="notification-item__body">
                    <div className="notification-item__title">{n.title}</div>
                    <p className="notification-item__message">{n.message}</p>
                  </div>
                  <time className="notification-item__time">{formatDate(n.createdAt)}</time>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default Notifications;
