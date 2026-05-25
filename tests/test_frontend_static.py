from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_four_tabs_and_campaign_loading_language():
    app = read("frontend/src/App.jsx")

    for tab in ["Overview", "Experiment Design", "What If", "AI Message Review", "About"]:
        assert tab in app
    assert "OverviewTab overview={overview}" in app
    assert "WhatIfTab apiBase={API_BASE}" in app
    assert "Net donation value per contact" in app
    assert "Primary metric help" in app
    assert "Average expected dollars raised per person contacted after accounting for donation conversion rate" in app
    assert "This is the primary optimization metric used to compare" in app
    assert "Secondary metrics: donation conversion rate, average donation amount, fatigue risk, and exploration rate." in app
    assert "p-value" not in app
    assert "This live demo compresses a longer campaign experiment into a short simulation" in app
    assert "Loading simulated campaign results, usually 10-15 seconds" in app
    assert "Live data ready" in app
    assert "Project briefing" in app
    assert "This live demo explores how adaptive experimentation could reshape political fundraising." in app
    assert "Instead of relying only on polling, fixed scripts, and preplanned messaging calendars" in app
    assert "Companies like Google, Spotify, Netflix, Amazon, and Meta" in app
    assert "<strong>12.5% lift</strong>" in app
    assert "<strong>25%+ improvement</strong>" in app
    assert "<strong>13.62% higher engagement</strong>" in app
    assert "20.79% improvement" not in app
    assert "onClick={() => setShowBriefing(false)}" in app
    assert "onClick={(event) => event.stopPropagation()}" in app
    assert "Research grounding" not in app
    assert "https://arxiv.org/abs/2211.12004" not in app
    assert "https://www.braze.com/resources/articles/multi-armed-bandit-vs-ab-testing" not in app


def test_app_fetches_actual_fastapi_routes_and_reports_failed_url():
    app = read("frontend/src/App.jsx")

    assert "`${API_BASE}/api/overview`" in app
    assert "`${API_BASE}/api/ai/recommendation`" in app
    assert "fetchJson(overviewUrl" in app
    assert "fetchJson(aiRecommendationUrl" in app
    assert "Unable to load ${label} from ${url}" in app


