import React, { useEffect, useMemo, useState } from "react";

const defaultWeights = {
  donation_value_weight: 1.0,
  conversion_weight: 0.7,
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
  "Current policy": defaultWeights,
  "Prioritize big donors": {
    ...defaultWeights,
    donation_value_weight: 1.55,
    high_dollar_donor_weight: 1.35,
    fatigue_penalty: 0.65,
  },
  "More positive campaign": {
    ...defaultWeights,
    persuasion_trust_proxy_weight: 1.25,
    local_community_message_boost: 1.1,
    negative_urgency_message_penalty: 1.35,
  },
  "Learn aggressively": {
    ...defaultWeights,
    donation_value_weight: 0.6,
    exploration_diversity_weight: 1.45,
    fairness_audience_diversity_weight: 1.25,
  },
  "Long-term trust": {
    ...defaultWeights,
    persuasion_trust_proxy_weight: 1.45,
    fatigue_penalty: 1.25,
    unsubscribe_penalty: 1.2,
    fairness_audience_diversity_weight: 1.05,
  },
  "Local/community focus": {
    ...defaultWeights,
    local_community_message_boost: 1.55,
    persuasion_trust_proxy_weight: 1.05,
  },
  "Optimize net value": {
    ...defaultWeights,
    donation_value_weight: 1.75,
    conversion_weight: 1.05,
    high_dollar_donor_weight: 0.85,
    fatigue_penalty: 0.8,
    unsubscribe_penalty: 0.75,
    negative_urgency_message_penalty: 0.65,
    message_diversity_weight: 0.25,
  },
};

const controls = [
  ["donation_value_weight", "Donation value", "Prioritize expected dollars raised per contact."],
  ["conversion_weight", "Conversion", "Prioritize the chance that a contacted supporter donates."],
  ["high_dollar_donor_weight", "High-dollar donors", "Give more weight to contacts likely to produce larger donations."],
  ["persuasion_trust_proxy_weight", "Persuasion/trust", "Favor messages that build credibility and civic trust."],
  ["fatigue_penalty", "Fatigue penalty", "Reduce priority for contacts likely to feel over-contacted."],
  ["unsubscribe_penalty", "Contact-risk penalty", "Use fatigue, channel pressure, and urgency as an opt-out risk proxy."],
  ["negative_urgency_message_penalty", "Urgency/negative penalty", "Reduce reliance on urgent or accountability-heavy frames."],
  ["local_community_message_boost", "Local/community boost", "Favor local investment and everyday-affordability frames."],
  ["exploration_diversity_weight", "Exploration diversity", "Preserve learning across message and channel options."],
  ["fairness_audience_diversity_weight", "Audience diversity", "Avoid concentrating the adjusted policy on only one supporter type."],
];

