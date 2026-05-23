import React from "react";

export default function AiTab({ recommendation }) {
  if (!recommendation) {
    return <section className="panel loading">Loading campaign message research synthesis...</section>;
  }

  return (
    <div className="tab-panel">
      <section className="panel ai-hero">
        <div>
          <p className="eyebrow">Campaign messaging research synthesis</p>
          <h2>AI-assisted, template-bound, and human-reviewed</h2>
          <p>{recommendation.warning}</p>
        </div>
        <span className="review-pill">Human review required</span>
      </section>

      <section className="ai-summary-grid">
        <Card label="Recommended outreach strategy" value={recommendation.recommended_outreach_strategy} />
        <Card label="Recommended message frame" value={recommendation.recommended_message_frame} />
        <Card label="Recommended channel" value={recommendation.recommended_channel} />
        <Card label="Fatigue risk" value={formatPercent(recommendation.fatigue_risk)} tone={recommendation.fatigue_risk > 0.4 ? "warning" : "stable"} />
      </section>

      <section className="panel">
        <h2>Why this segment is prioritized</h2>
        <p>{recommendation.why_prioritized}</p>
        <div className="recommendation-card">
          <strong>{recommendation.generated_rationale}</strong>
          <p>Approved template: “{recommendation.sample_template}”</p>
        </div>
      </section>

      <section className="ai-grid">
        <div className="panel">
          <h2>Segment context</h2>
          <dl className="detail-list">
            <dt>Segment</dt>
            <dd>{recommendation.segment_context.segment}</dd>
            <dt>Conversion rate</dt>
            <dd>{formatPercent(recommendation.segment_context.conversion_rate)}</dd>
            <dt>Expected value</dt>
            <dd>${recommendation.segment_context.expected_value.toFixed(2)}</dd>
          </dl>
        </div>
        <div className="panel">
          <h2>Retrieved prior performance</h2>
          <ul className="plain-list">
            {recommendation.retrieved_evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel">
        <h2>Why this arm was selected</h2>
        <div className="explain-grid">
          <Card label="Expected reward" value={formatPercent(recommendation.decision_explanation.expected_reward)} />
          <Card label="Uncertainty" value={recommendation.decision_explanation.uncertainty.toFixed(3)} />
          <Card label="Exploration need" value={recommendation.decision_explanation.exploration_need.toFixed(3)} />
          <Card label="Fatigue penalty" value={recommendation.decision_explanation.fatigue_penalty.toFixed(3)} />
          <Card label="Channel fit" value={recommendation.decision_explanation.channel_fit.toFixed(2)} />
        </div>
        <p className="panel-copy">{recommendation.decision_explanation.selection_reason}</p>
      </section>

      <section className="panel risk-note">
        <h2>Risk note</h2>
        <p>{recommendation.risk_note}</p>
      </section>

      <section className="panel">
        <h2>Approved message templates</h2>
        <div className="template-grid">
          {recommendation.approved_message_templates.map((template) => (
            <article key={template.id}>
              <strong>{template.label}</strong>
              <p>{template.template}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value, tone = "" }) {
  return (
    <article className="metric-card compact-card">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </article>
  );
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}
