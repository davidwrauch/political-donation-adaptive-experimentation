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
  "Current policy": defaultWeights,
  "Prioritize big donations": {
    ...defaultWeights,
    donation_value_weight: 1.55,
    conversion_weight: 0.85,
    high_dollar_donor_weight: 1.35,
    fatigue_penalty: 0.65,
    exploration_diversity_weight: 0.12,
    fairness_audience_diversity_weight: 0.12,
  },
  "Prioritize small donations": {
    ...defaultWeights,
    donation_value_weight: 0.55,
    conversion_weight: 1.45,
    persuasion_trust_proxy_weight: 0.9,
    local_community_message_boost: 1.0,
    negative_urgency_message_penalty: 1.0,
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
    conversion_weight: 0.65,
    exploration_diversity_weight: 1.45,
    fairness_audience_diversity_weight: 1.25,
  },
  "Balance donations + volunteers": {
    ...defaultWeights,
    donation_value_weight: 1.15,
    conversion_weight: 0.85,
    volunteer_conversion_weight: 1.05,
    persuasion_trust_proxy_weight: 1.1,
    local_community_message_boost: 1.05,
    negative_urgency_message_penalty: 1.0,
    fatigue_penalty: 0.9,
    unsubscribe_penalty: 0.85,
  },
  "Prioritize volunteering": {
    ...defaultWeights,
    donation_value_weight: 0.45,
    conversion_weight: 0.75,
    volunteer_conversion_weight: 1.75,
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
  "Current policy": "Uses the same reward settings as the current logged policy. Choose this when you want the simulator to match the campaign's existing allocation logic.",
  "Prioritize big donations": "Increases weight on expected dollars per contact and larger gift potential. This may raise total value, but can concentrate outreach among already-likely donors.",
  "Prioritize small donations": "Increases weight on broader conversion and lower-friction giving. This may grow participation and list engagement, but average donation size may fall.",
  "More positive campaign": "Rewards trust-building and reduces reliance on urgent or pressure-heavy frames. This may reduce fatigue and improve long-term engagement, but short-term donation value may be lower.",
  "Learn aggressively": "Preserves more exploration across audiences, messages, and channels. This can improve learning and avoid premature lock-in, but may sacrifice near-term fundraising efficiency.",
  "Balance donations + volunteers": "Keeps donation value important while increasing weight on volunteering, trust-building, local relevance, and fatigue guardrails.",
  "Prioritize volunteering": "Raises the value of volunteer signups and civic participation. Donation value may fall, but the campaign could build more durable organizing capacity.",
};

