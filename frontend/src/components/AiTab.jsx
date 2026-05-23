import React, { useState } from "react";

const messageFamilies = [
  "Economic affordability",
  "Healthcare access",
  "Democracy/voting rights",
  "Climate/resiliency",
  "Public transit/infrastructure",
  "Reproductive rights",
];

const familyContent = {
  "Economic affordability": {
    tone: "practical and kitchen-table",
    base: `Families across New York are making hard choices every month. Rent is high. Groceries cost more. A surprise bill can throw a household off track.

Our campaign is focused on making everyday life more affordable. That means fighting for lower costs, fair wages, and leaders who understand what working families are facing.

Your donation helps us reach voters with a clear message: New York should work for the people who keep it running.`,
    frame: "making everyday life more affordable",
  },
  "Healthcare access": {
    tone: "calm and care-focused",
    base: `No one should skip a doctor visit because the bill is too high. Families need healthcare they can actually use, not just a plan that looks good on paper.

Our campaign is talking with voters about lower prescription costs, better access to care, and protecting community health services.

A donation today helps us share that message with more New Yorkers who want healthcare decisions to put people first.`,
    frame: "protecting affordable healthcare access",
  },
  "Democracy/voting rights": {
    tone: "civic and urgent without being inflammatory",
    base: `Democracy depends on people being able to vote, be heard, and trust that government works for them.

Our campaign is organizing around voting rights, fair elections, and public leaders who answer to the communities they serve.

Your donation helps us reach voters who care about protecting the basic rules that let every voice count.`,
    frame: "protecting voting rights and fair elections",
  },
  "Climate/resiliency": {
    tone: "future-focused and local",
    base: `New Yorkers are already seeing stronger storms, hotter summers, and flooding that puts homes, transit, and neighborhoods at risk.

Our campaign is focused on practical climate action: safer infrastructure, cleaner air, and communities that can recover when severe weather hits.

A donation helps us talk with voters about protecting the places we live now and the future we leave behind.`,
    frame: "building safer climate-ready communities",
  },
  "Public transit/infrastructure": {
    tone: "local and problem-solving",
    base: `Reliable transit and strong infrastructure shape daily life. People need trains, buses, roads, bridges, and sidewalks that are safe and dependable.

Our campaign is focused on investments that help people get to work, school, healthcare, and family without wasting hours or risking safety.

Your donation helps us reach voters with a practical plan for public systems that serve every neighborhood.`,
    frame: "better transit and stronger infrastructure",
  },
  "Reproductive rights": {
    tone: "values-based and direct",
    base: `People should be able to make private healthcare decisions without politicians standing in the way.

Our campaign is organizing to protect reproductive freedom, defend access to care, and support leaders who trust people to make decisions about their own lives.

A donation today helps us reach voters who believe basic rights must be protected before they are threatened.`,
    frame: "protecting reproductive freedom",
  },
};

const variantTypes = [
  "SMS",
  "Fundraising email",
  "Volunteer call script",
  "Door knocking script",
  "Younger donor version",
  "High-engagement prior donor version",
];

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

  const content = familyContent[family];

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
        <p className="panel-copy">Tone: {content.tone}</p>
        <div className="base-message">{content.base}</div>
      </section>

      <section className="panel">
        <h2>Retrieved campaign context</h2>
        <div className="context-grid">
          <ContextItem label="Approved issue brief" value={family} />
          <ContextItem label="Approved tone" value={content.tone} />
          <ContextItem label="Channel constraints" value={recommendation.retrieved_context.channel_constraints} />
          <ContextItem label="Prior performance note" value={recommendation.retrieved_context.prior_performance_note} />
        </div>
      </section>

      <section className="panel">
        <h2>LLM-generated variants for review</h2>
        <div className="variant-grid">
          {variantTypes.map((type) => {
            const id = `${family}-${type}`;
            const review = reviews[id] ?? {};
            return (
              <article className="variant-card" key={id}>
                <div className="variant-head">
                  <strong>{type}</strong>
                  <span>{audienceFor(type)}</span>
                </div>
                <div className="generated-message">{renderVariant(type, content.frame)}</div>
                <dl className="variant-meta">
                  <dt>Audience</dt>
                  <dd>{audienceFor(type)}</dd>
                  <dt>Medium</dt>
                  <dd>{type}</dd>
                  <dt>Length</dt>
                  <dd>{lengthFor(type)}</dd>
                  <dt>Reason for adaptation</dt>
                  <dd>{reasonFor(type)}</dd>
                </dl>
                <div className="review-actions">
                  <button className="approve-button" onClick={() => setDecision(id, "approved")} type="button">
                    Approve
                  </button>
                  <button className="reject-button" onClick={() => setDecision(id, "revise")} type="button">
                    Revise
                  </button>
                </div>
                {review.decision && <small>Status: {review.decision}</small>}
                {review.decision === "revise" && (
                  <div className="replacement-box">
                    <label htmlFor={`replacement-${id}`}>Write revised message</label>
                    <textarea
                      id={`replacement-${id}`}
                      onChange={(event) => setReplacement(id, event.target.value)}
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

function renderVariant(type, frame) {
  if (type === "SMS") return `We are organizing around ${frame}. Can you chip in today to help us reach more New Yorkers?`;
  if (type === "Fundraising email") {
    return `Our campaign is focused on ${frame}. Your donation helps us reach voters with a clear, practical message before the next outreach push.`;
  }
  if (type === "Volunteer call script") {
    return `Hi, this is the campaign calling. We are reaching voters about ${frame}. Is this an issue you care about, and would you consider making a small donation today?`;
  }
  if (type === "Door knocking script") {
    return (
      <div>
        <strong>4 questions</strong>
        <ol>
          <li>What issue feels most urgent in your neighborhood right now?</li>
          <li>How has this issue affected your family or daily life?</li>
          <li>What would you want elected leaders to do first?</li>
          <li>Would you like information about supporting the campaign?</li>
        </ol>
        <strong>3 talking points</strong>
        <ul>
          <li>The campaign is listening first.</li>
          <li>The focus today is {frame}.</li>
          <li>Small donations help reach more voters.</li>
        </ul>
        <strong>Canvasser guidance</strong>
        <p>Ask before making a donation request. Keep the conversation local and respectful.</p>
      </div>
    );
  }
  if (type === "Younger donor version") return `This campaign is about the future we are going to live in. If ${frame} matters to you, a small donation helps us reach people your age.`;
  return `You have supported us before. Another donation today would help us keep organizing around ${frame} while the race is still moving.`;
}

function audienceFor(type) {
  if (type === "Younger donor version") return "Younger donor";
  if (type === "High-engagement prior donor version") return "High-engagement prior donor";
  if (type === "Door knocking script") return "In-person voter conversation";
  if (type === "Volunteer call script") return "Phone outreach";
  return "General supporter audience";
}

function lengthFor(type) {
  if (type === "SMS") return "Very short";
  if (type === "Door knocking script") return "Structured script";
  if (type === "Fundraising email") return "Medium";
  return "Short";
}

function reasonFor(type) {
  if (type === "Door knocking script") return "Door conversations should start with questions, not a hard donation ask.";
  if (type === "SMS") return "SMS needs a short ask that is easy to read quickly.";
  if (type === "Fundraising email") return "Email can carry more context and a clearer donation rationale.";
  if (type === "Younger donor version") return "Younger donors often respond to future-oriented stakes and low-friction asks.";
  if (type === "High-engagement prior donor version") return "Prior donors can receive a more direct reminder because they already know the campaign.";
  return "Call scripts need a conversational opening and a clear next step.";
}
