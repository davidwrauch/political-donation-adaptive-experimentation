import React from "react";

export default function AboutTab() {
  return (
    <div className="tab-panel">
      <section className="panel about">
        <h2>About this prototype</h2>
        <p>
          An adaptive experimentation prototype for political donation and civic engagement campaigns.
          The system simulates how campaigns can allocate scarce outreach resources across messages,
          audiences, and channels while monitoring donation conversion, expected value, and fatigue risk.
        </p>
      </section>

      <section className="about-grid">
        <article className="panel">
          <h3>Inspired by campaign data science</h3>
          <p>
            Campaign data science is mainly resource allocation and optimization: who should be
            contacted, with which issue frame, through which channel, and with what evidence of impact.
          </p>
        </article>
        <article className="panel">
          <h3>Inspired by charitable-giving bandits</h3>
          <p>
            The donation solicitation setup mirrors contextual bandit research where different
            messages are assigned to profiles and the system learns which appeals perform best.
          </p>
        </article>
        <article className="panel">
          <h3>Transparent and human-reviewed</h3>
          <p>
            The AI tab is deterministic template-based synthesis. It does not call external LLM APIs
            and does not autonomously generate or deploy persuasion content.
          </p>
        </article>
        <article className="panel">
          <h3>What this is not</h3>
          <p>
            This is not an election prediction model, a production campaign platform, or an
            autonomous persuasion system. It is a portfolio simulation for explaining adaptive
            experimentation and campaign resource allocation.
          </p>
        </article>
      </section>
    </div>
  );
}
