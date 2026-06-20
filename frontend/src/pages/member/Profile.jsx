import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Member/Navbar";
import { useAuth } from "../../context/AuthContext";
import "../member/Dashboard.css";
import "../../styles/global.css";

function maskCardNumber(cardNumber) {
  const s = String(cardNumber || "");
  if (s.length <= 4) return s;
  const last4 = s.slice(-4);
  const masked = s.slice(0, -4).replace(/\d/g, "*");
  return masked.replace(/(.{4})/g, "$1 ").trim() + " " + last4;
}

const statusColors = {
  active: { bg: "#d1fae5", color: "#065f46" },
  inactive: { bg: "#fef3c7", color: "#92400e" },
  suspended: { bg: "#fee2e2", color: "#991b1b" },
};

function Profile() {
  const { user, dashboardData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/member/login");
  };

  const p = dashboardData?.user || user || {};
  const levelLabel = (p.level || "estandar").toLowerCase();
  const colors = {
    estandar: { bg: "#eff6ff", color: "#2563eb" },
    standard: { bg: "#eff6ff", color: "#2563eb" },
    premium: { bg: "#f5f3ff", color: "#7c3aed" },
    golden: { bg: "#fef3c7", color: "#d97706" },
  };
  const c = colors[levelLabel] || colors.estandar;
  const fullName = `${p.name || ""} ${p.lastName || ""}`.trim();

  return (
    <main className="member-subpage">
      <Navbar user={p} onLogout={handleLogout} />
      <div className="member-subpage__header">
        <span>Cinepolis</span>
        <h2>Mi Perfil</h2>
      </div>
      <div className="member-subpage__content">
        <div className="profile-card">
          <div className="profile-avatar">{(p.name || "U").charAt(0)}</div>
          <div className="profile-info">
            <h1>{fullName || "Miembro"}</h1>
            <span style={{ background: c.bg, color: c.color }} className="profile-level">
              {levelLabel.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="profile-details">
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">Numero de Tarjeta</span>
            <span className="profile-detail-item__value">{maskCardNumber(p.cardNumber) || "-"}</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">DNI</span>
            <span className="profile-detail-item__value">{p.dni || "-"}</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">Correo Electronico</span>
            <span className="profile-detail-item__value">{p.email || "-"}</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">Estado de Membresia</span>
            <span className="profile-detail-item__value">
              <span style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                background: (statusColors[p.status] || statusColors.active).bg,
                color: (statusColors[p.status] || statusColors.active).color,
              }}>
                {p.status || "activo"}
              </span>
            </span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">Miembro Desde</span>
            <span className="profile-detail-item__value">
              {p.since
                ? new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(p.since))
                : "-"}
            </span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">Puntos Acumulados</span>
            <span className="profile-detail-item__value">{Number(p.points || 0).toLocaleString()}</span>
          </div>
          <div className="profile-detail-item">
            <span className="profile-detail-item__label">Visitas Registradas</span>
            <span className="profile-detail-item__value">{Number(p.visits || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
