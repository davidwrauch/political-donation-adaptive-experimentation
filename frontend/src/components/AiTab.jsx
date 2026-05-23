import React, { useState } from "react";

export default function AiTab({ recommendation }) {
  const [reviews, setReviews] = useState({});
  if (!recommendation) {
    return <section className="panel loading">Loading campaign message adaptation workflow...</section>;
  }

  function setDecision(id, decision) {
    setReviews((current) => ({ ...current, [id]: { ...current[id], decision } }));
  }

  function setReplacement(id, replacement) {
    setReviews((current) => ({ ...current, [id]: { ...current[id], replacement } }));
  }

  return (
    <div className="tab-panel">
      <section className="panel intro-card">
        <h2>Constrained message adaptation workflow</h2>
        <p>{recommendation.explanation}</p>
        <span className="review-pill">Human review required</span>
      </section>

      <section className="panel">
        <h2>Staff-written base message</h2>
        <div className="base-message">{recommendation.base_message}</div>
      </section>

      <section className="panel">
        <h2>Retrieved campaign context</h2>
        <div className="context-grid">
          <ContextItem label="Approved issue brief" value={recommendation.retrieved_context.approved_issue_brief} />
          <ContextItem label="Approved tone" value={recommendation.retrieved_context.approved_tone} />
          <ContextItem label="Prior performance note" value={recommendation.retrieved_context.prior_performance_note} />
        </div>
      </section>

      <section className="panel">
        <h2>LLM-generated variants for review</h2>
        <div className="variant-grid">
          {recommendation.variants.map((variant) => {
            const review = reviews[variant.id] ?? {};
            return (
              <article className="variant-card" key={variant.id}>
                <div className="variant-head">
                  <strong>{variant.medium}</strong>
                  <span>{variant.audience}</span>
                </div>
                <p className="generated-message">{variant.message}</p>
                <dl className="variant-meta">
                  <dt>Audience</dt>
                  <dd>{variant.audience}</dd>
                  <dt>Medium</dt>
                  <dd>{variant.medium}</dd>
                  <dt>Length</dt>
                  <dd>{variant.length}</dd>
                  <dt>Reason for adaptation</dt>
                  <dd>{variant.reason}</dd>
                </dl>
                <div className="review-actions">
                  <button className="approve-button" onClick={() => setDecision(variant.id, "approved")} type="button">
                    Approve
                  </button>
                  <button className="reject-button" onClick={() => setDecision(variant.id, "rejected")} type="button">
                    Reject
                  </button>
                </div>
                {review.decision && <small>Status: {review.decision}</small>}
                {review.decision === "rejected" && (
                  <div className="replacement-box">
                    <label htmlFor={`replacement-${variant.id}`}>Write replacement message</label>
                    <textarea
                      id={`replacement-${variant.id}`}
                      onChange={(event) => setReplacement(variant.id, event.target.value)}
                      value={review.replacement ?? ""}
                    />
                    <button type="button">Submit replacement</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ContextItem({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
