import React, { useEffect, useRef, useState } from "react";

const defaultWeights = {
  donation_value_weight: 1.0,
  conversion_weight: 0.7,
  volunteer_conversion_weight: 0.2,
  high_dollar_donor_weight: 0.35,
  persuasion_trust_proxy_weight: 0.25,
  fatigue_penalty: 0.55,
  unsubscribe_penalty: 0.45,
  negative_urgency_message_penalty: 0.35,
  local_community_message_boost: 0.2,
  exploration_diversity_weight: 0.25,
  fairness_audience_diversity_weight: 0.2,
};

const scenarios = {
  "Current policy": {
    weights: defaultWeights,
    explanation: "Balances governor, local, and federal race priorities using the campaign's current allocation logic.",
    summary: "Balanced chase logic keeps statewide, local, and federal priorities in tension instead of optimizing one race lane in isolation.",
  },
  "Prioritize governor's race": {
    weights: {
      ...defaultWeights,
      donation_value_weight: 1.35,
      conversion_weight: 1.15,
      high_dollar_donor_weight: 1.45,
      fatigue_penalty: 0.75,
      unsubscribe_penalty: 0.7,
      local_community_message_boost: 0.1,
      fairness_audience_diversity_weight: 0.14,
    },
    explanation: "Shifts more contact priority toward voters most likely to affect the governor's race. This may improve governor-race ballot returns, but can reduce local or federal efficiency.",
    summary: "The governor-focused policy concentrates effort around likely supportive voters and broader turnout volume, trading away some local coverage.",
  },
  "Prioritize local elections": {
    weights: {
      ...defaultWeights,
      donation_value_weight: 0.82,
      conversion_weight: 0.82,
      volunteer_conversion_weight: 0.65,
      persuasion_trust_proxy_weight: 1.15,
      local_community_message_boost: 1.5,
      fatigue_penalty: 0.85,
      unsubscribe_penalty: 0.85,
      exploration_diversity_weight: 0.42,
      fairness_audience_diversity_weight: 0.9,
    },
    explanation: "Shifts more contact priority toward voters relevant to local contests. This may improve local-race opportunity, but can reduce statewide or federal optimization.",
    summary: "The local-election policy broadens county and local-contest coverage, accepting lower statewide efficiency when local opportunity matters more.",
  },
  "Prioritize federal races": {
    weights: {
      ...defaultWeights,
      donation_value_weight: 1.1,
      conversion_weight: 1.35,
      high_dollar_donor_weight: 1.15,
      persuasion_trust_proxy_weight: 0.55,
      local_community_message_boost: 0.28,
      fatigue_penalty: 0.65,
      unsubscribe_penalty: 0.65,
      exploration_diversity_weight: 0.18,
      fairness_audience_diversity_weight: 0.16,
    },
    explanation: "Shifts more contact priority toward voters most relevant to federal contests. This may improve federal-race ballot returns, but can reduce local coverage or balanced turnout goals.",
    summary: "The federal-race policy leans into larger-audience turnout generation, which can outperform on federal opportunity while narrowing local coverage.",
  },
};

const audienceOptions = [
  ["50000", "50k"],
  ["100000", "100k"],
  ["250000", "250k"],
  ["500000", "500k"],
  ["1000000", "1m"],
];