def test_what_if_tab_contains_policy_simulator_controls_and_caveats():
    app = read("frontend/src/App.jsx")
    what_if = read("frontend/src/components/WhatIfTab.jsx")
    styles = read("frontend/src/styles.css")
    main = read("backend/app/main.py")

    assert "What If" in app
    assert "/api/policy-simulator" in what_if
    assert "/api/policy-simulator" in main
    for text in [
        "What If?",
        "Test how different campaign priorities would change the system's recommendations.",
        "Use this as a strategy mixing board",
        "Offline estimate, not proof.",
        "This uses the simulated campaign log to estimate what might have happened under different priorities.",
        "Default settings match the current logged policy.",
        "The default policy reflects the current reward settings used by the simulated adaptive campaign",
        "Current policy",
        "Adjusted policy",
        "$0.00",
        "Change vs current policy",
        "What this means",
        "Current policy",
        "Prioritize big donations",
        "Prioritize small donations",
        "More positive campaign",
        "Balance donations + volunteers",
        "Prioritize volunteering",
        "Donation value",
        "Conversion",
        "Volunteer conversion",
        "Trust/positive tone",
        "Fatigue guardrail",
        "Local/community",
        "Learning/diversity",
        "Hover over each control to see what it changes.",
        "Some strategies raise dollars per contact.",
        "Turning every knob up does not mean every outcome improves",
        "Contextual bandits (adaptive experimentation) do not decide what \"good\" means on their own.",
        "donations, volunteering, trust, fatigue, and audience coverage.",
        "Projected campaign impact",
        "Projected volunteer signups",
        "Estimated additional volunteer actions across the selected audience size based on the volunteer conversion change.",
        "Estimated difference if this policy had been used across the selected outreach volume.",
        "Research grounding",
        "This prototype is grounded in contextual bandits, adaptive experimentation, and OPE-style offline policy",
        "research white paper explains why this approach is useful",
        "View research white paper",
        "Download white paper",
        "#view=FitH",
        "/adaptive-experimentation-methodology.pdf",
        "Why this works",
        "evaluation. It is not perfect causal proof",
        "Reliable demo estimate",
        "Reliable demo estimate? ${reliabilityNeedsMore ? \"No\" : \"Yes\"}",
        "formatImpactMoney(projectedImpact)",
        "summary-secondary",
    ]:
        assert text in what_if
    for removed in [
        "Estimated net value per contact under adjusted policy",
        "High-dollar donors",
        "Contact-risk penalty",
        "Urgency/negative penalty",
        "Exploration diversity",
        "Audience diversity",
        "Local/community focus",
        "Optimize net value",
        "Long-term trust",
        "Learn aggressively",
        "Overlap and reliability",
        "Top affected audience segment",
    ]:
        assert removed not in what_if
    for metric in [
        "Net value/contact",
        "Donation conversion",
        "Volunteer conversion",
        "Fatigue",
        "Diversity",
    ]:
        assert metric in what_if
    assert '<section className="what-if-metrics compact">' not in what_if
    assert "impact-row" in what_if
    for style in [
        "what-if-hero",
        "what-if-hero-left",
        "what-if-hero-right",
        "compact-policy-grid",
        "strategy-console",
        "strategy-knob",
        "preset-row",
        "impact-row",
        "methodology-note",
    ]:
        assert style in styles
    assert "flex-wrap: wrap" in styles
    assert "overflow-x: auto" not in styles
    assert "grid-template-columns: repeat(4, minmax(0, 1fr))" in styles
    assert "height: 80vh" in styles