export default function WhatIfTab({ apiBase }) {
  const [weights, setWeights] = useState(defaultWeights);
  const [activePreset, setActivePreset] = useState("Current policy");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    setWeights((current) => ({ ...current, [key]: Number(value) }));
  }

  const adjusted = result?.adjusted_policy;
  const baseline = result?.baseline_policy;
  const deltas = result?.deltas;
  const neutral = !deltas || Math.abs(deltas.estimated_net_value_per_contact) < 0.005;

  return (
    <div className="tab-panel what-if-tab">
      <section className="what-if-hero compact">
        <div>
          <p className="eyebrow">Strategy mixing board</p>
          <h2>What If?</h2>
          <p>Explore how changing campaign priorities reshapes persuasion, fundraising, fatigue, and audience reach.</p>
          <p>What If lets campaign leadership test how changing priorities would have changed estimated outcomes on the simulated campaign log.</p>
          <small className="quiet-caveat">Offline simulation, not causal proof. Estimates are strongest when the historical policy explored similar actions.</small>
        </div>
        <article className="what-if-impact">
          <span>Estimated net value per contact</span>
          <strong>{adjusted ? formatMoney(adjusted.estimated_net_value_per_contact) : "Loading"}</strong>
          <small>Adjusted policy vs current policy</small>
          <em className={neutral ? "neutral-delta" : deltaClass(deltas?.estimated_net_value_per_contact)}>{deltas ? `${signedMoney(deltas.estimated_net_value_per_contact)} vs current policy` : "Calculating"}</em>
        </article>
      </section>

      <section className="default-note">
        <strong>Default settings match the current logged policy.</strong>
        <span>The default policy reflects the current reward settings used by the simulated adaptive campaign: optimize net donation value per contact while applying guardrails for fatigue, exploration, and audience coverage.</span>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="preset-row" aria-label="Policy simulator presets">
        {Object.keys(presets).map((name) => (
          <button className={activePreset === name ? "active" : ""} key={name} onClick={() => applyPreset(name)} type="button">
            {name}
          </button>
        ))}
      </section>

      <section className="strategy-console" aria-label="Policy weight controls">
        {controls.map(([key, label, description]) => (
          <Knob
            description={description}
            key={key}
            label={label}
            onChange={(value) => updateWeight(key, value)}
            value={weights[key]}
          />
        ))}
      </section>

      <section className="compact-policy-grid">
        <PolicySummaryCard title="Current policy" metrics={baseline} />
        <PolicySummaryCard title="Adjusted policy" metrics={adjusted} />
        <DeltaCard deltas={deltas} />
      </section>

      <section className="what-if-metrics compact">
        <MetricTile label="Conversion" value={formatPercent(adjusted?.donation_conversion_rate)} delta={formatDeltaPercent(deltas?.donation_conversion_rate)} />
        <MetricTile label="Average donation" value={formatMoney(adjusted?.average_donation_amount)} delta={signedMoney(deltas?.average_donation_amount)} />
        <MetricTile label="Fatigue" value={formatPercent(adjusted?.fatigue_risk)} delta={formatDeltaPercent(deltas?.fatigue_risk, true)} />
        <MetricTile label="Message diversity" value={formatPercent(adjusted?.message_diversity)} delta={formatDeltaPercent(deltas?.message_diversity)} />
      </section>

      <section className="what-if-bottom compact">
        <article className="meaning-panel">
          <h3>What this means</h3>
          <p>
            The bandit does not decide what "good" means on its own. Humans define the reward, constraints, and
            tradeoffs. This simulator shows how changing those priorities can shift estimated outcomes across
            donations, persuasion, fatigue, and audience coverage.
          </p>
        </article>
        <article className="overlap-panel">
          <span className={result?.overlap?.warning ? "soft-pill warning-pill" : "soft-pill"}>{result?.overlap?.level ?? "Checking overlap"}</span>
          <h3>Overlap and reliability</h3>
          <p>{result?.overlap?.explanation ?? "Waiting for policy estimate."}</p>
          {result?.top_affected_audience_segment && (
            <dl>
              <dt>Top affected audience segment</dt>
              <dd>{result.top_affected_audience_segment.segment}</dd>
              <dt>Adjusted share</dt>
              <dd>{formatPercent(result.top_affected_audience_segment.adjusted_share)}</dd>
            </dl>
          )}
          {loading && <small>Updating estimate...</small>}
        </article>
      </section>
    </div>
  );
}

function Knob({ label, description, value, onChange }) {
  const angle = value * 135 - 135;
  return (
    <label className="strategy-knob" title={description}>
      <span>{label}</span>
      <input
        aria-label={label}
        max="2"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        step="0.05"
        type="range"
        value={value}
      />
      <i style={{ "--angle": `${angle}deg`, "--fill": `${value / 2}` }} />
      <strong>{value.toFixed(2)}</strong>
      <small>{description}</small>
    </label>
  );
}

function PolicySummaryCard({ title, metrics }) {
  return (
    <article className="policy-summary compact">
      <span>{title}</span>
      <strong>{formatMoney(metrics?.estimated_net_value_per_contact)}</strong>
      <dl>
        <dt>Conversion</dt>
        <dd>{formatPercent(metrics?.donation_conversion_rate)}</dd>
        <dt>Fatigue</dt>
        <dd>{formatPercent(metrics?.fatigue_risk)}</dd>
        <dt>Diversity</dt>
        <dd>{formatPercent(metrics?.message_diversity)}</dd>
      </dl>
    </article>
  );
}

function DeltaCard({ deltas }) {
  const value = deltas?.estimated_net_value_per_contact ?? 0;
  return (
    <article className={`delta-card ${deltaClass(value)}`}>
      <span>Change vs current policy</span>
      <strong>{deltas ? signedMoney(value) : "Calculating"}</strong>
      <p>
        {Math.abs(value) < 0.005
          ? "Neutral: this setting matches the logged policy."
          : value > 0
            ? "Improvement: higher estimated net value with current guardrails."
            : "Tradeoff: lower net value, possibly buying down risk or broadening reach."}
      </p>
    </article>
  );
}

function MetricTile({ label, value, delta }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

function deltaClass(value = 0) {
  if (value > 0.005) return "positive";
  if (value < -0.005) return "tradeoff";
  return "neutral";
}

function formatMoney(value) {
  if (typeof value !== "number") return "Loading";
  return `$${value.toFixed(2)}`;
}

function signedMoney(value) {
  if (typeof value !== "number") return "Calculating";
  if (Math.abs(value) < 0.005) return "$0.00";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toFixed(2)}`;
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
