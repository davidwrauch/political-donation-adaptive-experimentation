import React from "react";

const designItems = [
  ["Audience data needed", "Mail ballot request data, county, district, support score, turnout score, contactability, prior contacts, preferred channel, and fatigue/exposure history."],
  ["Interventions needed", "Approved ballot-chase options such as SMS reminder, volunteer call, door knock, candidate call, email reminder, and suppress / do not contact."],
  ["Strategies compared", "Control / holdout, static randomized test, and the LinUCB adaptive strategy."],
  ["Outcomes tracked", "Primary: estimated additional returned ballots. Secondary: ballot return rate, average uplift, contact fatigue risk, and traffic allocation."],
  ["Human review", "Campaign staff approve reminder templates, contact caps, suppression rules, and rollout choices before outreach is executed."],
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
  "A warehouse combines voter file, mail ballot, contact, geography, support, turnout, and engagement history.",
  "Allocation models compare intervention performance across counties, districts, and voter segments.",
  "The system exports reviewed voter ID, intervention, channel, urgency, and cadence recommendations through CSVs or APIs.",
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
          LinUCB adaptive strategy that updates allocation as ballot-return outcomes arrive. Stronger strategies receive
          more traffic, but exploration remains so the campaign does not overreact to early noise or miss smaller-segment
          effects.
        </p>
        <p>
          Control / holdout uses generic non-personalized ballot-return reminders. Static randomized test splits
          contacts across approved intervention/channel combinations but does not adapt allocation based on results.
          LinUCB uses voter context to adapt intervention and channel allocation while keeping the comparison transparent.
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
