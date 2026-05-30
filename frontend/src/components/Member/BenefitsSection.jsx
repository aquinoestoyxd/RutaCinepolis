import { useState } from "react";
import PromotionCard from "./PromotionCard";
import PromotionModal from "./PromotionModal";

function BenefitsSection({ levelLabel, levelStyle, promotions }) {
  const safePromotions = Array.isArray(promotions) ? promotions : [];
  const [selectedIndex, setSelectedIndex] = useState(null);
  const selectedPromotion = selectedIndex === null ? null : safePromotions[selectedIndex];

  const showPrevious = () => {
    setSelectedIndex((currentIndex) => (
      currentIndex === 0 ? safePromotions.length - 1 : currentIndex - 1
    ));
  };

  const showNext = () => {
    setSelectedIndex((currentIndex) => (
      currentIndex === safePromotions.length - 1 ? 0 : currentIndex + 1
    ));
  };

  return (
    <section className="benefits-section" id="beneficios" style={levelStyle}>
      <div className="benefits-section__heading">
        <div>
          <span>Club Cinepolis {levelLabel}</span>
          <h2>Beneficios Vigentes</h2>
        </div>
        <p>{safePromotions.length} promociones activas para tu nivel</p>
      </div>

      <div className="promotions-row" aria-label={`Promociones vigentes para nivel ${levelLabel}`}>
        {safePromotions.map((promotion, index) => (
          <PromotionCard
            key={promotion.id}
            promotion={promotion}
            onSelect={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      <PromotionModal
        promotion={selectedPromotion}
        currentIndex={selectedIndex ?? 0}
        total={safePromotions.length}
        onClose={() => setSelectedIndex(null)}
        onPrevious={showPrevious}
        onNext={showNext}
      />
    </section>
  );
}

export default BenefitsSection;
