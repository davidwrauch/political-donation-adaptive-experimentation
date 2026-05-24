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
    assert "<strong>20.79% improvement</strong>" in app
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
        "Explore how changing campaign priorities reshapes persuasion, fundraising, fatigue, and audience reach.",
        "Offline simulation, not causal proof.",
        "What If lets campaign leadership test how changing priorities would have changed estimated outcomes on the simulated campaign log.",
        "Default settings match the current logged policy.",
        "The default policy reflects the current reward settings used by the simulated adaptive campaign",
        "Current policy",
        "Adjusted policy",
        "$0.00",
        "Change vs current policy",
        "What this means",
        "Overlap and reliability",
        "Current policy",
        "Prioritize big donations",
        "Prioritize small donations",
        "More positive campaign",
        "Learn aggressively",
        "Long-term trust",
        "Local/community focus",
        "Optimize net value",
        "Donation value",
        "Conversion",
        "Persuasion/trust",
        "Fatigue guardrail",
        "Positive tone",
        "Local/community",
        "Learning/diversity",
        "Hover over each control to see what it changes.",
        "These controls are not independent causal levers.",
        "Contextual bandits (adaptive experimentation) do not decide what \"good\" means on their own.",
        "trust, fatigue, and audience coverage.",
        "Top affected audience segment",
    ]:
        assert text in what_if
    for removed in [
        "Estimated net value per contact under adjusted policy",
        "High-dollar donors",
        "Contact-risk penalty",
        "Urgency/negative penalty",
        "Exploration diversity",
        "Audience diversity",
    ]:
        assert removed not in what_if
    for metric in [
        "Net value/contact",
        "Conversion",
        "Average donation",
        "Fatigue",
        "Message diversity",
    ]:
        assert metric in what_if
    for style in [
        "what-if-hero",
        "compact-policy-grid",
        "strategy-console",
        "strategy-knob",
        "preset-row",
        "soft-pill",
    ]:
        assert style in styles


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
        "Primary optimization metric. Measures expected donation dollars generated per contact after accounting for conversion rate, donation amount, and fatigue penalties.",
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
        "Exploration rate",
        "Estimated risk that repeated outreach reduces future response or causes opt-outs.",
        "Share of contacts reserved for learning rather than only using the current best-performing option.",
        "Net donation value per contact over time by allocation strategy",
        "X-axis: dates. Y-axis: net donation value per contact. Line thickness reflects current traffic allocation share.",
        "Thicker lines indicate higher traffic allocation as the experiment shifts outreach toward stronger-performing strategies.",
        "ticks = [0, 2, 4, 6, 8, 10, 12]",
        "Traffic share",
        "Winning strategy traffic share",
        "Fast forward to winner",
        "Simulation progress:",
        "Winner locked in",
        "Overall donation conversion rate by strategy",
        "Net donation value per contact by strategy",
        "Fatigue risk by strategy",
        "Message-frame performance within the current leading strategy",
        "Message allocation within the current leading strategy",
        "primary-chart-card",
        "primary-pill",
        "Primary metric",
        "chart-title-row",
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
        "Contextual bandit with fatigue guardrail",
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
    assert "message_allocation_shift" in overview
    assert "Traffic allocation over time" not in overview
    assert "Cumulative donation conversions by allocation strategy" not in overview
    assert "Campaign readout" not in overview
    assert "Leading adaptive method" not in overview
    assert "Use Contextual bandit with fatigue guardrail as the leading allocation strategy" not in overview
    assert "Frequentist check" not in overview
    assert "p-value" not in overview
    assert "winning message" not in overview.lower()
    assert overview.index('title="Net donation value per contact by strategy"') < overview.index('title="Overall donation conversion rate by strategy"')


def test_experiment_design_is_practical_and_guardrailed():
    design = read("frontend/src/components/ExperimentDesignTab.jsx")

    for text in [
        "How we would actually run this",
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
