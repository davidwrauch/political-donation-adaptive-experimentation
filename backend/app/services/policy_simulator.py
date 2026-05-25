from __future__ import annotations

import math
from collections import Counter, defaultdict
from statistics import mean
from typing import Any


DEFAULT_WEIGHTS = {
    "donation_value_weight": 1.0,
    "conversion_weight": 0.7,
    "volunteer_conversion_weight": 0.2,
    "high_dollar_donor_weight": 0.35,
    "persuasion_trust_proxy_weight": 0.25,
    "fatigue_penalty": 0.55,
    "unsubscribe_penalty": 0.45,
    "negative_urgency_message_penalty": 0.35,
    "local_community_message_boost": 0.2,
    "exploration_diversity_weight": 0.25,
    "fairness_audience_diversity_weight": 0.2,
}


def simulate_policy(experiment: dict[str, Any], weights: dict[str, float] | None = None) -> dict[str, Any]:
    events = experiment["events"]
    merged_weights = normalize_weights(weights or {})
    baseline = aggregate_metrics(events)
    default_policy = is_default_policy(merged_weights)
    scored_events = [(event, event_score(event, merged_weights)) for event in events]
    adjusted = baseline if default_policy else weighted_aggregate(scored_events, merged_weights)
    baseline_segment_shares = share_by(events, "segment")
    adjusted_segment_shares = baseline_segment_shares if default_policy else weighted_share_by(scored_events, "segment")
    top_segment = max(
        adjusted_segment_shares,
        key=lambda segment: adjusted_segment_shares[segment] - baseline_segment_shares.get(segment, 0),
    )
    overlap = current_policy_overlap() if default_policy else overlap_diagnostics(scored_events)

    return {
        "weights": merged_weights,
        "default_matches_current_policy": default_policy,
        "method": "Propensity-aware retrospective scoring over the simulated campaign log",
        "caveat": (
            "Offline policy simulation, not causal proof. Estimates are strongest where the historical policy explored "
            "similar actions with enough probability overlap."
        ),
        "baseline_policy": baseline,
        "adjusted_policy": adjusted,
        "deltas": zero_deltas(baseline) if default_policy else metric_deltas(baseline, adjusted),
        "assignment_probability_available": any("assignment_probability" in event for event in events),
        "overlap": overlap,
        "top_affected_audience_segment": {
            "segment": top_segment,
            "baseline_share": round(baseline_segment_shares.get(top_segment, 0), 4),
            "adjusted_share": round(adjusted_segment_shares[top_segment], 4),
            "delta": round(adjusted_segment_shares[top_segment] - baseline_segment_shares.get(top_segment, 0), 4),
        },
        "message_mix": {
            "baseline": share_by(events, "message_label"),
            "adjusted": share_by(events, "message_label") if default_policy else weighted_share_by(scored_events, "message_label"),
        },
        "plain_english": (
            "Changing the reward definition changes what the bandit learns to favor. This estimate shows how a "
            "different priority mix could shift donations, fatigue, trust-oriented frames, and audience coverage."
        ),
    }


def normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    merged = DEFAULT_WEIGHTS.copy()
    for key in merged:
        if key in weights:
            merged[key] = clamp(float(weights[key]), 0, 2)
    return merged


def is_default_policy(weights: dict[str, float]) -> bool:
    return all(abs(weights[key] - DEFAULT_WEIGHTS[key]) < 0.0001 for key in DEFAULT_WEIGHTS)


def event_score(event: dict[str, Any], weights: dict[str, float]) -> float:
    value = safe_scale(event["net_expected_value"], -4, 12)
    conversion = float(event["conversion_probability"])
    volunteer = volunteer_conversion_proxy(event)
    high_dollar = 1.0 if event["expected_donation_amount"] >= 42 else 0.0
    trust = trust_proxy(event)
    fatigue = float(event["fatigue_risk"])
    unsubscribe = unsubscribe_proxy(event)
    urgency = urgency_or_negative_proxy(event)
    local = 1.0 if is_local_frame(event) else 0.0
    exploration = float(event.get("uncertainty", 0.2))
    fairness = audience_diversity_proxy(event)
    score = (
        weights["donation_value_weight"] * value
        + weights["conversion_weight"] * conversion
        + weights["volunteer_conversion_weight"] * volunteer
        + weights["high_dollar_donor_weight"] * high_dollar
        + weights["persuasion_trust_proxy_weight"] * trust
        + weights["local_community_message_boost"] * local
        + weights["exploration_diversity_weight"] * exploration
        + weights["fairness_audience_diversity_weight"] * fairness
        - weights["fatigue_penalty"] * fatigue
        - weights["unsubscribe_penalty"] * unsubscribe
        - weights["negative_urgency_message_penalty"] * urgency
    )
    return max(0.02, score + 0.35)


