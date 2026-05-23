from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_four_tabs_and_campaign_loading_language():
    app = read("frontend/src/App.jsx")

    for tab in ["Overview", "Experiment Design", "AI Message Review", "About"]:
        assert tab in app
    assert "OverviewTab overview={overview}" in app
    assert "Net donation value per contact" in app
    assert "Secondary metrics: donation conversion rate, average donation amount, fatigue risk, exploration rate, and p-value check." in app
    assert "This live demo compresses a longer campaign experiment into a short simulation" in app
    assert "Loading simulated campaign results, usually 10-15 seconds" in app
    assert "Data ready" in app


def test_app_fetches_actual_fastapi_routes_and_reports_failed_url():
    app = read("frontend/src/App.jsx")

    assert "`${API_BASE}/api/overview`" in app
    assert "`${API_BASE}/api/ai/recommendation`" in app
    assert "fetchJson(overviewUrl" in app
    assert "fetchJson(aiRecommendationUrl" in app
    assert "Unable to load ${label} from ${url}" in app


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
        "Contacts observed",
        "Probability best",
        "Additional contacts before high-confidence rollout",
        "Rollout confidence status",
        "Frequentist check",
        "p vs control",
        "p vs runner-up",
        "significant:",
        "A traditional p-value check compares whether the current leader",
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
        "Updates paused",
        "Allocation status",
        "Current leader",
        "Donation conversion rate",
        "Fatigue risk",
        "Exploration rate",
        "Estimated risk that repeated outreach reduces future response or causes opt-outs.",
        "Share of contacts reserved for learning rather than only using the current best-performing option.",
        "Donation conversion rate over time by allocation strategy",
        "X-axis: dates. Y-axis: conversion rate percentage by experiment date.",
        "ticks = [0.2, 0.25, 0.3, 0.35, 0.4]",
        "Overall donation conversion rate by strategy",
        "Net donation value per contact by strategy",
        "Fatigue risk by strategy",
        "Message-frame performance within the current leading strategy",
        "Message allocation within the current leading strategy",
        "<h2><LabelWithHelp label={title} help={helpText[title]} /></h2>",
    ]:
        assert text in overview
    for strategy in [
        "Control",
        "Static randomized test",
        "Thompson sampling",
        "LinUCB",
        "Contextual bandit with fatigue guardrail",
    ]:
        assert strategy in simulation

    assert "<polyline" in overview
    assert "leader-card" in overview
    assert "strokeWidth={hoveredId === item.id ? \"3.8\" : \"2.55\"}" in overview
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
    assert "formatWholePercent(tick)" in overview
    assert "strategy_rate_timeline" in overview
    assert "formatAxisDate(row.experiment_date)" in overview
    assert "strategy_performance" in overview
    assert "message_allocation_shift" in overview
    assert "Cumulative donation conversions by allocation strategy" not in overview
    assert "Campaign readout" not in overview
    assert "Leading adaptive method" not in overview
    assert "Use Contextual bandit with fatigue guardrail as the leading allocation strategy" not in overview
    assert "winning message" not in overview.lower()


def test_experiment_design_is_practical_and_guardrailed():
    design = read("frontend/src/components/ExperimentDesignTab.jsx")

    for text in [
        "How we would actually run this",
        "How this would work operationally",
        "Vendor platforms",
        "Warehouse",
        "Experimentation models",
        "Allocation engine",
        "Reviewed outreach recommendations",
        "Vendor execution",
        "What adaptive experimentation means",
        "How the static randomized baseline is comparable",
        "Adaptive allocation does not split traffic evenly forever",
        "Control uses generic non-personalized outreach",
        "does not adapt allocation based on results",
        "Audience data needed",
        "Message arms needed",
        "Experimentation strategies compared",
        "Channels needed",
        "Outcome definitions",
        "Randomization / assignment logic",
        "Sample size caveat",
        "Fatigue guardrails",
        "Human approval process",
        "Questions for Campaign Leadership",
        "How much exploration is acceptable?",
        "Potential future inputs",
        "Social listening APIs",
        "Google News trend signals",
        "Issue salience tracking",
        "Fundraising response shifts after major events",
        "Earned media sentiment",
        "Regional issue spikes",
        "Social listening extension:",
        "Future versions could incorporate social listening, news trend",
        "inform which message families deserve",
        "more exploration",
    ]:
        assert text in design
    assert "supporter ID" in design
    assert "CSVs or APIs" in design


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
        "4 questions",
        "3 talking points",
        "Intro",
        "CTA and thank-you",
        "Canvasser guidance",
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
