import * as api from "../api";

export async function getPromotions() {
  try {
    const data = await api.getPromotions();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
}

export async function getPromotionById(id) {
  try {
    return await api.getPromotionById(id);
  } catch (error) {
    console.error("Error fetching promotion detail:", error);
    throw error;
  }
}

export async function createPromotion(data) {
  try {
    return await api.createPromotion(data);
  } catch (error) {
    console.error("Error creating promotion:", error);
    throw error;
  }
}

export async function updatePromotion(id, data) {
  try {
    return await api.updatePromotion(id, data);
  } catch (error) {
    console.error("Error updating promotion:", error);
    throw error;
  }
}

export async function deletePromotion(id) {
  try {
    await api.deletePromotion(id);
  } catch (error) {
    console.error("Error deleting promotion:", error);
    throw error;
  }
}
