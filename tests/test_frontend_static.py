from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_four_tabs_and_campaign_loading_language():
    app = read("frontend/src/App.jsx")

    for tab in ["Overview", "Experiment Design", "AI", "About"]:
        assert tab in app
    assert "Loading campaign donation experiment results" in app


def test_overview_contains_leadership_metrics_and_charts():
    overview = read("frontend/src/components/OverviewTab.jsx")

    for text in [
        "What leadership should know",
        "Donation conversion rate",
        "Expected donation amount",
        "Net expected donation value",
        "Best message frame",
        "Best segment",
        "Best channel",
        "Current exploration rate",
        "Donor fatigue warning",
        "Recommended next allocation",
        "Cumulative donation conversions by message frame",
        "Donation conversion by message frame",
        "Expected donation value by segment",
        "Allocation shift over time",
    ]:
        assert text in overview

    assert "<polyline" in overview
    assert "conversion_timeline" in overview
    assert "allocation_shift" in overview


def test_experiment_design_is_practical_and_guardrailed():
    design = read("frontend/src/components/ExperimentDesignTab.jsx")

    for text in [
        "How we would actually run this",
        "Audience data needed",
        "Message arms needed",
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

    for text in [
        "Campaign messaging research synthesis",
        "Recommended outreach strategy",
        "Recommended message frame",
        "Recommended channel",
        "Why this segment is prioritized",
        "Retrieved prior performance",
        "Why this arm was selected",
        "Expected reward",
        "Uncertainty",
        "Exploration need",
        "Fatigue penalty",
        "Channel fit",
        "Human review required",
    ]:
        assert text in ai


def test_about_tab_matches_campaign_positioning_and_boundaries():
    about = read("frontend/src/components/AboutTab.jsx")

    assert "prototype" in about
    assert "not an election prediction model" in about
    assert "autonomous persuasion system" in about
    assert "DNC-style campaign resource allocation" in about
    assert "Stanford charitable-giving contextual bandit research" in about
    assert "monitoring uncertainty and fatigue" in about
    for guardrail in [
        "Human review required",
        "Approved message templates only",
        "Fatigue and exposure caps",
        "Avoid overreacting to noisy early results",
        "Preserve some exploration",
        "Do not maximize donations at all costs",
    ]:
        assert guardrail in about