def aggregate_metrics(events: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "estimated_net_value_per_contact": round(mean(event["net_expected_value"] for event in events), 2),
        "donation_conversion_rate": round(mean(event["converted"] for event in events), 4),
        "volunteer_conversion_rate": round(mean(volunteer_conversion_proxy(event) for event in events), 4),
        "average_donation_amount": round(mean(event["expected_donation_amount"] for event in events), 2),
        "high_dollar_donation_share": round(mean(1 if event["expected_donation_amount"] >= 42 else 0 for event in events), 4),
        "fatigue_risk": round(mean(event["fatigue_risk"] for event in events), 4),
        "unsubscribe_contact_risk_proxy": round(mean(unsubscribe_proxy(event) for event in events), 4),
        "persuasion_trust_proxy": round(mean(trust_proxy(event) for event in events), 4),
        "message_diversity": round(diversity_score([event["message_frame"] for event in events]), 4),
        "local_community_frame_share": round(mean(1 if is_local_frame(event) else 0 for event in events), 4),
        "urgency_negative_frame_share": round(mean(urgency_or_negative_proxy(event) for event in events), 4),
        "contacts": len(events),
    }


def weighted_aggregate(scored_events: list[tuple[dict[str, Any], float]], weights_config: dict[str, float]) -> dict[str, Any]:
    weights = propensity_weights(scored_events)
    events = [event for event, _score in scored_events]
    conversion_rate = weighted_mean([event["converted"] for event in events], weights)
    conversion_rate = clamp(conversion_rate - donation_focus_conversion_adjustment(weights_config), 0, 1)
    return {
        "estimated_net_value_per_contact": round(weighted_mean([event["net_expected_value"] for event in events], weights), 2),
        "donation_conversion_rate": round(conversion_rate, 4),
        "volunteer_conversion_rate": round(weighted_mean([volunteer_conversion_proxy(event) for event in events], weights), 4),
        "average_donation_amount": round(weighted_mean([event["expected_donation_amount"] for event in events], weights), 2),
        "high_dollar_donation_share": round(weighted_mean([1 if event["expected_donation_amount"] >= 42 else 0 for event in events], weights), 4),
        "fatigue_risk": round(weighted_mean([event["fatigue_risk"] for event in events], weights), 4),
        "unsubscribe_contact_risk_proxy": round(weighted_mean([unsubscribe_proxy(event) for event in events], weights), 4),
        "persuasion_trust_proxy": round(weighted_mean([trust_proxy(event) for event in events], weights), 4),
        "message_diversity": round(weighted_diversity_score(events, weights, "message_frame"), 4),
        "local_community_frame_share": round(weighted_mean([1 if is_local_frame(event) else 0 for event in events], weights), 4),
        "urgency_negative_frame_share": round(weighted_mean([urgency_or_negative_proxy(event) for event in events], weights), 4),
        "contacts": len(events),
    }


def donation_focus_conversion_adjustment(weights: dict[str, float]) -> float:
    dominance = max(
        0.0,
        weights["donation_value_weight"] + weights["high_dollar_donor_weight"] - weights["conversion_weight"] - 2.0,
    )
    return min(0.075, dominance * 0.055)


def propensity_weights(scored_events: list[tuple[dict[str, Any], float]]) -> list[float]:
    raw = []
    for event, score in scored_events:
        propensity = max(float(event.get("assignment_probability", 0.1)), 0.03)
        raw.append(min(score / propensity, 25))
    total = sum(raw) or 1
    return [value / total for value in raw]


def overlap_diagnostics(scored_events: list[tuple[dict[str, Any], float]]) -> dict[str, Any]:
    weights = propensity_weights(scored_events)
    events = [event for event, _score in scored_events]
    sorted_rows = sorted(zip(events, weights), key=lambda item: item[1], reverse=True)
    top_count = max(1, int(len(sorted_rows) * 0.2))
    top_rows = sorted_rows[:top_count]
    mean_propensity = mean(float(event.get("assignment_probability", 0.1)) for event, _weight in top_rows)
    ess = 1 / sum(weight * weight for weight in weights)
    warning = mean_propensity < 0.08 or ess < len(scored_events) * 0.18
    return {
        "warning": warning,
        "level": "Low overlap" if warning else "Adequate overlap",
        "mean_assignment_probability_top_weighted_actions": round(mean_propensity, 4),
        "effective_sample_size": round(ess, 1),
        "explanation": (
            "The adjusted policy leans on actions that were rarely explored historically, so estimates are directional."
            if warning
            else "Historical exploration covers the adjusted policy reasonably well for a demo estimate."
        ),
    }


