import React, { useEffect, useMemo, useRef, useState } from "react";

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

const presets = {
  "Current chase policy": defaultWeights,
  "Prioritize high-uplift ballot returns": {
    ...defaultWeights,
    donation_value_weight: 1.75,
    conversion_weight: 0.35,
    volunteer_conversion_weight: 0.05,
    high_dollar_donor_weight: 1.65,
    persuasion_trust_proxy_weight: 0.15,
    fatigue_penalty: 0.55,
    unsubscribe_penalty: 0.55,
    negative_urgency_message_penalty: 0.2,
    local_community_message_boost: 0.05,
    exploration_diversity_weight: 0.08,
    fairness_audience_diversity_weight: 0.08,
  },
  "Prioritize high-support voters": {
    ...defaultWeights,
    donation_value_weight: 0.55,
    conversion_weight: 1.45,
    persuasion_trust_proxy_weight: 0.9,
    local_community_message_boost: 1.0,
    negative_urgency_message_penalty: 1.0,
  },
  "Reduce contact fatigue": {
    ...defaultWeights,
    persuasion_trust_proxy_weight: 1.25,
    local_community_message_boost: 1.1,
    negative_urgency_message_penalty: 1.35,
  },
  "County opportunity": {
    ...defaultWeights,
    donation_value_weight: 0.9,
    conversion_weight: 0.85,
    volunteer_conversion_weight: 0.95,
    persuasion_trust_proxy_weight: 1.1,
    local_community_message_boost: 1.05,
    negative_urgency_message_penalty: 1.0,
    fatigue_penalty: 0.9,
    unsubscribe_penalty: 0.85,
  },
  "Urgent returns": {
    ...defaultWeights,
    donation_value_weight: 0.65,
    conversion_weight: 0.7,
    volunteer_conversion_weight: 1.55,
    persuasion_trust_proxy_weight: 1.45,
    local_community_message_boost: 1.45,
    negative_urgency_message_penalty: 1.35,
    fatigue_penalty: 1.1,
    unsubscribe_penalty: 1.05,
    exploration_diversity_weight: 0.75,
    fairness_audience_diversity_weight: 0.8,
  },
};

const presetExplanations = {
  "Current chase policy": "Uses the same reward settings as the current logged ballot-chase policy: optimize expected additional returned ballots while applying guardrails for fatigue, exploration, and county coverage.",
  "Prioritize high-uplift ballot returns": "Increases weight on voters most likely to return a ballot because of contact. This may raise impact, but can concentrate outreach among a narrower movable audience.",
  "Prioritize high-support voters": "Raises the value of high-support and high-priority voters. This may protect campaign priorities, but can miss lower-propensity voters who are more movable.",
  "Reduce contact fatigue": "Penalizes voters who have already received repeated outreach. This protects voter experience, but may reduce near-term returned-ballot volume.",
  "County opportunity": "Raises weight on county-level opportunity and local election relevance. This can shift resources toward places where more outstanding ballots remain.",
  "Urgent returns": "Prioritizes voters whose ballots have been outstanding longer and may need immediate help returning them.",
};

const controls = [
  ["donation_value_weight", "Ballot return uplift", "Prioritize voters most likely to return a ballot because of contact."],
  ["high_dollar_donor_weight", "Support score", "Prioritize high-support or high-priority voters."],
  ["conversion_weight", "Contactability", "Prioritize voters who can likely be reached through available channels."],
  ["volunteer_conversion_weight", "Urgency", "Prioritize voters whose ballots have been outstanding longer."],
  ["fatigue_guardrail", "Contact fatigue guardrail", "Reduce priority for voters likely to feel over-contacted."],
  ["trust_positive_tone", "Voter confidence/helpfulness", "Favor interventions that answer questions and make ballot return easier."],
];

const audienceOptions = [
  ["50000", "50k"],
  ["100000", "100k"],
  ["250000", "250k"],
  ["500000", "500k"],
  ["1000000", "1m"],
];

