import { getDashboardData } from "./dashboardService";

export function loginWithCard(cardNumber) {
  return getDashboardData(cardNumber);
}
