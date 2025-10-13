// utils/api.js
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"; // adjust to your backend port/IP

export async function fetchCurrentWeekPredictions() {
  try {
    // temporarily hard-coded week for testing
    const response = await fetch(`${API_BASE_URL}/predictions/week/2025/7`);
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return [];
  }
}
