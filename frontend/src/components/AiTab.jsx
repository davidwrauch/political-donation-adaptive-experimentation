import React, { useState } from "react";

const messageFamilies = [
  "Affordability / cost of living",
  "Anti-corruption / accountability",
  "Democracy / voting rights",
  "Climate / resiliency",
  "Public transit / infrastructure",
  "Reproductive rights",
];

const familyContent = {
  "Affordability / cost of living": {
    tone: "practical and kitchen-table",
    base: `New York families are doing the math every week. Rent is high. Groceries cost more. A small emergency can turn into a big problem fast.

Our campaign is focused on costs people feel every day: housing, food, child care, transit, and utility bills. We are fighting for leaders who understand what working families are carrying.

Returning your ballot helps make sure working people are counted in decisions about affordability and daily costs.`,
    frame: "making everyday life more affordable",
  },
  "Healthcare access": {
    tone: "calm and care-focused",
    base: `Too many people wait to get care because they are worried about the bill. A doctor visit, medicine, or a hospital charge should not push a family into debt.

Our campaign is speaking up for lower prescription costs, local health services, and care that people can actually reach when they need it.

Returning your ballot helps make sure voters who care about healthcare access are counted before the deadline.`,
    frame: "protecting affordable healthcare access",
  },
  "Anti-corruption / accountability": {
    tone: "clear and accountability-focused",
    base: `People lose faith when powerful interests get special treatment and regular families feel ignored. Government should work in the open and answer to the public.

Our campaign is focused on clean, accountable leadership. That means fighting for honest budgets, fair rules, and leaders who do not forget who sent them there.

Returning your ballot helps make sure voters who care about clean government are counted.`,
    frame: "clean government and public accountability",
  },
  "Democracy / voting rights": {
    tone: "civic and urgent without being inflammatory",
    base: `Voting is how people make their voices count. When voting is harder, government becomes less fair and less connected to the people it serves.

Our campaign is organizing around fair elections, voting access, and public leaders who respect every community's right to be heard.

Returning your ballot helps make democracy stronger by making sure your voice is counted.`,
    frame: "protecting voting rights and fair elections",
  },
  "Climate / resiliency": {
    tone: "future-focused and local",
    base: `New Yorkers know what stronger storms and hotter summers look like. Flooded streets, delayed trains, and damaged homes are not faraway problems.

Our campaign is focused on practical climate action: safer neighborhoods, cleaner air, stronger infrastructure, and faster recovery when severe weather hits.

Returning your ballot helps make sure climate and resiliency concerns are counted locally.`,
    frame: "building safer climate-ready communities",
  },
  "Public transit / infrastructure": {
    tone: "local and problem-solving",
    base: `When transit fails, daily life gets harder. People are late to work, miss appointments, and spend more time just trying to get where they need to go.

Our campaign is focused on reliable trains and buses, safer streets, stronger bridges, and public systems that serve every neighborhood.

Returning your ballot helps make sure transit and infrastructure priorities are counted in this election.`,
    frame: "better transit and stronger infrastructure",
  },
  "Reproductive rights": {
    tone: "values-based and direct",
    base: `Private healthcare decisions should stay with patients, families, and doctors. Politicians should not decide what care someone can receive.

Our campaign is organizing to protect reproductive freedom and defend access to care before rights are weakened or taken away.

Returning your ballot helps make sure reproductive rights voters are counted before the deadline.`,
    frame: "protecting reproductive freedom",
  },
};

const variantTypes = [
  "SMS reminder",
  "Email reminder",
  "Volunteer call script",
  "Door knocking script",
  "Candidate call",
  "Suppress / do not contact note",
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
          A real campaign would repeat this workflow across multiple issue frames, voter segments, counties, and outreach channels.
        </p>
      </section>

      <section className="panel intro-card">
        <h2>AI Ballot Chase Review</h2>
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
        <h2>Staff-written base reminder</h2>
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
        <h2>Generated ballot-chase variants for review</h2>
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
  if (type === "SMS reminder") return `Your mail ballot is still outstanding. If ${frame} matters to you, please return your ballot today or contact us if you need help.`;
  if (type === "Email reminder") {
    return `Our records show your requested mail ballot has not yet been returned.\n\nThis election affects ${frame}. Please return your ballot as soon as possible, and use the official return instructions included with your ballot. If you need help finding a drop-off option or deadline information, our team can help.`;
  }
  if (type === "Volunteer call script") {
    return `Hi, this is the campaign calling with a quick mail ballot reminder. Our records show your ballot was requested but may not have been returned yet. Do you have a plan to return it?\n\nIf they need help: offer deadline and return-option information. If already returned: thank them and mark the record for follow-up cleanup.`;
  }
  if (type === "Door knocking script") {
    return (
      <div>
        <strong>Possible conversation directions</strong>
        <p>Open with a neighborly introduction, then follow the voter's concerns instead of forcing a fixed pitch.</p>
        <strong>Questions that invite reflection</strong>
        <ol>
          <li>What issue feels most urgent in your neighborhood right now?</li>
          <li>How has this issue affected your family or daily life?</li>
          <li>What would you want elected leaders to do first?</li>
          <li>Do you have what you need to return your ballot?</li>
        </ol>
        <strong>Common concerns heard from voters</strong>
        <ul>
          <li>People want practical help, not pressure.</li>
          <li>Many voters connect {frame} to local stress in their own lives.</li>
          <li>Some voters need deadline, postage, signature, or drop-box information.</li>
        </ul>
        <strong>Suggested follow-up</strong>
        <p>If the voter needs help, offer official ballot-return information. Thank them for their time either way, and note whether follow-up is needed.</p>
      </div>
    );
  }
  if (type === "Candidate call") return `This is a short candidate or surrogate call reserved for a high-priority voter: thank them for requesting a ballot, connect the election to ${frame}, and ask whether they have a plan to return it.`;
  return `Do not contact if fatigue risk is high or modeled uplift is low. Preserve capacity for voters more likely to return a ballot because of contact.`;
}

function audienceFor(type) {
  if (type === "Candidate call") return "High-support high-priority voter";
  if (type === "Suppress / do not contact note") return "High fatigue or low-uplift voter";
  if (type === "Door knocking script") return "In-person voter conversation";
  if (type === "Volunteer call script") return "Phone outreach";
  return "Outstanding mail ballot voter";
}

function lengthFor(type) {
  if (type === "SMS reminder") return "Very short";
  if (type === "Door knocking script") return "Structured script";
  if (type === "Fundraising email") return "Medium";
  return "Short";
}

function reasonFor(type) {
  if (type === "Door knocking script") return "Door conversations should stay adaptive, listening-oriented, and grounded in what the voter raises first.";
  if (type === "SMS reminder") return "SMS needs a short practical reminder that is easy to read quickly.";
  if (type === "Email reminder") return "Email can carry more deadline and ballot-return help.";
  if (type === "Candidate call") return "Candidate calls are scarce and should be reserved for high-priority voters where contact may move behavior.";
  if (type === "Suppress / do not contact note") return "Suppression protects voters from over-contact and preserves limited chase capacity.";
  return "Call scripts need a conversational opening and a clear next step.";
}
