const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");

export async function fetchOverview() {
  const response = await fetch(`${API_BASE}/api/overview`);
  if (!response.ok) throw new Error("Unable to load overview metrics.");
  return response.json();
}

export async function fetchAiRecommendation() {
  const response = await fetch(`${API_BASE}/api/ai/recommendation`);
  if (!response.ok) throw new Error("Unable to load AI recommendation.");
  return response.json();
}