def test_overview_contains_leadership_metrics_and_charts():
    overview = read("frontend/src/components/OverviewTab.jsx")
    simulation = read("backend/app/services/simulation.py")

    for text in [
        "A New York Democratic campaign is testing donation outreach",
        "The simulation updates quickly so",
        "the tradeoff between learning and scaling is visible during a short demo.",
        "Current experiment status",
        "How reliable is the current winner?",
        "Campaign-wide experiment status",
        "Current leading strategy performance",
        "Metrics below refer only to the current leading strategy",
        "Current leading strategy",
        "Adaptive lift vs control",
        "Net donation value per contact",
        "Average donation amount",
        "Total contacts observed",
        "Contacts assigned to this strategy",
        "Probability best",
        "Additional contacts before high-confidence rollout",
        "Rollout confidence status",
        "Statistically significant?",
        "Yes",
        "Not yet",
        "Traditional statistical significance asks whether the observed winner",
        "This prototype also uses probability-best",
        "Do not send 100% of traffic to the current winner unless confidence is high.",
        "High confidence generally means",
        "the leading strategy has remained stable",
        "Traditional statistical significance can still be reported in a real",
        "Probability best estimates how likely the current leading strategy is to outperform the others",
        "Average dollars raised per person contacted, after combining conversion rate, average donation amount, and fatigue penalty.",
        "Directional only means the current leader is promising",
        "Pause updates",
        "Resume updates",
        "Last updated",
        "Next update in",
        "Live simulation running",
        "Simulation paused",
        "Simulation complete",
        "Updates paused",
        "Replay simulation",
        "Allocation status",
        "Current leader",
        "Donation conversion rate",
        "Fatigue risk",
        "Estimated risk that repeated outreach reduces future response or causes opt-outs.",
        "strategyGroupLabel",
        "strategyGroupClass",
        "allocationStatusClass",
        "allocation-box",
        "strategy-group-label",
        "Static benchmark",
        "Adaptive strategy",
        "Net donation value per contact over time by allocation strategy",
        "X-axis: dates. Y-axis: net donation value per contact. Line thickness reflects current traffic allocation share.",
        "Thicker lines indicate higher traffic allocation as the experiment shifts outreach toward stronger-performing strategies.",
        "ticks = [0, 2, 4, 6, 8, 10, 12]",
        "Traffic share",
        "Fast forward to winner",
        "Simulation progress:",
        "Winner locked in",
        "Net value/contact:",
        "Traffic allocation:",
        "Probability best:",
        "function lineWidth",
        "rotate(-38)",
        "x-axis-label",
        "const height = 316",
    ]:
        assert text in overview
    for strategy in [
        "Control",
        "Static randomized test",
        "Thompson sampling",
        "LinUCB",
    ]:
        assert strategy in simulation

    assert "<polyline" in overview
    assert "leader-card" in overview
    assert "strokeWidth={lineWidth(trafficByStrategy[item.id] ?? 0, hoveredId === item.id)}" in overview
    assert "setIsolatedId" in overview
    assert "setVisibleIndex" in overview
    assert "setNextUpdateIn" in overview
    assert "window.setInterval" in overview
    assert "}, 5000)" in overview
    assert "setNextUpdateIn(5)" in overview
    assert "confidence-highlight" in overview
    assert "reliability-note" in overview
    assert "live-status" in overview
    assert "chart-tooltip" in overview
    assert "tooltip-popover" in overview
    assert "getBoundingClientRect" in overview
    assert "window.addEventListener(\"resize\"" in overview
    assert "window.addEventListener(\"scroll\"" in overview
    assert "formatMoneyNoDecimals(tick)" in overview
    assert "strategy_rate_timeline" in overview
    assert "traffic_allocation_timeline" in overview
    assert "formatAxisDate(row.experiment_date)" in overview
    assert "strategy_performance" in overview
    assert "message_allocation_shift" not in overview
    assert "Traffic allocation over time" not in overview
    assert "Overall donation conversion rate by strategy" not in overview
    assert "Net donation value per contact by strategy" not in overview
    assert "Fatigue risk by strategy" not in overview
    assert "Message-frame performance within the current leading strategy" not in overview
    assert "Message allocation within the current leading strategy" not in overview
    assert "Contextual bandit with fatigue guardrail" not in overview
    assert "guarded_contextual_bandit" not in overview
    assert "Cumulative donation conversions by allocation strategy" not in overview
    assert "Campaign readout" not in overview
    assert "Leading adaptive method" not in overview
    assert "Leading metric" not in overview
    assert "Winning strategy traffic share" not in overview
    assert 'label="Exploration rate"' not in overview
    assert 'label="Contacts observed"' not in overview
    assert "Frequentist check" not in overview
    assert "p-value" not in overview
    assert "winning message" not in overview.lower()


def test_experiment_design_is_practical_and_guardrailed():
    design = read("frontend/src/components/ExperimentDesignTab.jsx")

    for text in [
        "How the experiment runs",
        "How this would work operationally",
        "Why campaigns are rethinking outreach",
        "Modern campaigns already segment voters and tailor outreach",
        "Adaptive experimentation allows campaigns to learn while outreach is still running.",
        "The idea is not to replace organizers or human judgment.",
        "The goal is to create faster feedback loops so strategy can evolve alongside the people campaigns are actually trying to reach.",
        "editorial-briefing",
        "Vendor platforms",
        "Warehouse",
        "Experimentation models",
        "Allocation engine",
        "Reviewed recommendations",
        "Vendor execution",
        "The campaign starts with Control and a static randomized benchmark",
        "Control uses generic non-personalized outreach",
        "does not adapt allocation based on results",
        "Audience data needed",
        "Message arms needed",
        "Strategies compared",
        "Outcomes tracked",
        "Human review",
    ]:
        assert text in design
    assert "supporter ID" in design
    assert "CSVs or APIs" in design
    assert "Questions for Campaign Leadership" not in design
    assert "Potential future inputs" not in design


