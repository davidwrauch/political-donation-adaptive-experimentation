import React, { useEffect, useState } from "react";
import OverviewTab from "./components/OverviewTab";
import ExperimentDesignTab from "./components/ExperimentDesignTab";
import AiTab from "./components/AiTab";
import AboutTab from "./components/AboutTab";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const tabs = ["Overview", "Experiment Design", "AI Message Review", "About"];
const overviewUrl = `${API_BASE}/api/overview`;
const aiRecommendationUrl = `${API_BASE}/api/ai/recommendation`;

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson(overviewUrl, "overview metrics").then(setOverview).catch((err) => setError(err.message));
    fetchJson(aiRecommendationUrl, "AI recommendation")
      .then(setAiRecommendation)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Campaign analytics control room</p>
          <h1>Political Donation Adaptive Experimentation</h1>
          <p>
            A lightweight prototype for testing donation messages across audience segments, channels,
            and issue frames while monitoring net donation value, conversion, average donation amount, and donor fatigue.
            This live demo compresses a longer campaign experiment into a short simulation so viewers can watch
            allocation, confidence, and performance update over time.
          </p>
        </div>
        <div className="hero-card">
          <span>Primary metric</span>
          <strong>Net donation value per contact</strong>
          <small>Secondary metrics: donation conversion rate, average donation amount, fatigue risk, exploration rate, and p-value check.</small>
        </div>
      </header>

      <section className={overview ? "load-banner ready" : "load-banner"}>
        <strong>{overview ? "Data ready" : "Loading simulated campaign results, usually 10-15 seconds"}</strong>
        <span>
          This dashboard compares donation allocation strategies, tracks whether adaptive methods beat Control,
          and keeps confidence/readiness visible for leadership.
        </span>
      </section>

      <nav className="tabs" aria-label="Dashboard tabs">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab ? "active" : ""}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>

      {error && <div className="alert">{error}</div>}
      {activeTab === "Overview" && <OverviewTab overview={overview} />}
      {activeTab === "Experiment Design" && <ExperimentDesignTab />}
      {activeTab === "AI Message Review" && <AiTab recommendation={aiRecommendation} overview={overview} />}
      {activeTab === "About" && <AboutTab />}
    </main>
  );
}

async function fetchJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${label} from ${url} (${response.status}).`);
  }
  return response.json();
}
