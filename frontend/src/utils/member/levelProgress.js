const levelVisitGoals = {
  standard: {
    nextLevel: "Premium",
    requiredVisits: 12,
  },
  estandar: {
    nextLevel: "Premium",
    requiredVisits: 12,
  },
  premium: {
    nextLevel: "Golden",
    requiredVisits: 24,
  },
};

export function getLevelProgress(level, visits) {
  const currentVisits = Number(visits) || 0;
  const key = level?.toLowerCase() || "standard";
  const goal = levelVisitGoals[key];

  if (!goal) {
    return {
      currentVisits,
      requiredVisits: currentVisits,
      percentage: 100,
      nextLevel: null,
      isMaxLevel: true,
    };
  }

  return {
    currentVisits,
    requiredVisits: goal.requiredVisits,
    percentage: Math.min(Math.round((currentVisits / goal.requiredVisits) * 100), 100),
    nextLevel: goal.nextLevel,
    isMaxLevel: false,
  };
}
