from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.ai_synthesis import synthesize_recommendation
from app.services.simulation import generate_experiment, summarize_experiment


def test_simulation_generates_required_supporter_fields():
    experiment = generate_experiment(seed=7, n=100)
    supporter = experiment["supporters"][0]

    for field in [
        "supporter_id",
        "age_band",
        "geography_type",
        "prior_donation_count",
        "prior_total_donated",
        "recent_engagement_score",
        "volunteer_history",
        "issue_affinity",
        "channel_preference",
        "political_engagement_level",
        "donor_fatigue_score",
        "civic_engagement_score",
    ]:
        assert field in supporter


def test_summary_has_campaign_experiment_metrics():
    summary = summarize_experiment(generate_experiment(seed=8, n=250))

    assert summary["total_supporters"] == 250
    assert summary["active_arms"] == 5
    assert [strategy["label"] for strategy in summary["strategies"]] == [
        "Control",
        "Static randomized test",
        "Thompson sampling",
        "LinUCB",
        "Contextual bandit with fatigue guardrail",
    ]
    assert summary["primary_metric"]["value"] > 0
    assert summary["primary_metric"]["label"] == "Net donation value per contact"
    assert "Average dollars raised per person contacted" in summary["primary_metric"]["definition"]
    assert "donation_conversion_rate" in summary["secondary_metrics"]
    assert summary["secondary_metrics"]["expected_donation_amount"] > 0
    assert summary["best_strategy"]["label"]
    assert summary["current_readout"]["leading_strategy"]["label"]
    assert summary["current_readout"]["leading_adaptive_strategy"]["label"]
    assert summary["current_readout"]["conversion_winner"]["label"]
    assert summary["current_readout"]["net_value_winner"]["label"]
    assert summary["current_readout"]["control"]["label"] == "Control"
    assert summary["current_readout"]["total_contacts_observed"] > 0
    assert summary["current_readout"]["contacts_by_control"] > 0
    assert summary["current_readout"]["contacts_by_strategy"]["control"] > 0
    assert "adaptive_lift_vs_control" in summary["current_readout"]
    assert 0 <= summary["current_readout"]["bayesian_confidence"]["probability_best"] <= 1
    assert summary["current_readout"]["bayesian_confidence"]["basis"] == "simulated"
    assert summary["current_readout"]["recommendation_status"] in [
        "Directional only",
        "Promising but keep testing",
        "Ready to scale",
    ]
    assert summary["current_readout"]["estimated_additional_contacts_needed"] >= 0
    assert summary["best_segment"]["label"]
    assert summary["best_channel"]["label"]
    assert summary["leadership_takeaway"]
    assert summary["strategy_timeline"]
    assert summary["strategy_timeline"][0]["experiment_date"] == "2026-02-01"
    assert summary["strategy_rate_timeline"]
    assert summary["strategy_status_timeline"]
    assert summary["strategy_status_timeline"][0]["total_contacts_observed"] < summary["strategy_status_timeline"][-1]["total_contacts_observed"]
    assert summary["strategy_rate_timeline"][0]["experiment_date"] == "2026-02-01"
    assert 0 <= summary["strategy_rate_timeline"][0]["series"][0]["conversion_rate"] <= 1
    assert summary["strategy_performance"]
    assert all("winning_metrics" in strategy for strategy in summary["strategy_performance"])
    assert summary["message_allocation_shift"]
    assert summary["latest_decision"]["assignment_probability"] > 0
    assert "selection_reason" in summary["latest_decision"]


def test_ai_synthesis_is_deterministic_and_human_reviewed():
    summary = summarize_experiment(generate_experiment(seed=9, n=250))
    recommendation = synthesize_recommendation(summary)

    assert recommendation["human_review_required"] is True
    assert "does not send messages automatically" in recommendation["explanation"]
    assert recommendation["base_message"]
    assert recommendation["retrieved_context"]["approved_issue_brief"] == "Affordability / cost of living"
    assert "High-engagement prior donors usually need concise" in recommendation["retrieved_context"]["prior_performance_note"]
    assert "trust-building" in recommendation["retrieved_context"]["prior_performance_note"]
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
        "supporter_id",
        "message_frame",
        "channel",
        "segment",
        "converted",
        "donation_amount",
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
