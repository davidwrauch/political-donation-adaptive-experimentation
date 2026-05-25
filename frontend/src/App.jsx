import React, { useEffect, useState } from "react";
import OverviewTab from "./components/OverviewTab";
import ExperimentDesignTab from "./components/ExperimentDesignTab";
import AiTab from "./components/AiTab";
import AboutTab from "./components/AboutTab";
import WhatIfTab from "./components/WhatIfTab";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const tabs = ["Overview", "Experiment Design", "What If", "AI Message Review", "About"];
const overviewUrl = `${API_BASE}/api/overview`;
const aiRecommendationUrl = `${API_BASE}/api/ai/recommendation`;

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [error, setError] = useState("");
  const [showBriefing, setShowBriefing] = useState(true);

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
          <strong className="hero-primary-metric">
            Net donation value per contact
            <span className="hero-help-wrap">
              <button aria-label="Primary metric help" className="help-icon" type="button">?</button>
              <span className="tooltip-popover hero-tooltip" role="tooltip">
                Average expected dollars raised per person contacted after accounting for donation conversion rate,
                average donation amount, and fatigue risk. This is the primary optimization metric used to compare
                allocation strategies.
              </span>
            </span>
          </strong>
          <small>Secondary metrics: donation conversion rate, average donation amount, fatigue risk, and exploration rate.</small>
        </div>
      </header>

      <section className={overview ? "load-banner ready" : "load-banner"}>
        <strong>{overview ? "Live data ready" : "Loading simulated campaign results, usually 10-15 seconds"}</strong>
        <span>
          This dashboard compares donation allocation strategies, tracks whether adaptive methods beat Control,
          and keeps confidence/readiness visible for leadership.
        </span>
        <button className="briefing-button" onClick={() => setShowBriefing(true)} type="button">Project briefing</button>
      </section>

      {showBriefing && (
        <section className="briefing-overlay" onClick={() => setShowBriefing(false)} role="dialog" aria-modal="true" aria-labelledby="briefing-title">
          <div className="briefing-panel" onClick={(event) => event.stopPropagation()}>
            <div className="briefing-head">
              <p className="eyebrow">Executive briefing</p>
              <h2 id="briefing-title">Adaptive campaign donation simulation</h2>
              <p>
                This live demo explores how adaptive experimentation could reshape political fundraising. Most modern campaigns already segment outreach, but contextual bandits go further by continuously learning which messages resonate with which voters and dynamically reallocating traffic while the campaign is still running. Instead of relying only on polling, fixed scripts, and preplanned messaging calendars, adaptive systems can learn from real voter behavior and adjust outreach as conditions change.
              </p>
              <p>
                Companies like Google, Spotify, Netflix, Amazon, and Meta use systems like these because they reduce wasted exposure to underperforming experiences and improve personalization at scale. Yahoo Research reported a <strong>12.5% lift</strong> from contextual-bandit personalization, Spotify reported <strong>25%+ improvement</strong> from better personalized recommendations, and Optimizely documented gains including <strong>13.62% higher engagement</strong>. This prototype simulates a campaign feedback loop where vendor response data streams into a warehouse and the system continuously updates targeting, messaging, and channel allocation in real time.
              </p>
            </div>
            <div className="briefing-actions">
              <button className={overview ? "ready-action" : ""} onClick={() => setShowBriefing(false)} type="button">
                {overview ? "Live data ready" : "Skip intro"}
              </button>
            </div>
          </div>
        </section>
      )}

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
      {activeTab === "What If" && <WhatIfTab apiBase={API_BASE} />}
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
