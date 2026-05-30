export const mockBenefits = [
  {
    id: "standard-preventas",
    level: "standard",
    title: "Acceso a preventas seleccionadas.",
    active: true,
  },
  {
    id: "standard-puntos",
    level: "standard",
    title: "Acumula puntos por cada compra.",
    active: true,
  },
  {
    id: "premium-dulceria",
    level: "premium",
    title: "Descuentos exclusivos en dulceria.",
    active: true,
  },
  {
    id: "premium-estrenos",
    level: "premium",
    title: "Beneficios especiales en estrenos.",
    active: true,
  },
  {
    id: "golden-puntos-dobles",
    level: "golden",
    title: "Puntos dobles en dias seleccionados.",
    active: true,
  },
  {
    id: "golden-preferente",
    level: "golden",
    title: "Acceso preferente a beneficios premium.",
    active: true,
  },
];

export function getActiveBenefitsByLevel(level) {
  return mockBenefits.filter((benefit) => benefit.level === level && benefit.active);
}
