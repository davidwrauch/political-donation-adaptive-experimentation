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

Your donation helps us reach more New Yorkers with a simple message: working people deserve a fair shot and a government that takes affordability seriously.`,
    frame: "making everyday life more affordable",
  },
  "Healthcare access": {
    tone: "calm and care-focused",
    base: `Too many people wait to get care because they are worried about the bill. A doctor visit, medicine, or a hospital charge should not push a family into debt.

Our campaign is speaking up for lower prescription costs, local health services, and care that people can actually reach when they need it.

A donation today helps us talk with voters who believe healthcare should put people first, not paperwork, profits, or politics.`,
    frame: "protecting affordable healthcare access",
  },
  "Anti-corruption / accountability": {
    tone: "clear and accountability-focused",
    base: `People lose faith when powerful interests get special treatment and regular families feel ignored. Government should work in the open and answer to the public.

Our campaign is focused on clean, accountable leadership. That means fighting for honest budgets, fair rules, and leaders who do not forget who sent them there.

Your donation helps us reach voters who want a campaign that is people-powered, transparent, and not bought by the loudest special interests.`,
    frame: "clean government and public accountability",
  },
  "Democracy / voting rights": {
    tone: "civic and urgent without being inflammatory",
    base: `Voting is how people make their voices count. When voting is harder, government becomes less fair and less connected to the people it serves.

Our campaign is organizing around fair elections, voting access, and public leaders who respect every community's right to be heard.

Your donation helps us reach voters who believe democracy is strongest when more people participate, not fewer.`,
    frame: "protecting voting rights and fair elections",
  },
  "Climate / resiliency": {
    tone: "future-focused and local",
    base: `New Yorkers know what stronger storms and hotter summers look like. Flooded streets, delayed trains, and damaged homes are not faraway problems.

Our campaign is focused on practical climate action: safer neighborhoods, cleaner air, stronger infrastructure, and faster recovery when severe weather hits.

A donation helps us reach voters who want climate plans that protect families today and prepare communities for tomorrow.`,
    frame: "building safer climate-ready communities",
  },
  "Public transit / infrastructure": {
    tone: "local and problem-solving",
    base: `When transit fails, daily life gets harder. People are late to work, miss appointments, and spend more time just trying to get where they need to go.

Our campaign is focused on reliable trains and buses, safer streets, stronger bridges, and public systems that serve every neighborhood.

Your donation helps us talk with voters about the basic infrastructure that makes opportunity possible: getting to work, school, healthcare, and home safely.`,
    frame: "better transit and stronger infrastructure",
  },
  "Reproductive rights": {
    tone: "values-based and direct",
    base: `Private healthcare decisions should stay with patients, families, and doctors. Politicians should not decide what care someone can receive.

Our campaign is organizing to protect reproductive freedom and defend access to care before rights are weakened or taken away.

A donation today helps us reach voters who believe personal freedom and basic healthcare rights deserve strong public defense.`,
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
    return `Our campaign is focused on ${frame}. Your donation helps us reach voters with a clear, practical message before the next outreach push.\n\nThis is how we turn one approved issue frame into real voter conversations. If you can, please make a donation today.`;
  }
  if (type === "Volunteer call script") {
    return `Hi, this is the campaign calling. We are reaching supporters about ${frame}. Is this an issue you care about?\n\nIf yes: Thank you. We are asking supporters to help fund the next round of voter outreach. Would you consider a small donation today?`;
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
          <li>Would you like information about supporting the campaign?</li>
        </ol>
        <strong>Common concerns heard from voters</strong>
        <ul>
          <li>People want to feel heard before they are asked for money.</li>
          <li>Many voters connect {frame} to local stress in their own lives.</li>
          <li>Some supporters want a clear explanation of how donations expand outreach.</li>
        </ul>
        <strong>Suggested follow-up</strong>
        <p>If the voter is interested, offer a donation link or follow-up card. Thank them for their time either way, and note which concern shaped the conversation.</p>
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
  if (type === "Door knocking script") return "Door conversations should stay adaptive, listening-oriented, and grounded in what the voter raises first.";
  if (type === "SMS") return "SMS needs a short ask that is easy to read quickly.";
  if (type === "Fundraising email") return "Email can carry more context and a clearer donation rationale.";
  if (type === "Younger donor version") return "Younger donors often respond to future-oriented stakes and low-friction asks.";
  if (type === "High-engagement prior donor version") return "Prior donors can receive a more direct reminder because they already know the campaign.";
  return "Call scripts need a conversational opening and a clear next step.";
}
