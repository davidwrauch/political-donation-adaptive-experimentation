import React from "react";

export default function AboutTab() {
  return (
    <div className="tab-panel">
      <section className="panel about">
        <h2>About this prototype</h2>
        <p>
          An adaptive experimentation prototype for ballot chase and turnout intervention programs.
          The system simulates how campaigns can prioritize voters who requested mail ballots but have not yet
          returned them, then recommend the reminder, channel, and cadence most likely to move a returned ballot.
        </p>
      </section>

      <section className="methodology-note">
        <div>
          <h3>Research grounding</h3>
          <p>
            This prototype is grounded in contextual bandits, adaptive experimentation, OPE-style offline policy
            simulation, and human oversight with guardrails. The research white paper explains why this approach is
            useful, what assumptions it requires, and why it should be read as decision support rather than causal proof.
          </p>
        </div>
        <div className="methodology-actions">
          <a href="https://docs.google.com/document/d/1FY-S6agsHNKv1Y4vivfYlge8rKT1Ii9I/edit?usp=sharing&ouid=106737948019924007884&rtpof=true&sd=true" target="_blank" rel="noreferrer">
            Open research white paper
          </a>
        </div>
      </section>

      <section className="about-grid">
        <article className="panel">
          <h3>Inspired by adaptive campaign systems</h3>
          <p>
            Inspired by adaptive experimentation systems, political targeting workflows, and contextual bandit research.
          </p>
        </article>
        <article className="panel">
          <h3>Inspired by contextual bandit decision systems</h3>
          <p>
            Inspired by contextual bandit research where different interventions are assigned to profiles and the
            system learns which actions work best for which people under limited outreach capacity.
          </p>
          <a href="https://arxiv.org/abs/2211.12004" target="_blank" rel="noreferrer">
            Stanford charitable-giving contextual bandit paper
          </a>
        </article>
        <article className="panel">
          <h3>Transparent and human-reviewed</h3>
          <p>
            The AI Message Review tab is deterministic template-based synthesis. It does not call external LLM APIs
            and does not autonomously generate or deploy ballot-chase content.
          </p>
        </article>
        <article className="panel">
          <h3>What this is not</h3>
          <p>
            This is not an election prediction model, a production campaign platform, or an
            autonomous persuasion system. It is a portfolio simulation for explaining adaptive
            experimentation and turnout resource allocation while monitoring uncertainty and contact fatigue.
          </p>
        </article>
      </section>

      <section className="panel">
        <h2>Architecture</h2>
        <p>This prototype combines:</p>
        <ul className="plain-list">
          <li>Multi-armed bandit allocation for ballot-chase traffic shifting</li>
          <li>Contextual personalization features for voter-level assignment</li>
          <li>Human-reviewed reminder and intervention review</li>
          <li>Fatigue-aware contact constraints</li>
        </ul>
        <p>
          The allocation system dynamically shifts more traffic toward stronger-performing strategies while preserving
          exploration and preventing premature lock-in.
        </p>
      </section>

      <section className="panel">
        <h2>Simple guardrails</h2>
        <div className="guardrail-grid">
          {[
            "Human review required",
            "Approved reminder templates only",
            "Fatigue and exposure caps",
            "Avoid overreacting to noisy early results",
            "Preserve some exploration",
            "Do not chase every outstanding ballot at all costs",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="panel built-by">
        <h2>Built by</h2>
        <p>
          <strong>David Rauch</strong> - Product-focused data scientist working on experimentation,
          causal inference, adaptive decision systems, and public-interest technology.
        </p>
        <a href="https://github.com/davidwrauch/political-donation-adaptive-experimentation" target="_blank" rel="noreferrer">
          GitHub: https://github.com/davidwrauch/political-donation-adaptive-experimentation
        </a>
        <a href="https://www.linkedin.com/in/davidwrauch/" target="_blank" rel="noreferrer">
          LinkedIn: https://www.linkedin.com/in/davidwrauch/
        </a>
      </section>
    </div>
  );
}
