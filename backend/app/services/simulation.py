from __future__ import annotations

import math
import random
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from statistics import mean


AGE_BANDS = ["18-29", "30-44", "45-64", "65+"]
GEOGRAPHIES = ["urban", "suburban", "rural"]
ISSUES = [
    "economic fairness",
    "anti-corruption",
    "democracy protection",
    "affordability",
    "local community investment",
    "candidate momentum",
]
CHANNELS = ["email", "SMS", "phone", "digital ad"]

STRATEGIES = [
    {
        "id": "static_ab",
        "label": "Static randomized test",
        "description": "Keeps contacts evenly split across approved message/channel combinations. It is a baseline for comparison against adaptive methods.",
        "exploration_rate": 1.0,
    },
    {
        "id": "thompson_sampling",
        "label": "Thompson sampling",
        "description": "Shifts allocation toward frames with stronger observed donation conversion while preserving uncertainty-aware learning.",
        "exploration_rate": 0.18,
    },
    {
        "id": "linucb",
        "label": "LinUCB",
        "description": "Uses supporter context such as issue affinity, engagement, channel preference, and donation history to personalize assignments.",
        "exploration_rate": 0.14,
    },
    {
        "id": "guarded_contextual_bandit",
        "label": "Contextual bandit with fatigue guardrail",
        "description": "Personalizes outreach while reducing exposure for high-fatigue supporters and preserving a small exploration budget.",
        "exploration_rate": 0.10,
    },
]

MESSAGE_FRAMES = [
    {
        "id": "economic_fairness",
        "label": "Economic fairness",
        "issue": "economic fairness",
        "template": "Help power a campaign fighting for fair wages and an economy that works for everyone.",
    },
    {
        "id": "accountability",
        "label": "Anti-corruption / accountability",
        "issue": "anti-corruption",
        "template": "Chip in to hold special interests accountable and restore trust in government.",
    },
    {
        "id": "democracy_protection",
        "label": "Democracy protection",
        "issue": "democracy protection",
        "template": "Protect voting rights and democratic institutions with a grassroots donation today.",
    },
    {
        "id": "affordability",
        "label": "Affordability / cost of living",
        "issue": "affordability",
        "template": "Support a campaign focused on lowering everyday costs for working families.",
    },
    {
        "id": "local_investment",
        "label": "Local community investment",
        "issue": "local community investment",
        "template": "Invest in local schools, safer neighborhoods, and stronger community services.",
    },
    {
        "id": "momentum",
        "label": "Candidate momentum / urgency",
        "issue": "candidate momentum",
        "template": "Our campaign is gaining momentum. Donate before the deadline to keep it going.",
    },
]


@dataclass(frozen=True)
class Supporter:
    supporter_id: str
    age_band: str
    geography_type: str
    prior_donation_count: int
    prior_total_donated: float
    recent_engagement_score: float
    volunteer_history: bool
    issue_affinity: str
    channel_preference: str
    political_engagement_level: str
    donor_fatigue_score: float
    civic_engagement_score: float

    @property
    def segment(self) -> str:
        donor = "prior donors" if self.prior_donation_count else "prospects"
        engagement = "high-engagement" if self.recent_engagement_score >= 0.65 else "low-engagement"
        return f"{engagement} {donor} / {self.issue_affinity}"


