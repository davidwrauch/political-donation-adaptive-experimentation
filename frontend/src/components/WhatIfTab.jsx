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

const controls = [
  ["donation_value_weight", "Donation value", "Prioritize expected dollars raised per contact."],
  ["conversion_weight", "Conversion", "Prioritize the chance that a contacted supporter donates."],
  ["high_dollar_donor_weight", "High-dollar donors", "Give more weight to contacts likely to produce larger donations."],
  ["persuasion_trust_proxy_weight", "Persuasion and trust", "Favor messages that build confidence, credibility, and civic trust."],
  ["fatigue_penalty", "Fatigue penalty", "Reduce priority for contacts likely to feel over-contacted."],
  ["unsubscribe_penalty", "Contact-risk penalty", "Use fatigue, channel pressure, and urgency as an opt-out risk proxy."],
  ["negative_urgency_message_penalty", "Urgency or negative-frame penalty", "Reduce reliance on urgent or accountability-heavy frames."],
  ["local_community_message_boost", "Local/community boost", "Favor local investment and everyday-affordability frames."],
  ["exploration_diversity_weight", "Exploration diversity", "Preserve learning across message and channel options."],
  ["fairness_audience_diversity_weight", "Audience diversity", "Avoid concentrating the adjusted policy on only one supporter type."],
];

export default function WhatIfTab({ apiBase }) {
  const [weights, setWeights] = useState(defaultWeights);
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
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [apiBase, requestKey, weights]);

  const adjusted = result?.adjusted_policy;
  const baseline = result?.baseline_policy;
  const deltas = result?.deltas;

  return (
    <div className="tab-panel what-if-tab">
      <section className="what-if-hero">
        <div>
          <p className="eyebrow">Offline strategy lab</p>
          <h2>What If?</h2>
          <p>
            Explore how changing campaign priorities reshapes persuasion, fundraising, fatigue, and audience reach.
          </p>
          <small>Counterfactual policy simulator</small>
          <small>
            Offline policy simulation, not causal proof. Estimates are strongest where the historical policy explored
            similar actions with enough probability overlap.
          </small>
        </div>
        <article className="what-if-impact">
          <span>Estimated net value per contact under adjusted policy</span>
          <strong>{adjusted ? formatMoney(adjusted.estimated_net_value_per_contact) : "Loading"}</strong>
          <small>{deltas ? signedMoney(deltas.estimated_net_value_per_contact) : "Calculating"} vs baseline</small>
        </article>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="simulator-layout">
        <div className="control-surface">
          <div className="control-heading">
            <h3>Strategy controls</h3>
            <button onClick={() => setWeights(defaultWeights)} type="button">Reset</button>
          </div>
          <div className="slider-stack">
            {controls.map(([key, label, description]) => (
              <label className="strategy-slider" key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <em>{weights[key].toFixed(2)}</em>
                <input
                  max="2"
                  min="0"
                  onChange={(event) => setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  step="0.05"
                  type="range"
                  value={weights[key]}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="policy-readout">
          <section className="comparison-surface">
            <PolicySummaryCard title="Current logged policy" metrics={baseline} muted />
            <PolicySummaryCard title="Adjusted priority policy" metrics={adjusted} delta={deltas} />
          </section>

          <section className="what-if-metrics">
            <MetricTile label="Conversion rate" value={formatPercent(adjusted?.donation_conversion_rate)} delta={formatDeltaPercent(deltas?.donation_conversion_rate)} />
            <MetricTile label="Average donation amount" value={formatMoney(adjusted?.average_donation_amount)} delta={signedMoney(deltas?.average_donation_amount)} />
            <MetricTile label="High-dollar share" value={formatPercent(adjusted?.high_dollar_donation_share)} delta={formatDeltaPercent(deltas?.high_dollar_donation_share)} />
            <MetricTile label="Fatigue risk" value={formatPercent(adjusted?.fatigue_risk)} delta={formatDeltaPercent(deltas?.fatigue_risk, true)} />
            <MetricTile label="Contact-risk proxy" value={formatPercent(adjusted?.unsubscribe_contact_risk_proxy)} delta={formatDeltaPercent(deltas?.unsubscribe_contact_risk_proxy, true)} />
            <MetricTile label="Persuasion/trust proxy" value={formatPercent(adjusted?.persuasion_trust_proxy)} delta={formatDeltaPercent(deltas?.persuasion_trust_proxy)} />
            <MetricTile label="Message diversity" value={formatPercent(adjusted?.message_diversity)} delta={formatDeltaPercent(deltas?.message_diversity)} />
            <MetricTile label="Local/community share" value={formatPercent(adjusted?.local_community_frame_share)} delta={formatDeltaPercent(deltas?.local_community_frame_share)} />
            <MetricTile label="Urgency/negative share" value={formatPercent(adjusted?.urgency_negative_frame_share)} delta={formatDeltaPercent(deltas?.urgency_negative_frame_share, true)} />
          </section>
        </div>
      </section>

      <section className="what-if-bottom">
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

function PolicySummaryCard({ title, metrics, delta, muted = false }) {
  return (
    <article className={muted ? "policy-summary muted" : "policy-summary adjusted"}>
      <span>{title}</span>
      <strong>{formatMoney(metrics?.estimated_net_value_per_contact)}</strong>
      <div>
        <small>Net value/contact</small>
        {delta && <em>{signedMoney(delta.estimated_net_value_per_contact)} vs baseline</em>}
      </div>
      <p>{formatPercent(metrics?.donation_conversion_rate)} conversion | {formatPercent(metrics?.fatigue_risk)} fatigue</p>
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

function formatMoney(value) {
  if (typeof value !== "number") return "Loading";
  return `$${value.toFixed(2)}`;
}

function signedMoney(value) {
  if (typeof value !== "number") return "Calculating";
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toFixed(2)}`;
}

function formatPercent(value) {
  if (typeof value !== "number") return "Loading";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDeltaPercent(value, lowerIsBetter = false) {
  if (typeof value !== "number") return "Calculating";
  const sign = value >= 0 ? "+" : "";
  const direction = lowerIsBetter ? (value <= 0 ? " better" : " higher") : "";
  return `${sign}${(value * 100).toFixed(1)} pts${direction}`;
}
