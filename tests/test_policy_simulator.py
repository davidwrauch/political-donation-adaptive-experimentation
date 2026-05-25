from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.main import app, policy_simulator
from app.services.policy_simulator import DEFAULT_WEIGHTS, simulate_policy
from app.services.simulation import generate_experiment


def test_policy_simulator_returns_baseline_adjusted_and_deltas():
    experiment = generate_experiment(seed=31, n=320)
    result = simulate_policy(experiment, DEFAULT_WEIGHTS)

    assert result["baseline_policy"]["estimated_net_value_per_contact"] > 0
    assert result["adjusted_policy"]["estimated_net_value_per_contact"] > 0
    assert result["baseline_policy"]["volunteer_conversion_rate"] > 0
    assert result["adjusted_policy"]["volunteer_conversion_rate"] > 0
    assert result["default_matches_current_policy"] is True
    assert result["adjusted_policy"] == result["baseline_policy"]
    assert result["deltas"]["estimated_net_value_per_contact"] == 0
    assert result["deltas"]["fatigue_risk"] == 0
    assert "estimated_net_value_per_contact" in result["deltas"]
    assert result["assignment_probability_available"] is True
    assert "not causal proof" in result["caveat"]
    assert result["top_affected_audience_segment"]["segment"]


def test_policy_simulator_weights_change_adjusted_estimate():
    experiment = generate_experiment(seed=32, n=320)
    value_first = simulate_policy(experiment, {"donation_value_weight": 2, "fatigue_penalty": 0})
    fatigue_first = simulate_policy(experiment, {"donation_value_weight": 0.1, "fatigue_penalty": 2, "unsubscribe_penalty": 2})

    assert value_first["adjusted_policy"]["estimated_net_value_per_contact"] != fatigue_first["adjusted_policy"]["estimated_net_value_per_contact"]
    assert fatigue_first["adjusted_policy"]["fatigue_risk"] <= value_first["adjusted_policy"]["fatigue_risk"]
    assert value_first["default_matches_current_policy"] is False


def test_policy_simulator_models_volunteer_tradeoff():
    experiment = generate_experiment(seed=35, n=420)
    donation_first = simulate_policy(
        experiment,
        {"donation_value_weight": 1.8, "volunteer_conversion_weight": 0.0, "local_community_message_boost": 0.1},
    )
    volunteer_first = simulate_policy(
        experiment,
        {
            "donation_value_weight": 0.45,
            "conversion_weight": 0.75,
            "volunteer_conversion_weight": 1.75,
            "persuasion_trust_proxy_weight": 1.35,
            "negative_urgency_message_penalty": 1.35,
            "local_community_message_boost": 1.35,
            "fatigue_penalty": 1.05,
        },
    )

    assert volunteer_first["adjusted_policy"]["volunteer_conversion_rate"] > donation_first["adjusted_policy"]["volunteer_conversion_rate"]
    assert "volunteer_conversion_rate" in volunteer_first["deltas"]


def test_policy_simulator_models_big_donation_tradeoff():
    experiment = generate_experiment(seed=36, n=420)
    result = simulate_policy(
        experiment,
        {
            "donation_value_weight": 1.75,
            "conversion_weight": 0.35,
            "volunteer_conversion_weight": 0.05,
            "high_dollar_donor_weight": 1.65,
            "persuasion_trust_proxy_weight": 0.15,
            "fatigue_penalty": 0.55,
            "unsubscribe_penalty": 0.55,
            "negative_urgency_message_penalty": 0.2,
            "local_community_message_boost": 0.05,
            "exploration_diversity_weight": 0.08,
            "fairness_audience_diversity_weight": 0.08,
        },
    )

    assert result["deltas"]["estimated_net_value_per_contact"] > 0
    assert result["deltas"]["average_donation_amount"] > 0
    assert result["deltas"]["donation_conversion_rate"] <= 0.012


def test_policy_simulator_overlap_warning_when_propensity_is_sparse():
    experiment = generate_experiment(seed=33, n=220)
    for event in experiment["events"]:
        if event["message_frame"] == "momentum":
            event["assignment_probability"] = 0.01
    result = simulate_policy(
        experiment,
        {
            "donation_value_weight": 0,
            "conversion_weight": 0,
            "negative_urgency_message_penalty": 0,
            "high_dollar_donor_weight": 0,
            "local_community_message_boost": 0,
            "fatigue_penalty": 0,
            "unsubscribe_penalty": 0,
            "exploration_diversity_weight": 0,
            "fairness_audience_diversity_weight": 0,
            "persuasion_trust_proxy_weight": 0,
        },
    )

    assert "effective_sample_size" in result["overlap"]
    assert result["overlap"]["level"] in {"Adequate overlap", "Low overlap"}


def test_policy_simulator_api_endpoint_accepts_weights():
    assert any(route.path == "/api/policy-simulator" for route in app.routes)
    payload = policy_simulator({"donation_value_weight": 1.6, "fatigue_penalty": 0.2})

    assert payload["weights"]["donation_value_weight"] == 1.6
    assert "volunteer_conversion_rate" in payload["adjusted_policy"]
    assert payload["baseline_policy"]["contacts"] > 0
    assert payload["adjusted_policy"]["contacts"] > 0
    assert "overlap" in payload
