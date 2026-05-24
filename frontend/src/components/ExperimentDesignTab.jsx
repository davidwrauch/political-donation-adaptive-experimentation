import React from "react";

const designItems = [
  ["Audience data needed", "Supporter history, donation behavior, engagement, geography, issue affinity, channel availability, and fatigue/exposure history."],
  ["Message arms needed", "A small set of approved donation frames: affordability, democracy protection, accountability, local investment, economic fairness, and campaign momentum."],
  ["Experimentation strategies compared", "Control, static randomized test, Thompson sampling, LinUCB, and contextual bandit with fatigue guardrail."],
  ["Channels needed", "Email, SMS, phone, and digital ads, with real eligibility constraints and opt-out rules."],
  ["Outcome definitions", "Primary: net donation value per contact. Secondary: donation conversion rate, average donation amount, fatigue risk, and exploration rate."],
  ["Randomization / assignment logic", "Compare fixed equal-split assignment against adaptive strategies that learn by batch while preserving exploration."],
  ["Sample size caveat", "Do not overreact to early noisy results. Treat small cells as directional until more batches arrive."],
  ["Fatigue guardrails", "Cap repeated contacts, monitor high-fatigue segments, and reduce SMS/phone exposure when risk rises."],
  ["Human approval process", "All message templates and generated variants require campaign review before use."],
  ["What the system supports", "Comparing allocation strategies and showing how they affect conversion, value, exploration, and fatigue."],
  ["What it should not automate", "It should not send messages, replace compliance review, or maximize donations at all costs."],
];

const leadershipQuestions = [
  "What are we optimizing: net donation value, conversion rate, donor retention, or long-term engagement?",
  "Which channels are actually available?",
  "What audience segments or districts matter most?",
  "What historical outreach data exists?",
  "What ethical or legal constraints apply?",
  "How much exploration is acceptable?",
];

const operationalSteps = [
  "Vendor platforms",
  "Warehouse",
  "Experimentation models",
  "Allocation engine",
  "Reviewed outreach recommendations",
  "Vendor execution",
];

const operationalDetails = [
  "Outreach vendors/platforms send campaign interaction data back through APIs or batch uploads.",
  "Data flows into a centralized warehouse containing demographic, behavioral, donation, and engagement history.",
  "Allocation models evaluate message/channel performance across supporter segments.",
  "The system generates updated outreach recommendations including supporter ID, message variant, delivery channel, and cadence/frequency guidance.",
  "Recommended assignments are exported back to campaign vendors/tools through CSVs or APIs for execution.",
  "Human review and campaign approval remain part of the workflow.",
];

const rethinkingOutreachCopy = `Modern campaigns already segment voters and tailor outreach, but many still rely heavily on polling snapshots, preplanned messaging calendars, and scripts that barely change once the campaign begins. This demo explores whether campaigns can become more responsive to real voter behavior instead of relying entirely on polling, scripted messaging, and static media strategies.

Adaptive experimentation allows campaigns to learn while outreach is still running. Instead of waiting until after Election Day to understand what worked, the system continuously updates allocation based on observed behavior, message response, fatigue risk, changing issue salience, and real-world feedback from voters themselves.

The idea is not to replace organizers or human judgment. In fact, many voters increasingly respond to campaigns that sound more honest, adaptive, and genuinely responsive to local concerns rather than overly focus-grouped national scripts. The goal is to create faster feedback loops so strategy can evolve alongside the people campaigns are actually trying to reach.`;

const futureInputs = [
  "Social listening APIs",
  "Google News trend signals",
  "Issue salience tracking",
  "Fundraising response shifts after major events",
  "Earned media sentiment",
  "Regional issue spikes",
];

export default function ExperimentDesignTab() {
  return (
    <div className="tab-panel">
      <section className="panel">
        <h2>What adaptive experimentation means</h2>
        <p>
          Instead of assigning every contact evenly forever, adaptive experimentation updates allocation as evidence
          comes in. Stronger-performing strategies receive more traffic, but some exploration remains so the campaign
          does not overreact to early noise or miss better options for smaller segments.
        </p>
        <p>
          Adaptive allocation does not split traffic evenly forever. It gradually shifts more contacts to stronger
          strategies while preserving some exploration so the campaign does not prematurely discard an option that
          might work for a smaller segment.
        </p>
      </section>

      <section className="panel">
        <h2>How the static randomized baseline is comparable</h2>
        <p>
          The static randomized baseline gives every approved arm a fixed share of contacts. The adaptive methods are
          compared against it using the same simulated campaign population and outcomes.
        </p>
        <p>
          Control uses generic non-personalized outreach with fixed messaging. Static randomized test randomly splits
          traffic across approved message/channel combinations, but does not adapt allocation based on results.
        </p>
      </section>

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
        <h2>How this would work operationally</h2>
        <p>
          In a real campaign, this dashboard would sit between outreach systems, the campaign data warehouse, and
          reviewed recommendations that staff approve before execution.
        </p>
        <div className="flow-row" aria-label="Operational architecture flow">
          {operationalSteps.map((step, index) => (
            <React.Fragment key={step}>
              <span>{step}</span>
              {index < operationalSteps.length - 1 && <b aria-hidden="true">-&gt;</b>}
            </React.Fragment>
          ))}
        </div>
        <ul className="question-list">
          {operationalDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </section>

      <section className="editorial-briefing">
        <h2>Why campaigns are rethinking outreach</h2>
        <div className="base-message">{rethinkingOutreachCopy}</div>
      </section>

      <section className="panel">
        <h2>Potential future inputs</h2>
        <p>
          These signals could strengthen operational awareness later, but they are not core model inputs in this
          lightweight prototype.
        </p>
        <p>
          <strong>Social listening extension:</strong> Future versions could incorporate social listening, news trend
          signals, issue salience, earned media sentiment, and regional spikes to inform which message families deserve
          more exploration.
        </p>
        <div className="guardrail-grid">
          {futureInputs.map((item) => (
            <span key={item}>{item}</span>
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
