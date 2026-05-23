import React, { useState } from "react";

const messageFamilies = [
  "Affordability / cost of living",
  "Anti-corruption / accountability",
  "Democracy protection",
  "Local community investment",
  "Economic fairness",
  "Candidate momentum / urgency",
];

const familyThemes = {
  "Affordability / cost of living": "lower everyday costs for New York families",
  "Anti-corruption / accountability": "accountability and cleaner government",
  "Democracy protection": "protecting voting rights and democratic institutions",
  "Local community investment": "stronger schools, safer neighborhoods, and local services",
  "Economic fairness": "fair wages and an economy that works for everyone",
  "Candidate momentum / urgency": "keeping campaign momentum strong before the next deadline",
};

export default function AiTab({ recommendation }) {
  const [reviews, setReviews] = useState({});
  const [family, setFamily] = useState(messageFamilies[0]);
  if (!recommendation) {
    return <section className="panel loading">Loading campaign message adaptation workflow...</section>;
  }

  function setDecision(id, decision) {
    setReviews((current) => ({ ...current, [id]: { ...current[id], decision } }));
  }

  function setReplacement(id, replacement) {
    setReviews((current) => ({ ...current, [id]: { ...current[id], replacement } }));
  }

  const familyTheme = familyThemes[family];

  return (
    <div className="tab-panel">
      <section className="panel ai-callout">
        <strong>This section shows ONE example message family.</strong>
        <p>
          A real campaign would repeat this workflow across multiple issue frames, supporter types, and outreach channels.
        </p>
      </section>

      <section className="panel intro-card">
        <h2>AI Message Review</h2>
        <p>{recommendation.explanation}</p>
        <span className="review-pill">Human review required</span>
      </section>

      <section className="panel family-selector">
        <label htmlFor="message-family">Message family</label>
        <select id="message-family" onChange={(event) => setFamily(event.target.value)} value={family}>
          {messageFamilies.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </section>

      <section className="panel">
        <h2>Staff-written base message</h2>
        <div className="base-message">
          {recommendation.base_message.replaceAll("lower everyday costs", familyTheme).replaceAll("cost of living", familyTheme)}
        </div>
      </section>

      <section className="panel">
        <h2>Retrieved campaign context</h2>
        <div className="context-grid">
          <ContextItem label="Approved issue brief" value={recommendation.retrieved_context.approved_issue_brief} />
          <ContextItem label="Approved tone" value={recommendation.retrieved_context.approved_tone} />
          <ContextItem label="Channel constraints" value={recommendation.retrieved_context.channel_constraints} />
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
                <p className="generated-message">{adaptVariantMessage(variant, familyTheme)}</p>
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
                  <button className="reject-button" onClick={() => setDecision(variant.id, "revise")} type="button">
                    Revise
                  </button>
                </div>
                {review.decision && <small>Status: {review.decision}</small>}
                {review.decision === "revise" && (
                  <div className="replacement-box">
                    <label htmlFor={`replacement-${variant.id}`}>Write revised message</label>
                    <textarea
                      id={`replacement-${variant.id}`}
                      onChange={(event) => setReplacement(variant.id, event.target.value)}
                      value={review.replacement ?? ""}
                    />
                    <button type="button">Submit revised version</button>
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

function adaptVariantMessage(variant, theme) {
  if (variant.medium === "SMS") {
    return variant.audience.includes("prior donor")
      ? `You have helped before. Can you chip in today to support ${theme}?`
      : `We are organizing around ${theme}. Can we count on your support today?`;
  }
  if (variant.medium === "Email") {
    return `You have helped power this campaign before. Today, we are focused on ${theme}, and another grassroots donation would help us reach more voters before the next outreach push.`;
  }
  return `Hi, I am volunteering with the campaign. We are talking with neighbors about ${theme}. Is that an issue you would like to hear more about?`;
}