def test_ai_tab_is_campaign_synthesis_not_autonomous_persuasion():
    ai = read("frontend/src/components/AiTab.jsx")
    synthesis = read("backend/app/services/ai_synthesis.py")

    for text in [
        "AI Message Review",
        "Staff-written base message",
        "Retrieved campaign context",
        "Channel constraints",
        "LLM-generated variants for review",
        "Approved issue brief",
        "Approved tone",
        "Prior performance note",
        "Approve",
        "Revise",
        "Write revised message",
        "Submit revised version",
        "This section shows ONE example message family",
        "A real campaign would repeat this workflow across multiple issue frames",
        "Message family",
        "Affordability / cost of living",
        "Healthcare access",
        "Anti-corruption / accountability",
        "Democracy / voting rights",
        "Climate / resiliency",
        "Public transit / infrastructure",
        "Reproductive rights",
        "Fundraising email",
        "Volunteer call script",
        "Door knocking script",
        "Younger donor version",
        "High-engagement prior donor version",
        "Possible conversation directions",
        "Questions that invite reflection",
        "Common concerns heard from voters",
        "Suggested follow-up",
        "Rent is high. Groceries cost more.",
        "Too many people wait to get care",
        "special treatment and regular families feel ignored",
        "Voting is how people make their voices count",
        "Flooded streets, delayed trains",
        "When transit fails, daily life gets harder",
        "Private healthcare decisions should stay with patients",
        "Human review required",
    ]:
        assert text in ai
    assert "Reject" not in ai
    for old_label in [
        "4 questions",
        "3 talking points",
        "CTA and thank-you",
        "Canvasser guidance",
    ]:
        assert old_label not in ai
    for medium in ["SMS", "Email", "Door-knocking script"]:
        assert medium in synthesis
    for removed in [
        "Recommended outreach strategy",
        "Why this segment is prioritized",
        "Expected reward",
        "Uncertainty",
        "Exploration need",
        "Fatigue penalty",
        "Channel fit",
    ]:
        assert removed not in ai


def test_about_tab_matches_campaign_positioning_and_boundaries():
    about = read("frontend/src/components/AboutTab.jsx")

    assert "prototype" in about
    assert "not an election prediction model" in about
    assert "autonomous persuasion system" in about
    assert "Inspired by adaptive experimentation systems, political targeting workflows, and contextual bandit research." in about
    assert "DNC-style campaign resource allocation" not in about
    assert "Stanford charitable-giving contextual bandit research" in about
    assert "monitoring uncertainty and fatigue" in about
    assert "Architecture" in about
    assert "Multi-armed bandit allocation for experiment traffic shifting" in about
    assert "Contextual personalization features for supporter-level assignment" in about
    assert "Human-reviewed AI-assisted message adaptation" in about
    assert "Fatigue-aware outreach constraints" in about
    assert "preserving" in about
    assert "exploration and preventing premature lock-in" in about
    assert "David Rauch" in about
    assert "https://github.com/davidwrauch/political-donation-adaptive-experimentation" in about
    assert "https://www.linkedin.com/in/davidwrauch/" in about
    assert "https://arxiv.org/abs/2211.12004" in about
    assert "Research grounding" in about
    assert "This prototype is grounded in contextual bandits, adaptive experimentation, and OPE-style offline policy" in about
    assert "research white paper explains why this approach is useful" in about
    assert "View research white paper" in about
    assert "Download white paper" in about
    assert "#view=FitH" in about
    assert "/adaptive-experimentation-methodology.pdf" in about
    assert "Methodology note" not in about
    assert "methodology note" not in about
    assert "Adapted from my adaptive experimentation platform" not in about
    assert "Product-focused data scientist" in about
    for guardrail in [
        "Human review required",
        "Approved message templates only",
        "Fatigue and exposure caps",
        "Avoid overreacting to noisy early results",
        "Preserve some exploration",
        "Do not maximize donations at all costs",
    ]:
        assert guardrail in about
