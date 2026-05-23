import React, { useEffect, useState } from "react";
import { fetchAiRecommendation, fetchOverview } from "./api";
import OverviewTab from "./components/OverviewTab";
import ExperimentDesignTab from "./components/ExperimentDesignTab";
import AiTab from "./components/AiTab";
import AboutTab from "./components/AboutTab";

const tabs = ["Overview", "Experiment Design", "AI", "About"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOverview().then(setOverview).catch((err) => setError(err.message));
    fetchAiRecommendation().then(setAiRecommendation).catch(() => undefined);
  }, []);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Campaign analytics control room</p>
          <h1>Political Donation Adaptive Experimentation</h1>
          <p>
            A lightweight prototype for testing donation messages across audience segments, channels,
            and issue frames while monitoring conversion, expected value, and donor fatigue.
          </p>
        </div>
        <div className="hero-card">
          <span>Primary metric</span>
          <strong>Donation conversion rate</strong>
          <small>Secondary guardrails: expected value, channel response, fatigue risk, segment lift.</small>
        </div>
      </header>

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
      {!overview ? (
        <section className="panel loading">Loading campaign donation experiment results...</section>
      ) : (
        <>
          {activeTab === "Overview" && <OverviewTab overview={overview} />}
          {activeTab === "Experiment Design" && <ExperimentDesignTab />}
          {activeTab === "AI" && <AiTab recommendation={aiRecommendation} overview={overview} />}
          {activeTab === "About" && <AboutTab />}
        </>
      )}
    </main>
  );
}
