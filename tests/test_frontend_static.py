from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_four_tabs_and_campaign_loading_language():
    app = read("frontend/src/App.jsx")

    for tab in ["Overview", "Experiment Design", "AI", "About"]:
        assert tab in app
    assert "Loading campaign donation experiment results" in app


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
        "Donation conversion rate",
        "Net expected value",
        "Fatigue risk",
        "Exploration rate",
        "Cumulative donation conversions by strategy",
        "Y-axis: cumulative conversions. X-axis: experiment batch/date.",
        "Overall donation conversion rate by strategy",
        "Net expected donation value by strategy",
        "Fatigue risk by strategy",
        "Message-frame performance under the best-performing strategy",
        "Message allocation under the best-performing strategy",
    ]:
        assert text in overview
    for strategy in [
        "Static A/B test",
        "Thompson sampling",
        "LinUCB",
        "Contextual bandit with fatigue guardrail",
    ]:
        assert strategy in simulation

    assert "<polyline" in overview
    assert "strategy_timeline" in overview
    assert "strategy_performance" in overview
    assert "message_allocation_shift" in overview
    assert "winning message" not in overview.lower()


def test_experiment_design_is_practical_and_guardrailed():
    design = read("frontend/src/components/ExperimentDesignTab.jsx")

    for text in [
        "How we would actually run this",
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
    ]:
        assert text in design


def test_ai_tab_is_campaign_synthesis_not_autonomous_persuasion():
    ai = read("frontend/src/components/AiTab.jsx")
    synthesis = read("backend/app/services/ai_synthesis.py")

    for text in [
        "Constrained message adaptation workflow",
        "Staff-written base message",
        "Retrieved campaign context",
        "LLM-generated variants for review",
        "Approved issue brief",
        "Approved tone",
        "Prior performance note",
        "Approve",
        "Reject",
        "Write replacement message",
        "Submit replacement",
        "Human review required",
    ]:
        assert text in ai
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
    assert "DNC-style campaign resource allocation" in about
    assert "Stanford charitable-giving contextual bandit research" in about
    assert "monitoring uncertainty and fatigue" in about
    assert "David Rauch" in about
    assert "https://github.com/davidwrauch/political-donation-adaptive-experimentation" in about
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
