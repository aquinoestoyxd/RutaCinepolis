export function getLevelProgress(level, visits, apiProgress) {
  const currentVisits = Number(visits) || 0;

  if (apiProgress) {
    return {
      currentVisits: Number(apiProgress.currentVisits ?? currentVisits),
      requiredVisits: apiProgress.requiredVisits,
      percentage: Number(apiProgress.percentage ?? 100),
      nextLevel: apiProgress.nextLevelDisplayName || apiProgress.nextLevel,
      visitsToNextLevel: apiProgress.visitsToNextLevel,
      isMaxLevel: Boolean(apiProgress.isMaxLevel),
      isNearUpgrade: Boolean(apiProgress.isNearUpgrade),
    };
  }

  return {
    currentVisits,
    requiredVisits: null,
    percentage: 100,
    nextLevel: null,
    visitsToNextLevel: null,
    isMaxLevel: true,
    isNearUpgrade: false,
  };
}

export function getLevelNotificationText(progress) {
  if (!progress || progress.isMaxLevel) {
    return {
      title: "Nivel maximo alcanzado",
      message: `${Number(progress?.currentVisits || 0).toLocaleString()} visitas acumuladas`,
    };
  }

  if (progress.isNearUpgrade && progress.visitsToNextLevel === 1) {
    return {
      title: `Estas a 1 visita de ${progress.nextLevel}`,
      message: "Tu proximo beneficio esta muy cerca.",
    };
  }

  return {
    title: `Rumbo a ${progress.nextLevel}`,
    message: `${Number(progress.visitsToNextLevel || 0).toLocaleString()} visitas restantes para subir de nivel.`,
  };
}
