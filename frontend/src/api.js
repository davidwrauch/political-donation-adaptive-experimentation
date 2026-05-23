const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");

export async function fetchOverview() {
  const url = `${API_BASE}/api/overview`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load overview metrics from ${url} (${response.status}).`);
  return response.json();
}

export async function fetchAiRecommendation() {
  const url = `${API_BASE}/api/ai/recommendation`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load AI recommendation from ${url} (${response.status}).`);
  return response.json();
}
