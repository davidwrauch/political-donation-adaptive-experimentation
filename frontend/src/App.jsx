import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
          <p className="eyebrow">Turnout intervention control room</p>
          <h1>Adaptive Ballot Chase</h1>
          <p>
            Prioritize voters who requested mail ballots but may need the right reminder to return them.
            This live demo compresses a longer ballot chase program into a short simulation so viewers can watch
            allocation, confidence, and returned-ballot impact update over time.
          </p>
        </div>
        <div className="hero-card">
          <span>Hero metric</span>
          <strong className="hero-primary-metric">
            Estimated additional returned ballots
            <HeroMetricTooltip />
          </strong>
          <small>Secondary metrics: ballot return rate, average uplift, contact fatigue risk, and traffic allocation.</small>
          <div className={overview ? "hero-live-status ready" : "hero-live-status"}>
            <strong>{overview ? "Live data ready" : "Loading simulated campaign results, usually 10-15 seconds"}</strong>
            <span>
              This dashboard compares ballot chase allocation strategies, tracks whether adaptive methods beat Control,
              and keeps confidence/readiness visible for leadership.
            </span>
            <button className="briefing-button" onClick={() => setShowBriefing(true)} type="button">Project briefing</button>
          </div>
          </div>
      </header>

      {showBriefing && (
        <section className="briefing-overlay" onClick={() => setShowBriefing(false)} role="dialog" aria-modal="true" aria-labelledby="briefing-title">
          <div className="briefing-panel" onClick={(event) => event.stopPropagation()}>
            <div className="briefing-head">
              <p className="eyebrow">Executive briefing</p>
              <h2 id="briefing-title">Adaptive ballot chase simulation</h2>
              <p>
                This live demo explores how adaptive experimentation could reshape ballot chase programs. A voter has already requested a mail ballot, but the campaign still needs to help ensure it is returned. Contextual bandits continuously learn which voters are movable, which intervention is most useful, and when contact fatigue makes suppression the better choice.
              </p>
              <p>
                The goal is not to chase every outstanding ballot equally. The goal is to identify where contact is most likely to change behavior while preserving capacity, monitoring fatigue, and keeping human review in the loop.
              </p>
	      <p>
		Adaptive ballot chase applies contextual bandit experimentation to voter
outreach, continuously reallocating contact effort toward strategies that
generate more returned ballots while preserving exploration and operational
guardrails. Similar adaptive approaches have produced measurable gains in
deployed systems, including a 12.5% click lift in Yahoo's LinUCB contextual
bandit work, more than 25% improvement in expected stream rate at Spotify
through improved reward optimization, and 13.62% higher engagement with a
20.79% improvement in validation outcomes in Optimizely experiments.
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

function HeroMetricTooltip() {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!open) return undefined;
    function position() {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const margin = 16;
      const width = Math.min(360, window.innerWidth - margin * 2);
      const estimatedHeight = 150;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
      const spaceAbove = rect.top - margin;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const openAbove = spaceAbove >= estimatedHeight || spaceAbove > spaceBelow;
      const top = openAbove ? rect.top - estimatedHeight - 10 : rect.bottom + 10;
      setStyle({
        left,
        maxHeight: `calc(100vh - ${margin * 2}px)`,
        top: Math.min(Math.max(margin, top), window.innerHeight - margin - Math.min(estimatedHeight, window.innerHeight - margin * 2)),
        width,
      });
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  return (
    <span className="hero-help-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        aria-label="Primary metric help"
        className="help-icon"
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        ref={buttonRef}
        type="button"
      >
        ?
      </button>
      {open && createPortal(
        <span className="tooltip-popover hero-tooltip" role="tooltip" style={style}>
          Estimated additional returned ballots generated by adaptive outreach compared to the current chase policy baseline. This estimates the incremental turnout impact from changing intervention allocation.
        </span>,
        document.body
      )}
    </span>
  );
}

async function fetchJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${label} from ${url} (${response.status}).`);
  }
  return response.json();
}
