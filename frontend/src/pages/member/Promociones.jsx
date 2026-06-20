import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PromotionCard from "../../components/Member/PromotionCard";
import PromotionModal from "../../components/Member/PromotionModal";
import Navbar from "../../components/Member/Navbar";
import { useAuth } from "../../context/AuthContext";
import { getPromotions } from "../../services/promotionService";
import "./Promociones.css";

function Promociones() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPromotions();
        setPromotions(Array.isArray(data) ? data : []);
      } catch {
        setError("No se pudieron cargar las promociones.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/member/login");
  };

  const selectedPromotion = selectedIndex === null ? null : promotions[selectedIndex];

  const showPrevious = () => {
    setSelectedIndex((i) => (i === 0 ? promotions.length - 1 : i - 1));
  };

  const showNext = () => {
    setSelectedIndex((i) => (i === promotions.length - 1 ? 0 : i + 1));
  };

  return (
    <main className="promociones-page">
      <Navbar user={user || {}} onLogout={handleLogout} />

      <div className="promociones-header">
        <span>Cinepolis</span>
        <h2>Promociones vigentes</h2>
      </div>

      {loading && <p className="loading-state">Cargando promociones...</p>}

      {error && <p className="error-state">{error}</p>}

      {!loading && !error && promotions.length === 0 && (
        <p className="empty-state">No hay promociones activas en este momento.</p>
      )}

      {!loading && !error && promotions.length > 0 && (
        <div className="promotions-row">
          {promotions.map((p, i) => (
            <PromotionCard key={p.id} promotion={p} onSelect={() => setSelectedIndex(i)} />
          ))}
        </div>
      )}

      <PromotionModal
        promotion={selectedPromotion}
        currentIndex={selectedIndex ?? 0}
        total={promotions.length}
        onClose={() => setSelectedIndex(null)}
        onPrevious={showPrevious}
        onNext={showNext}
      />
    </main>
  );
}

export default Promociones;
