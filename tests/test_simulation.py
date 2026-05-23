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
    assert summary["active_arms"] == 6
    assert 0 <= summary["primary_metric"]["value"] <= 1
    assert summary["secondary_metrics"]["expected_donation_amount"] > 0
    assert summary["best_message_frame"]["label"]
    assert summary["best_segment"]["label"]


def test_ai_synthesis_is_deterministic_and_human_reviewed():
    summary = summarize_experiment(generate_experiment(seed=9, n=250))
    recommendation = synthesize_recommendation(summary)

    assert recommendation["human_review_required"] is True
    assert "not autonomous persuasion" in recommendation["warning"]
    assert "human-reviewed" in recommendation["generated_rationale"]
    assert recommendation["approved_message_templates"]