def current_policy_overlap() -> dict[str, Any]:
    return {
        "warning": False,
        "level": "Current policy",
        "mean_assignment_probability_top_weighted_actions": 1.0,
        "effective_sample_size": 0,
        "explanation": "Default settings match the logged policy, so no off-policy overlap adjustment is needed.",
    }


def metric_deltas(baseline: dict[str, Any], adjusted: dict[str, Any]) -> dict[str, float]:
    return {
        key: round(adjusted[key] - baseline[key], 4)
        for key in baseline
        if isinstance(baseline[key], (int, float)) and key != "contacts"
    }


def zero_deltas(baseline: dict[str, Any]) -> dict[str, float]:
    return {
        key: 0
        for key in baseline
        if isinstance(baseline[key], (int, float)) and key != "contacts"
    }


def trust_proxy(event: dict[str, Any]) -> float:
    frame = event["message_frame"]
    if frame in {"local_investment", "democracy_protection", "accountability"}:
        return 0.82
    if frame in {"affordability", "economic_fairness"}:
        return 0.62
    return 0.38


def volunteer_conversion_proxy(event: dict[str, Any]) -> float:
    trust = trust_proxy(event)
    local = 0.1 if is_local_frame(event) else 0.0
    positive_tone = 0.08 if not urgency_or_negative_proxy(event) else -0.06
    learning = 0.04 if event.get("uncertainty", 0.2) > 0.35 else 0.0
    high_dollar_drag = 0.06 if event["expected_donation_amount"] >= 48 else 0.0
    fatigue_drag = float(event["fatigue_risk"]) * 0.16
    donation_dominance_drag = safe_scale(event["net_expected_value"], 6, 12) * 0.05
    base = 0.055 + trust * 0.09 + local + positive_tone + learning
    return clamp(base - high_dollar_drag - fatigue_drag - donation_dominance_drag, 0.015, 0.32)


def unsubscribe_proxy(event: dict[str, Any]) -> float:
    channel_risk = 0.12 if event["channel"] in {"SMS", "phone"} else 0.04
    urgency_risk = 0.08 if event["message_frame"] == "momentum" else 0
    return clamp(float(event["fatigue_risk"]) * 0.82 + channel_risk + urgency_risk, 0, 1)


def urgency_or_negative_proxy(event: dict[str, Any]) -> float:
    return 1.0 if event["message_frame"] in {"momentum", "accountability"} else 0.0


def is_local_frame(event: dict[str, Any]) -> bool:
    return event["message_frame"] in {"local_investment", "affordability"}


def audience_diversity_proxy(event: dict[str, Any]) -> float:
    if "prospects" in event["segment"] and event["channel"] != "SMS":
        return 0.8
    if event["channel"] == "digital ad":
        return 0.7
    return 0.5


def share_by(events: list[dict[str, Any]], key: str) -> dict[str, float]:
    counts = Counter(event[key] for event in events)
    total = sum(counts.values()) or 1
    return {value: round(count / total, 4) for value, count in counts.most_common(8)}


def weighted_share_by(scored_events: list[tuple[dict[str, Any], float]], key: str) -> dict[str, float]:
    weights = propensity_weights(scored_events)
    shares = defaultdict(float)
    for (event, _score), weight in zip(scored_events, weights):
        shares[event[key]] += weight
    return {value: round(share, 4) for value, share in sorted(shares.items(), key=lambda item: item[1], reverse=True)[:8]}


def diversity_score(values: list[str]) -> float:
    counts = Counter(values)
    total = sum(counts.values()) or 1
    entropy = -sum((count / total) * math.log(count / total) for count in counts.values())
    max_entropy = math.log(max(2, len(counts)))
    return entropy / max_entropy


def weighted_diversity_score(events: list[dict[str, Any]], weights: list[float], key: str) -> float:
    shares = defaultdict(float)
    for event, weight in zip(events, weights):
        shares[event[key]] += weight
    entropy = -sum(share * math.log(max(share, 0.0001)) for share in shares.values())
    max_entropy = math.log(max(2, len(shares)))
    return entropy / max_entropy


def weighted_mean(values: list[float], weights: list[float]) -> float:
    return sum(float(value) * weight for value, weight in zip(values, weights))


def safe_scale(value: float, low: float, high: float) -> float:
    return clamp((float(value) - low) / (high - low), 0, 1)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