def generate_supporters(n: int = 2500, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    supporters = []
    for index in range(n):
        prior_count = weighted_choice(rng, [(0, 0.46), (1, 0.25), (2, 0.16), (3, 0.08), (5, 0.05)])
        engagement = clamp(rng.betavariate(2.4, 2.1), 0, 1)
        fatigue = clamp(rng.betavariate(1.7 + prior_count * 0.2, 4.2), 0, 1)
        issue = rng.choice(ISSUES)
        supporter = Supporter(
            supporter_id=f"SUP-{index + 1:05d}",
            age_band=rng.choice(AGE_BANDS),
            geography_type=rng.choice(GEOGRAPHIES),
            prior_donation_count=prior_count,
            prior_total_donated=round(prior_count * rng.uniform(18, 74), 2),
            recent_engagement_score=round(engagement, 3),
            volunteer_history=rng.random() < 0.18 + engagement * 0.18,
            issue_affinity=issue,
            channel_preference=rng.choice(CHANNELS),
            political_engagement_level=engagement_level(engagement),
            donor_fatigue_score=round(fatigue, 3),
            civic_engagement_score=round(clamp(0.3 + engagement * 0.55 + rng.uniform(-0.12, 0.12), 0, 1), 3),
        )
        supporters.append(supporter.__dict__ | {"segment": supporter.segment})
    return supporters


def generate_experiment(seed: int = 42, n: int = 2500, exploration_rate: float = 0.18, batches: int = 12) -> dict:
    rng = random.Random(seed)
    supporters = generate_supporters(n=n, seed=seed)
    strategy_priors = {strategy["id"]: defaultdict(lambda: {"alpha": 2.0, "beta": 8.0}) for strategy in STRATEGIES}
    channel_stats = {strategy["id"]: defaultdict(lambda: {"alpha": 2.0, "beta": 8.0}) for strategy in STRATEGIES}
    events = []
    start_date = date(2026, 2, 1)

    for strategy in STRATEGIES:
        priors = strategy_priors[strategy["id"]]
        channels_for_strategy = channel_stats[strategy["id"]]
        for index, supporter in enumerate(supporters):
            batch = min(batches, index // max(1, math.ceil(n / batches)) + 1)
            frame, frame_reason = choose_frame_for_strategy(supporter, priors, rng, strategy)
            channel, channel_reason = choose_channel_for_strategy(supporter, channels_for_strategy, rng, strategy)
            key = (supporter["segment"], frame["id"])
            prior = priors[key]
            estimated_reward = prior["alpha"] / (prior["alpha"] + prior["beta"])
            uncertainty = 1 / math.sqrt(prior["alpha"] + prior["beta"])
            assignment_probability = allocation_probability(supporter, frame, priors, strategy["exploration_rate"])
            outcome = score_outcome(supporter, frame, channel, rng)
            events.append(
                {
                    "date": (start_date + timedelta(days=batch - 1)).isoformat(),
                    "experiment_date": (start_date + timedelta(days=batch - 1)).isoformat(),
                    "batch": batch,
                    "strategy": strategy["id"],
                    "strategy_label": strategy["label"],
                    "supporter_id": supporter["supporter_id"],
                    "segment": supporter["segment"],
                    "message_frame": frame["id"],
                    "message_label": frame["label"],
                    "channel": channel,
                    "assignment_probability": round(assignment_probability, 4),
                    "allocation_share": round(assignment_probability, 4),
                    "expected_reward": round(estimated_reward, 4),
                    "uncertainty": round(uncertainty, 4),
                    "exploration_need": round(uncertainty + (strategy["exploration_rate"] * 0.2), 4),
                    "fatigue_penalty": round(fatigue_penalty_for(supporter, frame, channel), 4),
                    "channel_fit": round(1 if channel == supporter["channel_preference"] else 0.35, 2),
                    "selection_reason": build_selection_reason(frame_reason, channel_reason, supporter),
                    **outcome,
                }
            )
            priors[key]["alpha" if outcome["converted"] else "beta"] += 1
            channel_key = (supporter["segment"], channel)
            channels_for_strategy[channel_key]["alpha" if outcome["converted"] else "beta"] += 1

    return {
        "supporters": supporters,
        "events": events,
        "message_frames": MESSAGE_FRAMES,
        "channels": CHANNELS,
        "strategies": STRATEGIES,
        "exploration_rate": exploration_rate,
        "batches": batches,
    }


def summarize_experiment(experiment: dict) -> dict:
    events = experiment["events"]
    supporters = experiment["supporters"]
    strategy_rows = grouped_metrics(events, "strategy", label_key="strategy_label")
    strategy_exploration = {strategy["id"]: strategy["exploration_rate"] for strategy in STRATEGIES}
    strategy_descriptions = {strategy["id"]: strategy["description"] for strategy in STRATEGIES}
    for row in strategy_rows:
        row["exploration_rate"] = strategy_exploration[row["id"]]
        row["description"] = strategy_descriptions[row["id"]]
    conversion_winner = max(strategy_rows, key=lambda row: row["conversion_rate"])
    value_winner = max(strategy_rows, key=lambda row: row["net_expected_value"])
    best_strategy = value_winner
    confidence = simulated_bayesian_confidence(strategy_rows, best_strategy["id"])
    status = recommendation_status(confidence["probability_best"])
    for row in strategy_rows:
        winning = []
        if row["id"] == conversion_winner["id"]:
            winning.append("Donation conversion rate")
        if row["id"] == value_winner["id"]:
            winning.append("Net expected value")
        row["winning_metrics"] = winning
    best_strategy_events = [event for event in events if event["strategy"] == best_strategy["id"]]
    frame_rows = grouped_metrics(best_strategy_events, "message_frame", label_key="message_label")
    segment_rows = grouped_metrics(events, "segment")
    channel_rows = grouped_metrics(events, "channel")
    best_segment = max(segment_rows, key=lambda row: row["net_expected_value"])
    best_channel = max(channel_rows, key=lambda row: row["net_expected_value"])
    fatigue_risk = mean(event["fatigue_risk"] for event in events)
    allocation = message_allocation_shift(best_strategy_events)
    timeline = strategy_conversion_timeline(events)
    latest_event = events[-1]

    return {
        "total_supporters": len(supporters),
        "active_arms": len(experiment["strategies"]),
        "strategies": experiment["strategies"],
        "channels": experiment["channels"],
        "exploration_rate": experiment["exploration_rate"],
        "primary_metric": {
            "label": "Donation conversion rate",
            "value": mean(event["converted"] for event in events),
        },
        "secondary_metrics": {
            "expected_donation_amount": mean(event["expected_donation_amount"] for event in events),
            "net_expected_donation_value": mean(event["net_expected_value"] for event in events),
            "channel_response_rate": mean(row["conversion_rate"] for row in channel_rows),
            "donor_fatigue_risk": fatigue_risk,
            "message_frame_lift_by_segment": best_segment["conversion_rate"] - mean(event["converted"] for event in events),
        },
        "best_strategy": best_strategy,
        "current_readout": {
            "leading_strategy": best_strategy,
            "conversion_winner": conversion_winner,
            "net_value_winner": value_winner,
            "bayesian_confidence": confidence,
            "recommendation_status": status,
            "confidence_note": "Simulated Bayesian-style confidence based on the current strategy gap in this synthetic demo.",
        },
        "best_segment": best_segment,
        "best_channel": best_channel,
        "donor_fatigue_warning": fatigue_risk >= 0.34,
        "leadership_takeaway": (
            "Under the best-performing strategy, some message frames receive more allocation for specific donor segments, "
            "while the system preserves exploration because performance varies by segment and channel."
        ),
        "strategy_performance": strategy_rows,
        "message_performance": frame_rows,
        "segment_performance": sorted(segment_rows, key=lambda row: row["net_expected_value"], reverse=True)[:8],
        "channel_performance": channel_rows,
        "strategy_timeline": timeline,
        "message_allocation_shift": allocation,
        "latest_decision": latest_event,
        "plain_english": (
            "The system is optimizing scarce campaign outreach by learning which donation message "
            "frames and channels convert across supporter segments while watching expected value and fatigue risk."
        ),
    }


def choose_frame(supporter: dict, priors: dict, rng: random.Random, exploration_rate: float) -> tuple[dict, str]:
    if rng.random() < exploration_rate:
        return rng.choice(MESSAGE_FRAMES), "exploration"
    scored = []
    for frame in MESSAGE_FRAMES:
        key = (supporter["segment"], frame["id"])
        prior = priors[key]
        estimated_conversion = prior["alpha"] / (prior["alpha"] + prior["beta"])
        affinity_bonus = 0.08 if frame["issue"] == supporter["issue_affinity"] else 0
        fatigue_penalty = 0.04 if frame["id"] == "momentum" and supporter["donor_fatigue_score"] > 0.55 else 0
        scored.append((estimated_conversion + affinity_bonus - fatigue_penalty, frame))
    return max(scored, key=lambda item: item[0])[1], "highest expected reward after affinity and fatigue adjustment"


def choose_frame_for_strategy(supporter: dict, priors: dict, rng: random.Random, strategy: dict) -> tuple[dict, str]:
    if strategy["id"] == "static_ab":
        return rng.choice(MESSAGE_FRAMES), "static equal-split assignment"
    if strategy["id"] == "thompson_sampling":
        return choose_frame(supporter, priors, rng, strategy["exploration_rate"])
    if strategy["id"] == "linucb":
        return choose_contextual_frame(supporter, priors, rng, strategy["exploration_rate"], guarded=False)
    return choose_contextual_frame(supporter, priors, rng, strategy["exploration_rate"], guarded=True)


def choose_contextual_frame(supporter: dict, priors: dict, rng: random.Random, exploration_rate: float, guarded: bool) -> tuple[dict, str]:
    if rng.random() < exploration_rate:
        return rng.choice(MESSAGE_FRAMES), "contextual exploration"
    scored = []
    for frame in MESSAGE_FRAMES:
        prior = priors[(supporter["segment"], frame["id"])]
        estimated_conversion = prior["alpha"] / (prior["alpha"] + prior["beta"])
        context_score = (
            estimated_conversion
            + (0.13 if frame["issue"] == supporter["issue_affinity"] else 0)
            + supporter["recent_engagement_score"] * 0.05
            + min(supporter["prior_donation_count"], 4) * 0.015
        )
        if guarded:
            context_score -= fatigue_penalty_for(supporter, frame, "SMS") * 1.2
        scored.append((context_score, frame))
    reason = "contextual score with fatigue guardrail" if guarded else "contextual score from donor profile"
    return max(scored, key=lambda item: item[0])[1], reason


def choose_channel(supporter: dict, channel_stats: dict, rng: random.Random, exploration_rate: float) -> tuple[str, str]:
    if rng.random() < exploration_rate:
        return rng.choice(CHANNELS), "channel exploration"
    scored = []
    for channel in CHANNELS:
        key = (supporter["segment"], channel)
        prior = channel_stats[key]
        estimated = prior["alpha"] / (prior["alpha"] + prior["beta"])
        preference_bonus = 0.08 if channel == supporter["channel_preference"] else 0
        fatigue_penalty = 0.05 if channel in {"SMS", "phone"} and supporter["donor_fatigue_score"] > 0.58 else 0
        scored.append((estimated + preference_bonus - fatigue_penalty, channel))
    return max(scored, key=lambda item: item[0])[1], "best channel fit after response and fatigue adjustment"


def choose_channel_for_strategy(supporter: dict, channel_stats: dict, rng: random.Random, strategy: dict) -> tuple[str, str]:
    if strategy["id"] == "static_ab":
        return rng.choice(CHANNELS), "static channel rotation"
    return choose_channel(supporter, channel_stats, rng, strategy["exploration_rate"])


def score_outcome(supporter: dict, frame: dict, channel: str, rng: random.Random) -> dict:
    issue_match = frame["issue"] == supporter["issue_affinity"]
    channel_match = channel == supporter["channel_preference"]
    urgency_penalty = 0.12 if frame["id"] == "momentum" and supporter["donor_fatigue_score"] > 0.55 else 0
    score = (
        -2.25
        + supporter["recent_engagement_score"] * 1.15
        + supporter["civic_engagement_score"] * 0.75
        + min(supporter["prior_donation_count"], 4) * 0.16
        + (0.28 if supporter["volunteer_history"] else 0)
        + (0.42 if issue_match else -0.05)
        + (0.32 if channel_match else 0)
        - supporter["donor_fatigue_score"] * 0.85
        - urgency_penalty
    )
    conversion_probability = sigmoid(score)
    converted = rng.random() < conversion_probability
    expected_amount = (
        10
        + supporter["prior_total_donated"] * 0.09
        + supporter["recent_engagement_score"] * 18
        + (8 if issue_match else 0)
        + (5 if channel == "phone" else 0)
    )
    fatigue_risk = clamp(supporter["donor_fatigue_score"] + (0.12 if channel in {"SMS", "phone"} else 0.04), 0, 1)
    net_value = conversion_probability * expected_amount - fatigue_risk * 4.5
    return {
        "conversion_probability": round(conversion_probability, 4),
        "converted": int(converted),
        "expected_donation_amount": round(expected_amount, 2),
        "donation_amount": round(expected_amount * rng.uniform(0.7, 1.35), 2) if converted else 0,
        "fatigue_risk": round(fatigue_risk, 4),
        "net_expected_value": round(net_value, 2),
    }


def grouped_metrics(events: list[dict], key: str, label_key: str | None = None) -> list[dict]:
    groups = defaultdict(list)
    for event in events:
        groups[event[key]].append(event)
    rows = []
    for value, group in groups.items():
        conversion_rate = mean(event["converted"] for event in group)
        rows.append(
            {
                "id": value,
                "label": group[0][label_key] if label_key else value,
                "event_count": len(group),
                "conversion_rate": round(conversion_rate, 4),
                "expected_donation_amount": round(mean(event["expected_donation_amount"] for event in group), 2),
                "net_expected_value": round(mean(event["net_expected_value"] for event in group), 2),
                "fatigue_risk": round(mean(event["fatigue_risk"] for event in group), 4),
                "lift": round(conversion_rate - mean(event["converted"] for event in events), 4),
            }
        )
    return sorted(rows, key=lambda row: row["conversion_rate"], reverse=True)


def strategy_conversion_timeline(events: list[dict]) -> list[dict]:
    labels = {strategy["id"]: strategy["label"] for strategy in STRATEGIES}
    by_batch = defaultdict(list)
    for event in events:
        by_batch[event["batch"]].append(event)
    cumulative = defaultdict(int)
    rows = []
    for batch in sorted(by_batch):
        batch_events = by_batch[batch]
        for strategy in STRATEGIES:
            cumulative[strategy["id"]] += sum(1 for event in batch_events if event["strategy"] == strategy["id"] and event["converted"])
        rows.append(
            {
                "batch": batch,
                "date": batch_events[0]["experiment_date"],
                "experiment_date": batch_events[0]["experiment_date"],
                "series": [
                    {"id": strategy["id"], "label": labels[strategy["id"]], "cumulative_conversions": cumulative[strategy["id"]]}
                    for strategy in STRATEGIES
                ],
            }
        )
    return rows


def message_allocation_shift(events: list[dict]) -> list[dict]:
    labels = {frame["id"]: frame["label"] for frame in MESSAGE_FRAMES}
    by_batch = defaultdict(list)
    for event in events:
        by_batch[event["batch"]].append(event)
    rows = []
    for batch, batch_events in sorted(by_batch.items()):
        total = len(batch_events)
        rows.append(
            {
                "batch": batch,
                "date": batch_events[0]["experiment_date"],
                "experiment_date": batch_events[0]["experiment_date"],
                "frames": [
                    {
                        "id": frame["id"],
                        "label": labels[frame["id"]],
                        "allocation_share": round(sum(1 for event in batch_events if event["message_frame"] == frame["id"]) / total, 4),
                    }
                    for frame in MESSAGE_FRAMES[:4]
                ],
            }
        )
    return rows


def allocation_probability(supporter: dict, selected_frame: dict, priors: dict, exploration_rate: float) -> float:
    scored = []
    for frame in MESSAGE_FRAMES:
        prior = priors[(supporter["segment"], frame["id"])]
        estimated_conversion = prior["alpha"] / (prior["alpha"] + prior["beta"])
        affinity_bonus = 0.08 if frame["issue"] == supporter["issue_affinity"] else 0
        scored.append((estimated_conversion + affinity_bonus, frame["id"]))
    best_frame = max(scored, key=lambda item: item[0])[1]
    if selected_frame["id"] == best_frame:
        return 1 - exploration_rate + exploration_rate / len(MESSAGE_FRAMES)
    return exploration_rate / len(MESSAGE_FRAMES)


def fatigue_penalty_for(supporter: dict, frame: dict, channel: str) -> float:
    frame_penalty = 0.04 if frame["id"] == "momentum" and supporter["donor_fatigue_score"] > 0.55 else 0
    channel_penalty = 0.05 if channel in {"SMS", "phone"} and supporter["donor_fatigue_score"] > 0.58 else 0
    return frame_penalty + channel_penalty


def build_selection_reason(frame_reason: str, channel_reason: str, supporter: dict) -> str:
    return (
        f"Selected because of {frame_reason}, {channel_reason}, issue affinity for "
        f"{supporter['issue_affinity']}, and donor fatigue score {supporter['donor_fatigue_score']}."
    )


def simulated_bayesian_confidence(strategy_rows: list[dict], leading_strategy_id: str) -> dict:
    ordered = sorted(strategy_rows, key=lambda row: row["net_expected_value"], reverse=True)
    leader = ordered[0]
    runner_up = ordered[1] if len(ordered) > 1 else ordered[0]
    gap = max(0.0, leader["net_expected_value"] - runner_up["net_expected_value"])
    probability = clamp(0.52 + gap * 0.09, 0.52, 0.86)
    return {
        "strategy_id": leading_strategy_id,
        "strategy_label": leader["label"],
        "probability_best": round(probability, 2),
        "basis": "simulated",
    }


def recommendation_status(probability_best: float) -> str:
    if probability_best >= 0.78:
        return "Ready to scale"
    if probability_best >= 0.62:
        return "Promising but keep testing"
    return "Directional only"


def engagement_level(value: float) -> str:
    if value >= 0.72:
        return "high"
    if value >= 0.42:
        return "medium"
    return "low"


def weighted_choice(rng: random.Random, choices: list[tuple[int, float]]) -> int:
    threshold = rng.random()
    cumulative = 0.0
    for value, weight in choices:
        cumulative += weight
        if threshold <= cumulative:
            return value
    return choices[-1][0]


def sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-value))


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))