export default function WhatIfTab({ apiBase }) {
  const [activeScenario, setActiveScenario] = useState("Current policy");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [audienceSize, setAudienceSize] = useState(250000);
  const scenario = scenarios[activeScenario];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetch(`${apiBase}/api/policy-simulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.weights),
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Unable to load policy simulator from ${apiBase}/api/policy-simulator (${response.status}).`);
          return response.json();
        })
        .then(setResult)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 160);
    return () => window.clearTimeout(timeout);
  }, [apiBase, scenario.weights]);

  const adjusted = result?.adjusted_policy;
  const baseline = result?.baseline_policy;
  const deltas = result?.deltas ?? {};
  const projectedReturnedBallots = ((deltas.overall_ballot_return_value ?? 0) / 100) * audienceSize;
  const governorOpportunity = (deltas.governor_race_lift ?? 0) * audienceSize;
  const localOpportunity = (deltas.local_election_lift ?? 0) * audienceSize;
  const federalOpportunity = (deltas.federal_race_lift ?? 0) * audienceSize;
  const fatigueChange = deltas.fatigue_risk ?? 0;

  return (
    <div className="tab-panel what-if-tab">
      <section className="what-if-hero compact">
        <div className="what-if-hero-left">
          <p className="eyebrow">Strategy mixing board</p>
          <h2><LabelWithHelp label="What If?" help="This tab lets campaign leadership test alternative race-priority strategies before changing allocation logic." /></h2>
          <small className="quiet-caveat">
            <LabelWithHelp
              label="Offline estimate, not proof."
              help="This uses the simulated campaign log to estimate what might have happened under different priorities. It is most reliable when the historical experiment explored similar actions often enough to compare them."
            />
          </small>
        </div>
        <div className="what-if-hero-right">
          <p>Explore how changing turnout priorities reshapes ballot returns, contact fatigue, and county-level opportunity.</p>
          <p>Use this as a strategy mixing board: shift the reward settings, compare the result to the current chase policy, and see the tradeoffs before changing how outreach is allocated.</p>
        </div>
        <label className="hero-audience-select">
          Audience size
          <select onChange={(event) => setAudienceSize(Number(event.target.value))} value={String(audienceSize)}>
            {audienceOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="preset-row" aria-label="Policy simulator scenarios">
        {Object.keys(scenarios).map((name) => (
          <button className={activeScenario === name ? "active" : ""} key={name} onClick={() => setActiveScenario(name)} type="button">
            {name}
          </button>
        ))}
      </section>

      <section className="scenario-note">
        <strong>{activeScenario}</strong>
        <span>{scenario.explanation}</span>
      </section>

      <section className="scenario-card-grid">
        <article className="scenario-card selected-scenario-card">
          <span>Selected scenario</span>
          <h3>{activeScenario}</h3>
          <p>{scenario.summary}</p>
          <div className="scenario-metric-grid">
            <ScenarioMetric label="Overall ballot-return value" value={formatBallotImpact(adjusted?.overall_ballot_return_value)} />
            <ScenarioMetric label="Governor-race lift" value={formatPercent(adjusted?.governor_race_lift)} />
            <ScenarioMetric label="Local-election lift" value={formatPercent(adjusted?.local_election_lift)} />
            <ScenarioMetric label="Federal-race lift" value={formatPercent(adjusted?.federal_race_lift)} />
            <ScenarioMetric label="Contact fatigue" value={formatPercent(adjusted?.fatigue_risk)} />
            <ScenarioMetric label="Coverage balance" value={formatPercent(adjusted?.coverage_balance)} />
          </div>
        </article>

        <article className="scenario-card projected-scenario-card">
          <span>Projected impact</span>
          <strong className={impactClass(projectedReturnedBallots)}>{formatSignedWholeNumber(projectedReturnedBallots)}</strong>
          <small>projected additional returned ballots over {audienceSize.toLocaleString()} voters</small>
          <div className="impact-breakdown">
            <ScenarioDelta label="Governor-race opportunity" value={governorOpportunity} />
            <ScenarioDelta label="Local-race opportunity" value={localOpportunity} />
            <ScenarioDelta label="Federal-race opportunity" value={federalOpportunity} />
            <ScenarioDelta label="Fatigue change" value={fatigueChange} percent />
          </div>
        </article>

        <article className="scenario-card tradeoff-card">
          <span>Tradeoff summary</span>
          <h3>{tradeoffHeadline(activeScenario)}</h3>
          <p>{tradeoffCopy(activeScenario)}</p>
          <div className="tradeoff-scale">
            <ScenarioMetric label="Current balanced value" value={formatBallotImpact(baseline?.overall_ballot_return_value)} />
            <ScenarioMetric label="Scenario value" value={formatBallotImpact(adjusted?.overall_ballot_return_value)} />
            <ScenarioMetric label="Fatigue delta" value={formatDeltaPercent(fatigueChange, true)} />
          </div>
        </article>
      </section>

      <section className="what-if-bottom compact">
        <article className="meaning-panel">
          <h3>What this means</h3>
          <p>
            Race-priority choices are not free improvements. Optimizing governor, local, or federal contests changes
            which voters the adaptive system favors, how much fatigue it tolerates, and whether coverage remains balanced.
          </p>
        </article>
        <article className="meaning-panel quiet-method">
          <h3>Why this works</h3>
          <p>
            Because the simulated campaign logs the action shown, the outcome, and the probability of assignment, we
            can estimate how a different policy might have performed. This is offline policy simulation, not causal proof.
          </p>
          {loading && <small>Updating estimate...</small>}
        </article>
      </section>

      <section className="methodology-note">
        <div>
          <h3>Research grounding</h3>
          <p>
            This prototype is grounded in contextual bandits, adaptive experimentation, OPE-style offline policy
            simulation, and human oversight with guardrails. The research white paper explains why this approach is
            useful, what assumptions it requires, and why it should be read as decision support rather than causal proof.
          </p>
        </div>
        <div className="methodology-actions">
          <a href="https://docs.google.com/document/d/1FY-S6agsHNKv1Y4vivfYlge8rKT1Ii9I/edit?usp=sharing&ouid=106737948019924007884&rtpof=true&sd=true" target="_blank" rel="noreferrer">
            Open research white paper
          </a>
        </div>
      </section>
    </div>
  );
}