export default function WhatIfTab({ apiBase }) {
  const [weights, setWeights] = useState(defaultWeights);
  const [activePreset, setActivePreset] = useState("Current chase policy");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [audienceSize, setAudienceSize] = useState(250000);
  const requestKey = useMemo(() => JSON.stringify(weights), [weights]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetch(`${apiBase}/api/policy-simulator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
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
  }, [apiBase, requestKey, weights]);

  function applyPreset(name) {
    setActivePreset(name);
    setWeights(presets[name]);
  }

  function updateWeight(key, value) {
    setActivePreset("Custom");
    setWeights((current) => applyControlValue(current, key, Number(value)));
  }

  const adjusted = result?.adjusted_policy;
  const baseline = result?.baseline_policy;
  const deltas = result?.deltas;
  const reliabilityNeedsMore = result?.overlap?.warning;
  const projectedImpact = ((deltas?.estimated_net_value_per_contact ?? 0) / 100) * audienceSize;
  const projectedPriorityMoves = (deltas?.donation_conversion_rate ?? 0) * audienceSize;

  return (
    <div className="tab-panel what-if-tab">
      <section className="what-if-hero compact">
        <div className="what-if-hero-left">
          <p className="eyebrow">Strategy mixing board</p>
          <h2><LabelWithHelp label="What If?" help="This tab lets campaign leadership test alternative reward priorities before changing allocation logic." /></h2>
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

      <section className="preset-row" aria-label="Policy simulator presets">
        {Object.keys(presets).map((name) => (
          <button className={activePreset === name ? "active" : ""} key={name} onClick={() => applyPreset(name)} type="button">
            <LabelWithHelp label={name} help={presetExplanations[name]} />
          </button>
        ))}
      </section>

      <section className="scenario-note">
        <strong>{activePreset}</strong>
        <span>{presetExplanations[activePreset] ?? "Custom policy settings. Compare the adjusted estimate against the current logged policy."}</span>
      </section>

      <p className="console-note">Hover over each control to see what it changes.</p>
      <section className="strategy-console" aria-label="Policy weight controls">
        {controls.map(([key, label, description]) => (
          <Knob
            description={description}
            key={key}
            label={label}
            onChange={(value) => updateWeight(key, value)}
            value={controlValue(weights, key)}
          />
        ))}
      </section>

      <section className="compact-policy-grid">
        <PolicySummaryCard title="Current chase policy" metrics={baseline} />
        <PolicySummaryCard baseline={baseline} metrics={adjusted} reliabilityNeedsMore={reliabilityNeedsMore} title="Adjusted chase policy" />
      </section>

      <section className="impact-row">
        <article className="projected-impact-card">
          <div>
            <span><LabelWithHelp label="Projected additional returned ballots" help="This extrapolates the estimated per-contact change across a larger ballot-chase universe. Real-world results would vary." /></span>
            <strong className={impactClass(projectedImpact)}>{formatImpactMoney(projectedImpact)}</strong>
            <small>{signedMoney(deltas?.estimated_net_value_per_contact ?? 0)} per 100 contacts over {audienceSize.toLocaleString()} voters</small>
            <p>Estimated returned-ballot difference if this chase policy had been used across the selected outreach volume.</p>
          </div>
        </article>

        <article className="projected-impact-card volunteer-impact-card">
          <div>
            <span><LabelWithHelp label="Estimated additional ballots returned" help="Estimated additional returned ballots from changing the ballot return rate across the selected audience size." /></span>
            <strong className={impactClass(projectedPriorityMoves)}>{formatSignedWholeNumber(projectedPriorityMoves)}</strong>
            <small>{formatDeltaPercent(deltas?.donation_conversion_rate)} over {audienceSize.toLocaleString()} contacts</small>
            <p>Projected incremental ballot returns from the adjusted outreach strategy across the selected audience.</p>
          </div>
        </article>
      </section>

      <section className="what-if-bottom compact">
        <article className="meaning-panel">
          <h3>What this means</h3>
          <p>
            The goal is not to chase every outstanding ballot equally. The goal is to identify where contact is most
            likely to change behavior. Humans define the reward, constraints, and tradeoffs; the adaptive system learns
            how those priorities shift returned ballots, urgency, fatigue, and county coverage.
          </p>
        </article>
        <article className="meaning-panel quiet-method">
          <h3>Why this works</h3>
          <p>
            Because the simulated campaign logs the action shown, the outcome, and the probability of assignment, we
            can estimate how a different policy might have performed. This is the basic idea behind offline policy
            evaluation. It is not perfect causal proof, but it is much stronger than guessing from ordinary
            observational data.
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

function controlValue(weights, key) {
  if (key === "fatigue_guardrail") return average(weights.fatigue_penalty, weights.unsubscribe_penalty);
  if (key === "trust_positive_tone") return average(weights.persuasion_trust_proxy_weight, weights.negative_urgency_message_penalty);
  if (key === "learning_diversity") return average(weights.exploration_diversity_weight, weights.fairness_audience_diversity_weight);
  return weights[key];
}

function applyControlValue(current, key, value) {
  if (key === "fatigue_guardrail") {
    return { ...current, fatigue_penalty: value, unsubscribe_penalty: value };
  }
  if (key === "trust_positive_tone") {
    return { ...current, persuasion_trust_proxy_weight: value, negative_urgency_message_penalty: value };
  }
  if (key === "learning_diversity") {
    return { ...current, exploration_diversity_weight: value, fairness_audience_diversity_weight: value };
  }
  return { ...current, [key]: value };
}

function average(left, right) {
  return (left + right) / 2;
}

function Knob({ label, description, value, onChange }) {
  const angle = value * 135 - 135;
  return (
    <label className="strategy-knob">
      <span><LabelWithHelp label={label} help={description} /></span>
      <input
        aria-label={label}
        max="2"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        step="0.25"
        type="range"
        value={value}
      />
      <i style={{ "--angle": `${angle}deg`, "--fill": `${value / 2}` }} />
      <strong>{value.toFixed(2)}</strong>
      <small>{description}</small>
    </label>
  );
}

function PolicySummaryCard({ title, metrics, baseline, reliabilityNeedsMore = false }) {
  return (
    <article className="policy-summary compact">
      <span><LabelWithHelp label={title} help={title === "Current chase policy" ? "The logged ballot-chase policy used as the comparison baseline." : "The estimated result after applying the selected priority weights."} /></span>
      <div className="summary-metric-layout">
        <div className="summary-primary">
          <small><LabelWithHelp label="Additional returns/contact" help="Estimated additional ballot-return impact per contacted voter after accounting for uplift and fatigue." /></small>
          <strong className={deltaValueClass(metrics?.estimated_net_value_per_contact, baseline?.estimated_net_value_per_contact)}>{formatMoney(metrics?.estimated_net_value_per_contact)}</strong>
        </div>
        <div className="summary-secondary">
          <span>Secondary metrics</span>
          <div className="summary-secondary-metrics">
            <SummaryMiniMetric
              label="Ballot return rate"
              help="Share of contacted voters expected to return their mail ballot."
              value={formatPercent(metrics?.donation_conversion_rate)}
              valueClass={deltaValueClass(metrics?.donation_conversion_rate, baseline?.donation_conversion_rate)}
            />
            <SummaryMiniMetric
              label="Average uplift"
              help="Estimated increase in ballot return probability caused by contact."
              value={formatPercent(metrics?.volunteer_conversion_rate)}
              valueClass={deltaValueClass(metrics?.volunteer_conversion_rate, baseline?.volunteer_conversion_rate)}
            />
            <SummaryMiniMetric
              label="Fatigue"
              help="Estimated risk that outreach reduces future response or increases opt-outs."
              value={formatPercent(metrics?.fatigue_risk)}
              valueClass={deltaValueClass(baseline?.fatigue_risk, metrics?.fatigue_risk)}
            />
          </div>
        </div>
      </div>
      {title === "Adjusted chase policy" && (
        <p className={reliabilityNeedsMore ? "summary-reliability warning" : "summary-reliability good"}>
          <LabelWithHelp
            label={`Reliable demo estimate? ${reliabilityNeedsMore ? "No" : "Yes"}`}
            help="This is the OPE-style overlap idea. Counterfactual estimates are more trustworthy when the historical policy sometimes tried the same kinds of actions the adjusted policy now prefers."
          />
        </p>
      )}
    </article>
  );
}

function SummaryMiniMetric({ label, help, value, valueClass }) {
  return (
    <div className="summary-mini-metric">
      <span><LabelWithHelp label={label} help={help} /></span>
      <strong className={valueClass}>{value}</strong>
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

function deltaValueClass(value, comparison) {
  if (typeof value !== "number" || typeof comparison !== "number" || Math.abs(value - comparison) < 0.002) return "neutral-value";
  return value > comparison ? "positive-value" : "tradeoff-value";
}

function formatMoney(value) {
  if (typeof value !== "number") return "Loading";
  return value.toFixed(2);
}

function signedMoney(value) {
  if (typeof value !== "number") return "Calculating";
  if (Math.abs(value) < 0.005) return "0.00";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function formatImpactMoney(value) {
  if (typeof value !== "number") return "Calculating";
  const rounded = Math.round(value);
  const absolute = Math.abs(rounded).toLocaleString();
  if (rounded < 0) return `-${absolute}`;
  if (rounded > 0) return `+${absolute}`;
  return "0";
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
