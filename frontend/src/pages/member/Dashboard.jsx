import "./Dashboard.css";
import "../../styles/global.css";
import { useNavigate } from "react-router-dom";
import BenefitsSection from "../../components/Member/BenefitsSection";
import CinepolisMark from "../../components/Member/CinepolisMark";
import Navbar from "../../components/Member/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getLevelConfig } from "../../utils/member/levelConfig";
import { getLevelProgress } from "../../utils/member/levelProgress";

function formatCardNumber(cardNumber) {
  return String(cardNumber || "").replace(/(.{4})/g, "$1 ").trim();
}

function Dashboard() {
  const { dashboardData, logout, refetchError } = useAuth();
  const navigate = useNavigate();

  if (!dashboardData) {
    return <div className="flex items-center justify-center h-screen bg-[#020a18] text-white">Cargando dashboard...</div>;
  }

  const user = dashboardData.user || {};
  const benefits = Array.isArray(dashboardData.benefits) ? dashboardData.benefits : [];
  const levelKey = user?.level?.toLowerCase() || "standard";
  const level = getLevelConfig(levelKey);
  const levelProgress = getLevelProgress(levelKey, user?.visits, user?.progress);
  const fullName = `${user?.name || ""} ${user?.lastName || ""}`.trim().toUpperCase();

  const cssLevelClass = levelKey === "estandar" ? "standard" : levelKey;

  const levelStyle = {
    "--level-color": level.color,
    "--level-dark": level.darkColor,
    "--level-soft": level.softColor,
  };

  const handleLogout = () => {
    logout();
    navigate("/member/login");
  };

  return (
    <main className="dashboard-page">
      <Navbar user={user} onLogout={handleLogout} />

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

      <BenefitsSection levelLabel={level.label} levelStyle={levelStyle} benefits={benefits} />
    </main>
  );
}

export default Dashboard;
