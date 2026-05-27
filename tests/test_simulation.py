from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.ai_synthesis import synthesize_recommendation
from app.services.simulation import generate_experiment, summarize_experiment


def test_simulation_generates_required_voter_fields():
    experiment = generate_experiment(seed=7, n=100)
    voter = experiment["supporters"][0]

    for field in [
        "voter_id",
        "county",
        "district",
        "support_score",
        "turnout_score",
        "ballot_requested_date",
        "days_since_request",
        "contactability_score",
        "fatigue_score",
        "prior_contact_count",
        "prior_vote_history",
        "preferred_channel",
        "baseline_return_probability",
        "estimated_return_probability_if_contacted",
        "uplift_score",
        "urgency_score",
    ]:
        assert field in voter


def test_summary_has_ballot_chase_metrics():
    summary = summarize_experiment(generate_experiment(seed=8, n=250))

    assert summary["total_supporters"] == 250
    assert summary["active_arms"] == 3
    assert [strategy["label"] for strategy in summary["strategies"]] == [
        "Control / holdout",
        "Static randomized test",
        "LinUCB",
    ]
    assert summary["primary_metric"]["label"] == "Estimated additional returned ballots"
    assert "contact changed behavior" in summary["primary_metric"]["definition"]
    assert summary["outstanding_ballots"] == 250
    assert summary["estimated_additional_returned_ballots"] > 0
    assert summary["average_uplift"] > 0
    assert summary["top_county_opportunity"]["label"]
    assert summary["fatigue_risk_voters_suppressed"] >= 0
    assert summary["recommended_contacts_by_channel"]
    assert "adaptive_vs_static_estimated_lift" in summary
    assert summary["current_readout"]["leading_strategy"]["label"] == "LinUCB"
    assert summary["current_readout"]["recommendation_status"] == "Ready to scale"
    assert summary["current_readout"]["estimated_additional_contacts_needed"] == 0
    assert summary["strategy_rate_timeline"][0]["experiment_date"] == "2026-02-01"
    assert summary["traffic_allocation_timeline"][-1]["series"][-1]["traffic_share"] >= 0.85
    assert summary["latest_decision"]["assignment_probability"] > 0
    for field in [
        "voter_id",
        "ballot_returned",
        "recommended_intervention",
        "baseline_return_probability",
        "estimated_return_probability_if_contacted",
        "uplift_score",
        "adaptive_policy_group",
    ]:
        assert field in summary["latest_decision"]


def test_ai_synthesis_is_deterministic_and_human_reviewed():
    summary = summarize_experiment(generate_experiment(seed=9, n=250))
    recommendation = synthesize_recommendation(summary)

    assert recommendation["human_review_required"] is True
    assert "does not send messages automatically" in recommendation["explanation"]
    assert recommendation["base_message"]
    assert "mail ballot was requested" in recommendation["base_message"]
    assert recommendation["retrieved_context"]["approved_issue_brief"] == "Affordability / cost of living"
    assert "High-contactability voters usually need concise" in recommendation["retrieved_context"]["prior_performance_note"]
    assert "ballot-return help" in recommendation["retrieved_context"]["prior_performance_note"]
    assert len(recommendation["variants"]) == 4
    assert {variant["medium"] for variant in recommendation["variants"]} == {
        "SMS",
        "Email",
        "Door-knocking script",
    }


def test_events_include_batch_and_assignment_explanation_fields():
    event = generate_experiment(seed=10, n=50)["events"][0]

    for field in [
        "date",
        "experiment_date",
        "batch",
        "strategy",
        "strategy_label",
        "voter_id",
        "recommended_intervention",
        "channel",
        "segment",
        "ballot_returned",
        "fatigue_risk",
        "assignment_probability",
        "allocation_share",
        "expected_reward",
        "uncertainty",
        "exploration_need",
        "fatigue_penalty",
        "channel_fit",
    ]:
        assert field in event
