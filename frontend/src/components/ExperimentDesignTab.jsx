import React from "react";

const designItems = [
  ["Audience data needed", "Supporter history, donation behavior, engagement, geography, issue affinity, channel availability, and fatigue/exposure history."],
  ["Message arms needed", "Approved donation frames such as affordability, democracy protection, accountability, local investment, economic fairness, and campaign momentum."],
  ["Strategies compared", "Control / holdout, static randomized test, and the LinUCB adaptive strategy."],
  ["Outcomes tracked", "Primary: net donation value per contact. Secondary: donation conversion rate, average donation amount, fatigue risk, and exploration behavior."],
  ["Human review", "Campaign staff approve message templates, generated variants, fatigue caps, and rollout choices before outreach is executed."],
];

const operationalSteps = [
  "Vendor platforms",
  "Warehouse",
  "Experimentation models",
  "Allocation engine",
  "Reviewed recommendations",
  "Vendor execution",
];

const operationalDetails = [
  "Outreach vendors send interaction data back through APIs or batch uploads.",
  "A warehouse combines demographic, behavioral, donation, and engagement history.",
  "Allocation models compare strategy performance across supporter segments.",
  "The system exports reviewed supporter ID, message variant, channel, and cadence recommendations through CSVs or APIs.",
  "Human review and campaign approval remain part of the workflow.",
];

const rethinkingOutreachCopy = `Modern campaigns already segment voters and tailor outreach, but many still rely heavily on polling snapshots, preplanned messaging calendars, and scripts that barely change once the campaign begins. This demo explores whether campaigns can become more responsive to real voter behavior instead of relying entirely on polling, scripted messaging, and static media strategies.

Adaptive experimentation allows campaigns to learn while outreach is still running. Instead of waiting until after Election Day to understand what worked, the system continuously updates allocation based on observed behavior, message response, fatigue risk, changing issue salience, and real-world feedback from voters themselves.

The idea is not to replace organizers or human judgment. In fact, many voters increasingly respond to campaigns that sound more honest, adaptive, and genuinely responsive to local concerns rather than overly focus-grouped national scripts. The goal is to create faster feedback loops so strategy can evolve alongside the people campaigns are actually trying to reach.`;

export default function ExperimentDesignTab() {
  return (
    <div className="tab-panel experiment-design-compact">
      <section className="panel">
        <h2>How the experiment runs</h2>
        <p>
          The campaign starts with Control / holdout and a static randomized benchmark, then compares them against a
          LinUCB adaptive strategy that updates allocation as new donation outcomes arrive. Stronger strategies receive
          more traffic, but exploration remains so the campaign does not overreact to early noise or miss smaller-segment
          effects.
        </p>
        <p>
          Control / holdout uses generic non-personalized outreach with fixed messaging. Static randomized test splits
          contacts across approved message/channel combinations but does not adapt allocation based on results. LinUCB
          uses supporter context to adapt message and channel allocation while keeping the comparison transparent.
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
        <ul className="question-list compact-list">
          {operationalDetails.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </section>

      <section className="editorial-briefing">
        <h2>Why campaigns are rethinking outreach</h2>
        <div className="base-message">{rethinkingOutreachCopy}</div>
      </section>
    </div>
  );
}
