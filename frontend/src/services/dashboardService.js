import api from "../api/axios";

export async function getDashboardData(cardNumber) {
  try {
    const response = await api.get(`/members/dashboard/${cardNumber}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

function getLevelByVisits(visits) {
  if (visits >= 24) {
    return "golden";
  }

  if (visits >= 12) {
    return "premium";
  }

  return "standard";
}

function splitFullName(fullName) {
  const [name, ...lastNameParts] = fullName.trim().split(/\s+/);

  return {
    name,
    lastName: lastNameParts.join(" "),
  };
}
