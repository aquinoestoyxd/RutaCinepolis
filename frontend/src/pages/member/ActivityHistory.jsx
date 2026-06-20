import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Member/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getMemberHistory, getMemberNotifications } from "../../api/index.js";
import "../member/Dashboard.css";
import "../../styles/global.css";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

const PURCHASE_TYPES = new Set(["PURCHASE_TICKET", "PURCHASE_CANDY"]);

function ActivityHistory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("points");
  const [data, setData] = useState(null);
  const [levelChanges, setLevelChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.cardNumber) {
      setError("No se pudo identificar al miembro.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getMemberHistory(user.cardNumber, { page: 1, limit: 50 })
      .then(setData)
      .catch(() => setError("No se pudo cargar el historial."))
      .finally(() => setLoading(false));
  }, [user?.cardNumber]);

  useEffect(() => {
    if (tab !== "level") return;
    if (levelChanges.length > 0) return;
    setLoadingLevels(true);
    getMemberNotifications({ page: 1, limit: 50 })
      .then((result) => {
        const all = Array.isArray(result.data) ? result.data : [];
        setLevelChanges(all.filter((n) => n.type === "LEVEL_UPGRADE"));
      })
      .catch(() => setLevelChanges([]))
      .finally(() => setLoadingLevels(false));
  }, [tab, levelChanges.length]);

  const handleLogout = () => { logout(); navigate("/member/login"); };

  const transactions = data?.points?.transactions || [];
  const redemptions = data?.redemptions?.redemptions || [];
  const purchases = transactions.filter((tx) => PURCHASE_TYPES.has(tx.type));

  const countLabel = (arr, total) => arr.length > 0 ? arr.length : (total ?? 0);

  return (
    <main className="member-subpage">
      <Navbar user={user || {}} onLogout={handleLogout} />
      <div className="member-subpage__header">
        <span>Cinepolis</span>
        <h2>Historial de Actividad</h2>
      </div>
      <div className="member-subpage__content">
        <div className="activity-tabs">
          <button type="button" className={`activity-tab ${tab === "points" ? "activity-tab--active" : ""}`} onClick={() => setTab("points")}>Puntos ({data?.points?.total ?? 0})</button>
          <button type="button" className={`activity-tab ${tab === "redemptions" ? "activity-tab--active" : ""}`} onClick={() => setTab("redemptions")}>Canjes ({data?.redemptions?.total ?? 0})</button>
          <button type="button" className={`activity-tab ${tab === "purchases" ? "activity-tab--active" : ""}`} onClick={() => setTab("purchases")}>Compras ({countLabel(purchases, 0)})</button>
          <button type="button" className={`activity-tab ${tab === "level" ? "activity-tab--active" : ""}`} onClick={() => setTab("level")}>Nivel ({levelChanges.length})</button>
        </div>

        {loading && <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>Cargando historial...</p>}
        {error && <p style={{ textAlign: "center", padding: "40px 0", color: "#c53030" }}>{error}</p>}

        {!loading && !error && tab === "points" && (
          transactions.length === 0 ? (
            <div className="activity-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p>No hay movimientos de puntos registrados.</p>
            </div>
          ) : (
            <div className="activity-list">
              {transactions.map((tx) => (
                <div className="activity-item" key={tx.id}>
                  <div className="activity-item__icon activity-item__icon--points">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div className="activity-item__body">
                    <div className="activity-item__title">{tx.description || `Transaccion #${tx.id.slice(0, 8)}`}</div>
                    <p className="activity-item__desc">{tx.type} &middot; {tx.origin}</p>
                  </div>
                  <div className="activity-item__meta">
                    {tx.pointsEarned > 0 && <div className="activity-item__amount activity-item__amount--positive">+{tx.pointsEarned}</div>}
                    {tx.pointsUsed > 0 && <div className="activity-item__amount activity-item__amount--negative">-{tx.pointsUsed}</div>}
                    <div className="activity-item__date">{formatDate(tx.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && !error && tab === "redemptions" && (
          redemptions.length === 0 ? (
            <div className="activity-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <p>No hay canjes registrados.</p>
            </div>
          ) : (
            <div className="activity-list">
              {redemptions.map((r) => (
                <div className="activity-item" key={r.id}>
                  <div className="activity-item__icon activity-item__icon--redemption">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  </div>
                  <div className="activity-item__body">
                    <div className="activity-item__title">{r.benefit?.name || "Beneficio canjeado"}</div>
                    <p className="activity-item__desc">{r.notes || `Canje #${r.id.slice(0, 8)}`}</p>
                  </div>
                  <div className="activity-item__meta">
                    <div className="activity-item__amount activity-item__amount--negative">-{r.pointsUsed}</div>
                    <div className="activity-item__date">{formatDate(r.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && !error && tab === "purchases" && (
          purchases.length === 0 ? (
            <div className="activity-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <p>No hay compras registradas.</p>
            </div>
          ) : (
            <div className="activity-list">
              {purchases.map((tx) => (
                <div className="activity-item" key={tx.id}>
                  <div className="activity-item__icon activity-item__icon--points">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  </div>
                  <div className="activity-item__body">
                    <div className="activity-item__title">{tx.description || `Compra #${tx.id.slice(0, 8)}`}</div>
                    <p className="activity-item__desc">{tx.type === "PURCHASE_TICKET" ? "Boleto" : "Dulceria"} &middot; {tx.origin}</p>
                  </div>
                  <div className="activity-item__meta">
                    {tx.amount > 0 && <div className="activity-item__amount activity-item__amount--positive">S/ {Number(tx.amount).toFixed(2)}</div>}
                    <div className="activity-item__date">{formatDate(tx.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && !error && tab === "level" && (
          loadingLevels ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>Cargando cambios de nivel...</p>
          ) : levelChanges.length === 0 ? (
            <div className="activity-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <p>No hay cambios de nivel registrados.</p>
            </div>
          ) : (
            <div className="activity-list">
              {levelChanges.map((n) => (
                <div className="activity-item" key={n.id}>
                  <div className="activity-item__icon activity-item__icon--points" style={{ background: "#fef3c7", color: "#d97706" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  </div>
                  <div className="activity-item__body">
                    <div className="activity-item__title">{n.title}</div>
                    <p className="activity-item__desc">{n.message}</p>
                  </div>
                  <div className="activity-item__meta">
                    <div className="activity-item__date">{formatDate(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default ActivityHistory;
