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
    assert summary["active_arms"] == 4
    assert [strategy["label"] for strategy in summary["strategies"]] == [
        "Static A/B test",
        "Thompson sampling",
        "LinUCB",
        "Contextual bandit with fatigue guardrail",
    ]
    assert 0 <= summary["primary_metric"]["value"] <= 1
    assert summary["secondary_metrics"]["expected_donation_amount"] > 0
    assert summary["best_strategy"]["label"]
    assert summary["best_segment"]["label"]
    assert summary["best_channel"]["label"]
    assert summary["recommended_next_allocation"]
    assert summary["leadership_takeaway"]
    assert summary["strategy_timeline"]
    assert summary["strategy_performance"]
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