const controls = [
  ["donation_value_weight", "Donation value", "Prioritize expected dollars raised per contact."],
  ["conversion_weight", "Conversion", "Prioritize the chance that a contacted supporter donates."],
  ["volunteer_conversion_weight", "Volunteer conversion", "Prioritize contacts and messages more likely to produce volunteer signups or civic participation, not just donations."],
  ["trust_positive_tone", "Trust/positive tone", "Favor messages that build confidence, credibility, and longer-term trust while reducing pressure-heavy frames."],
  ["fatigue_guardrail", "Fatigue guardrail", "Reduce priority for contacts likely to feel over-contacted or less responsive after repeated outreach."],
  ["local_community_message_boost", "Local/community", "Favor local investment, community benefit, and everyday-affordability frames."],
  ["learning_diversity", "Learning/diversity", "Preserve exploration across messages, audiences, and channels so the campaign keeps learning."],
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
  const [activePreset, setActivePreset] = useState("Current policy");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
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
  const reliabilityNeedsMore = result?.overlap?.warning || activePreset === "Learn aggressively";
  const projectedImpact = (deltas?.estimated_net_value_per_contact ?? 0) * audienceSize;
  const projectedVolunteerSignups = (deltas?.volunteer_conversion_rate ?? 0) * audienceSize;

  return (
    <div className="tab-panel what-if-tab">
      <section className="what-if-hero compact">
        <div>
          <p className="eyebrow">Strategy mixing board</p>
          <h2><LabelWithHelp label="What If?" help="This tab lets campaign leadership test alternative reward priorities before changing allocation logic." /></h2>
          <p>Test how different campaign priorities would change the system's recommendations.</p>
          <p>Use this as a strategy mixing board: shift the reward settings, compare the result to the current policy, and see the tradeoffs before changing how outreach is allocated.</p>
          <small className="quiet-caveat">
            <LabelWithHelp
              label="Offline estimate, not proof."
              help="This uses the simulated campaign log to estimate what might have happened under different priorities. It is most reliable when the historical experiment explored similar actions often enough to compare them."
            />
          </small>
        </div>
      </section>

      <section className="default-note">
        <strong>Default settings match the current logged policy.</strong>
        <span>The default policy reflects the current reward settings used by the simulated adaptive campaign: optimize net donation value per contact while applying guardrails for fatigue, exploration, and audience coverage.</span>
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
      <p className="console-note tradeoff-note">
        Some strategies raise dollars per contact. Others may produce more volunteers, trust, or long-term engagement. This tab is meant to show those tradeoffs before changing campaign priorities.
        <HelpTooltip text="These controls are weights, not independent improvement levers. Turning every knob up does not mean every outcome improves; it changes the scoring rule and can create tradeoffs between money, trust, fatigue, and learning." />
      </p>

      <section className="compact-policy-grid">
        <PolicySummaryCard title="Current policy" metrics={baseline} />
        <PolicySummaryCard baseline={baseline} metrics={adjusted} reliabilityNeedsMore={reliabilityNeedsMore} title="Adjusted policy" />
        <DeltaCard deltas={deltas} />
      </section>

      <section className="impact-row">
        <article className="projected-impact-card">
          <div>
            <span><LabelWithHelp label="Projected campaign impact" help="This extrapolates the estimated per-contact change across a larger campaign audience. Real-world results would vary." /></span>
            <strong>{formatImpactMoney(projectedImpact)}</strong>
            <small>{signedMoney(deltas?.estimated_net_value_per_contact ?? 0)}/contact over {audienceSize.toLocaleString()} contacts</small>
            <p>Estimated difference if this policy had been used across the selected outreach volume.</p>
          </div>
          <label>
            Audience size
            <select onChange={(event) => setAudienceSize(Number(event.target.value))} value={String(audienceSize)}>
              {audienceOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </article>

        <article className="projected-impact-card volunteer-impact-card">
          <div>
            <span><LabelWithHelp label="Projected volunteer signups" help="Estimated additional volunteer actions across the selected audience size based on the volunteer conversion change." /></span>
            <strong>{formatSignedWholeNumber(projectedVolunteerSignups)}</strong>
            <small>{formatDeltaPercent(deltas?.volunteer_conversion_rate)} over {audienceSize.toLocaleString()} contacts</small>
            <p>Estimated additional volunteer, canvassing, phonebanking, event, or civic-participation actions.</p>
          </div>
        </article>
      </section>

      <section className="what-if-bottom compact">
        <article className="meaning-panel">
          <h3>What this means</h3>
          <p>
            Contextual bandits (adaptive experimentation) do not decide what "good" means on their own. Humans define
            the reward, constraints, and tradeoffs. This simulator shows how changing those priorities can shift
            estimated outcomes across donations, volunteering, trust, fatigue, and audience coverage.
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
            This prototype is grounded in contextual bandits, adaptive experimentation, and OPE-style offline policy
            simulation. The methodology note explains why this approach is useful, what assumptions it requires, and
            why it should be read as decision support rather than causal proof.
          </p>
        </div>
        <div className="methodology-actions">
          <button onClick={() => setShowMethodology(true)} type="button">View methodology note</button>
          <a download href="/adaptive-experimentation-methodology.pdf">Download PDF</a>
        </div>
      </section>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
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
    <label className="strategy-knob" title={description}>
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
      <span><LabelWithHelp label={title} help={title === "Current policy" ? "The logged campaign policy used as the comparison baseline." : "The estimated result after applying the selected priority weights."} /></span>
      <div className="summary-metric-layout">
        <div className="summary-primary">
          <strong>{formatMoney(metrics?.estimated_net_value_per_contact)}</strong>
          <small><LabelWithHelp label="Net value/contact" help="Estimated donation value per contacted person after accounting for conversion, donation amount, and fatigue." /></small>
        </div>
        <div className="summary-secondary">
          <span>Secondary metrics</span>
          <dl>
            <dt><LabelWithHelp label="Donation conversion" help="Share of contacted supporters expected to donate." /></dt>
            <dd className={deltaValueClass(metrics?.donation_conversion_rate, baseline?.donation_conversion_rate)}>{formatPercent(metrics?.donation_conversion_rate)}</dd>
            <dt><LabelWithHelp label="Volunteer conversion" help="Estimated share of contacted supporters who would take a non-donation campaign action, such as volunteering, canvassing, phonebanking, or event signup." /></dt>
            <dd className={deltaValueClass(metrics?.volunteer_conversion_rate, baseline?.volunteer_conversion_rate)}>{formatPercent(metrics?.volunteer_conversion_rate)}</dd>
            <dt><LabelWithHelp label="Fatigue" help="Estimated risk that outreach reduces future response or increases opt-outs." /></dt>
            <dd className={deltaValueClass(baseline?.fatigue_risk, metrics?.fatigue_risk)}>{formatPercent(metrics?.fatigue_risk)}</dd>
            <dt><LabelWithHelp label="Diversity" help="How evenly the policy keeps message frames represented instead of collapsing to one option." /></dt>
            <dd className={deltaValueClass(metrics?.message_diversity, baseline?.message_diversity)}>{formatPercent(metrics?.message_diversity)}</dd>
          </dl>
        </div>
      </div>
      {title === "Adjusted policy" && (
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
      setStyle({ left, top: Math.max(margin, top), width });
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
  if (typeof value !== "number" || typeof comparison !== "number" || Math.abs(value - comparison) < 0.0001) return "neutral-value";
  return value > comparison ? "positive-value" : "tradeoff-value";
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

function formatImpactMoney(value) {
  if (typeof value !== "number") return "Calculating";
  const rounded = Math.round(value);
  const absolute = Math.abs(rounded).toLocaleString();
  if (rounded < 0) return `-$${absolute}`;
  if (rounded > 0) return `+$${absolute}`;
  return "$0";
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

function MethodologyModal({ onClose }) {
  return (
    <section className="methodology-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Methodology note">
      <div className="methodology-modal" onClick={(event) => event.stopPropagation()}>
        <div className="methodology-modal-head">
          <h2>Methodology note</h2>
          <button onClick={onClose} type="button">Close</button>
        </div>
        <iframe src="/adaptive-experimentation-methodology.pdf" title="Adaptive experimentation methodology note" />
        <p>
          If the embedded preview is unavailable, use Download PDF to open the methodology note directly.
        </p>
      </div>
    </section>
  );
}
