export const levelConfig = {
  standard: {
    label: "Estándar",
    nextLevel: "Premium",
    color: "#4FC3F7",
    darkColor: "#0277BD",
    softColor: "#E1F5FE",
    goalPoints: 1000,
  },
  estandar: {
    label: "Estándar",
    nextLevel: "Premium",
    color: "#4FC3F7",
    darkColor: "#0277BD",
    softColor: "#E1F5FE",
    goalPoints: 1000,
  },
  premium: {
    label: "Premium",
    nextLevel: "Golden",
    color: "#9E9E9E",
    darkColor: "#616161",
    softColor: "#F5F5F5",
    goalPoints: 5000,
  },
  golden: {
    label: "Golden",
    nextLevel: "VIP",
    color: "#FFD700",
    darkColor: "#B8860B",
    softColor: "#FFF8D6",
    goalPoints: 10000,
  },
};

export function getLevelConfig(level) {
  const key = level?.toLowerCase() || "standard";
  return levelConfig[key] ?? levelConfig.standard;
}