function ScenarioMetric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScenarioDelta({ label, value, percent = false }) {
  return (
    <div>
      <span>{label}</span>
      <strong className={impactClass(value)}>{percent ? formatDeltaPercent(value, true) : formatSignedWholeNumber(value)}</strong>
    </div>
  );
}

function LabelWithHelp({ label, help }) {
  return (
    <span className="what-if-label-help">
      {label}
      <HelpTooltip text={help} />
    </span>
  );
}

function HelpTooltip({ text }) {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!open) return undefined;
    function position() {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const margin = 12;
      const width = Math.min(280, window.innerWidth - margin * 2);
      const estimatedHeight = 96;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
      const openAbove = rect.bottom + estimatedHeight + margin > window.innerHeight;
      const top = openAbove ? rect.top - estimatedHeight - 8 : rect.bottom + 8;
      setStyle({ left, maxHeight: `calc(100vh - ${margin * 2}px)`, top: Math.max(margin, top), width });
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
    <span className="what-if-help-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        aria-label="Help"
        className="help-icon"
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        ref={buttonRef}
        type="button"
      >
        ?
      </button>
      {open && <span className="tooltip-popover" role="tooltip" style={style}>{text}</span>}
    </span>
  );
}

function tradeoffHeadline(scenario) {
  if (scenario === "Prioritize governor's race") return "Statewide lift, narrower balance";
  if (scenario === "Prioritize local elections") return "Local opportunity, lower broad efficiency";
  if (scenario === "Prioritize federal races") return "Federal scale, less local coverage";
  return "Balanced across race priorities";
}

function tradeoffCopy(scenario) {
  if (scenario === "Prioritize governor's race") {
    return "The model shifts contact priority toward likely supporters and statewide turnout volume, which can reduce local-race balance.";
  }
  if (scenario === "Prioritize local elections") {
    return "The model gives more credit to county-level opportunity and under-contacted voters, which can reduce statewide or federal optimization.";
  }
  if (scenario === "Prioritize federal races") {
    return "The model favors broad turnout generation for larger federal audiences, which can leave some local opportunity under-covered.";
  }
  return "The current policy preserves coverage across governor, local, and federal priorities while avoiding excessive contact fatigue.";
}

function formatBallotImpact(value) {
  if (typeof value !== "number") return "Loading";
  return `${value.toFixed(1)} per 100 contacts`;
}

function formatSignedWholeNumber(value) {
  if (typeof value !== "number") return "Calculating";
  const rounded = Math.round(value);
  const absolute = Math.abs(rounded).toLocaleString();
  if (rounded < 0) return `-${absolute}`;
  if (rounded > 0) return `+${absolute}`;
  return "0";
}

function formatPercent(value) {
  if (typeof value !== "number") return "Loading";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDeltaPercent(value, lowerIsBetter = false) {
  if (typeof value !== "number") return "Calculating";
  if (Math.abs(value) < 0.0001) return "0.0 pts";
  const sign = value >= 0 ? "+" : "";
  const direction = lowerIsBetter ? (value <= 0 ? " better" : " higher") : "";
  return `${sign}${(value * 100).toFixed(1)} pts${direction}`;
}

function impactClass(value) {
  if (typeof value !== "number" || Math.abs(value) < 0.5) return "impact-neutral";
  return value > 0 ? "impact-positive" : "impact-negative";
}
