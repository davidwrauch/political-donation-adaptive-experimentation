import React from "react";

export default function AiTab({ recommendation, overview }) {
  if (!recommendation) {
    return <section className="panel loading">Loading deterministic campaign synthesis...</section>;
  }

  return (
    <div className="tab-panel">
      <section className="panel ai-hero">
        <div>
          <p className="eyebrow">Human-reviewed AI assistance</p>
          <h2>Campaign research synthesis, not autonomous persuasion</h2>
          <p>{recommendation.warning}</p>
        </div>
        <span className="review-pill">Human review required</span>
      </section>

      <section className="panel">
        <h2>Recommended message frame by segment</h2>
        <div className="recommendation-card">
          <strong>{recommendation.generated_rationale}</strong>
          <p>Approved template: “{recommendation.sample_template}”</p>
        </div>
      </section>

      <section className="ai-grid">
        <div className="panel">
          <h2>Retrieved evidence</h2>
          <ul className="plain-list">
            {recommendation.retrieved_evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>Issue affinity summary</h2>
          <p>{recommendation.issue_affinity_summary.interpretation}</p>
          <small>Current best frame: {overview.best_message_frame.label}</small>
        </div>
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
