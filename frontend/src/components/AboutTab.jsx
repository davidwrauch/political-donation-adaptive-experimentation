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
          <h3>Inspired by adaptive campaign systems</h3>
          <p>
            Inspired by adaptive experimentation systems, political targeting workflows, and contextual bandit research.
          </p>
        </article>
        <article className="panel">
          <h3>Inspired by charitable-giving bandits</h3>
          <p>
            Inspired by Stanford charitable-giving contextual bandit research where different
            donation appeals are assigned to profiles and the system learns which messages work best.
          </p>
          <a href="https://arxiv.org/abs/2211.12004" target="_blank" rel="noreferrer">
            Stanford charitable-giving contextual bandit paper
          </a>
        </article>
        <article className="panel">
          <h3>Transparent and human-reviewed</h3>
          <p>
            The AI Message Review tab is deterministic template-based synthesis. It does not call external LLM APIs
            and does not autonomously generate or deploy persuasion content.
          </p>
        </article>
        <article className="panel">
          <h3>What this is not</h3>
          <p>
            This is not an election prediction model, a production campaign platform, or an
            autonomous persuasion system. It is a portfolio simulation for explaining adaptive
            experimentation and campaign resource allocation while monitoring uncertainty and fatigue.
          </p>
        </article>
      </section>

      <section className="panel">
        <h2>Architecture</h2>
        <p>This prototype combines:</p>
        <ul className="plain-list">
          <li>Multi-armed bandit allocation for experiment traffic shifting</li>
          <li>Contextual personalization features for supporter-level assignment</li>
          <li>Human-reviewed AI-assisted message adaptation</li>
          <li>Fatigue-aware outreach constraints</li>
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
            "Approved message templates only",
            "Fatigue and exposure caps",
            "Avoid overreacting to noisy early results",
            "Preserve some exploration",
            "Do not maximize donations at all costs",
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
          GitHub: davidwrauch/political-donation-adaptive-experimentation
        </a>
      </section>
    </div>
  );
}
