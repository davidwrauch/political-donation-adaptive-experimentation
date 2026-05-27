from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_app_shell_uses_ballot_chase_positioning():
    app = read("frontend/src/App.jsx")

    for tab in ["Overview", "Experiment Design", "What If", "AI Message Review", "About"]:
        assert tab in app
    assert "Adaptive Ballot Chase" in app
    assert "Prioritize voters who requested mail ballots" in app
    assert "Estimated additional returned ballots" in app
    assert "ballot chase allocation strategies" in app
    assert "Adaptive campaign donation simulation" not in app
    assert "Political Donation Adaptive Experimentation" not in app
    assert "Net donation value per contact" not in app


def test_app_fetches_actual_fastapi_routes_and_reports_failed_url():
    app = read("frontend/src/App.jsx")

    assert "`${API_BASE}/api/overview`" in app
    assert "`${API_BASE}/api/ai/recommendation`" in app
    assert "fetchJson(overviewUrl" in app
    assert "fetchJson(aiRecommendationUrl" in app
    assert "Unable to load ${label} from ${url}" in app


def test_overview_is_ballot_chase_not_donation_dashboard():
    overview = read("frontend/src/components/OverviewTab.jsx")
    simulation = read("backend/app/services/simulation.py")

    for text in [
        "voters who requested mail ballots",
        "adaptive ballot chase focuses on movability",
        "Estimated additional returns",
        "Ballot return rate",
        "Average uplift",
        "Estimated additional returned ballots over time by allocation strategy",
        "Additional returns/100:",
        "Control / holdout",
        "Static randomized test",
        "LinUCB",
        "Traffic share",
        "Probability best",
        "Fast forward to winner",
    ]:
        assert text in overview
    for text in [
        "SMS reminder",
        "volunteer call",
        "door knock",
        "candidate call",
        "suppress",
        "baseline_return_probability",
        "estimated_return_probability_if_contacted",
        "uplift_score",
    ]:
        assert text in simulation
    for removed in [
        "donation outreach",
        "Net donation value per contact",
        "Donation conversion rate",
        "Average donation amount",
        "fundraising",
        "Thompson sampling",
        "Contextual bandit with fatigue guardrail",
    ]:
        assert removed not in overview


def test_what_if_tab_is_reframed_for_turnout_priorities():
    what_if = read("frontend/src/components/WhatIfTab.jsx")
    main = read("backend/app/main.py")

    assert "/api/policy-simulator" in what_if
    assert "/api/policy-simulator" in main
    for text in [
        "What If?",
        "Explore how changing turnout priorities reshapes ballot returns",
        "Current chase policy",
        "Adjusted chase policy",
        "Prioritize high-uplift ballot returns",
        "Prioritize high-support voters",
        "Reduce contact fatigue",
        "County opportunity",
        "Urgent returns",
        "Ballot return uplift",
        "Support score",
        "Contactability",
        "Local election relevance",
        "County/exploration diversity",
        "Projected additional returned ballots",
        "Projected ballot returns from rate change",
        "The goal is not to chase every outstanding ballot equally.",
    ]:
        assert text in what_if
    for removed in [
        "Prioritize big donations",
        "Prioritize small donations",
        "Projected volunteer signups",
        "Donation value",
        "Volunteer conversion",
        "Net value/contact",
    ]:
        assert removed not in what_if


def test_experiment_design_describes_ballot_chase_operations():
    design = read("frontend/src/components/ExperimentDesignTab.jsx")

    for text in [
        "How the experiment runs",
        "Mail ballot request data",
        "Approved ballot-chase options",
        "estimated additional returned ballots",
        "ballot-return outcomes",
        "Control / holdout uses generic non-personalized ballot-return reminders",
        "voter context",
        "voter ID, intervention, channel, urgency, and cadence recommendations",
        "Why campaigns are rethinking outreach",
    ]:
        assert text in design
    assert "donation outcomes" not in design
    assert "supporter ID" not in design


def test_ai_and_about_are_ballot_chase_framed():
    ai = read("frontend/src/components/AiTab.jsx")
    about = read("frontend/src/components/AboutTab.jsx")
    synthesis = read("backend/app/services/ai_synthesis.py")

    for text in [
        "AI Ballot Chase Review",
        "Staff-written base reminder",
        "Generated ballot-chase variants for review",
        "SMS reminder",
        "Email reminder",
        "Candidate call",
        "Suppress / do not contact note",
        "mail ballot is still outstanding",
    ]:
        assert text in ai
    for text in [
        "ballot chase and turnout intervention programs",
        "prioritize voters who requested mail ballots",
        "Multi-armed bandit allocation for ballot-chase traffic shifting",
        "voter-level assignment",
        "Do not chase every outstanding ballot at all costs",
    ]:
        assert text in about
    assert "mail ballot was requested" in synthesis
    assert "grassroots donation" not in synthesis
    assert "donation helps" not in ai
