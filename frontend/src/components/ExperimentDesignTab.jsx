import React from "react";

const designItems = [
  ["Audience data needed", "Supporter history, donation behavior, engagement, geography, issue affinity, channel availability, and fatigue/exposure history."],
  ["Message arms needed", "A small set of approved donation frames: affordability, democracy protection, accountability, local investment, economic fairness, and campaign momentum."],
  ["Experimentation strategies compared", "Static A/B test, Thompson sampling, LinUCB, and contextual bandit with fatigue guardrail."],
  ["Channels needed", "Email, SMS, phone, and digital ads, with real eligibility constraints and opt-out rules."],
  ["Outcome definitions", "Primary: donation conversion. Secondary: expected donation amount, net expected value, channel response, fatigue risk, and segment lift."],
  ["Randomization / assignment logic", "Compare fixed equal-split assignment against adaptive strategies that learn by batch while preserving exploration."],
  ["Sample size caveat", "Do not overreact to early noisy results. Treat small cells as directional until more batches arrive."],
  ["Fatigue guardrails", "Cap repeated contacts, monitor high-fatigue segments, and reduce SMS/phone exposure when risk rises."],
  ["Human approval process", "All message templates and generated variants require campaign review before use."],
  ["What the system supports", "Comparing allocation strategies and showing how they affect conversion, value, exploration, and fatigue."],
  ["What it should not automate", "It should not send messages, replace compliance review, or maximize donations at all costs."],
];

const leadershipQuestions = [
  "What are we optimizing: donations, turnout, volunteer signups, persuasion, or long-term engagement?",
  "Which channels are actually available?",
  "What audience segments or districts matter most?",
  "What historical outreach data exists?",
  "What ethical or legal constraints apply?",
  "How much exploration is acceptable?",
];

export default function ExperimentDesignTab() {
  return (
    <div className="tab-panel">
      <section className="panel">
        <h2>How we would actually run this</h2>
        <p>
          Keep the experiment narrow, measurable, and reviewable. Leadership should know what is
          being optimized, what channels are available, and where fatigue or compliance constraints apply.
        </p>
        <div className="design-grid">
          {designItems.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <p>{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Questions for Campaign Leadership</h2>
        <ul className="question-list">
          {leadershipQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
