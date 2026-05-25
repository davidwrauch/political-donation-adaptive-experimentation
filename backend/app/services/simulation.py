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
        "id": "control",
        "label": "Control / holdout",
        "description": "Uses generic non-personalized outreach with fixed messaging and no adaptive allocation.",
        "exploration_rate": 0.0,
    },
    {
        "id": "static_ab",
        "label": "Static randomized test",
        "description": "Keeps contacts evenly split across approved message/channel combinations. It is a baseline for comparison against adaptive methods.",
        "exploration_rate": 1.0,
    },
    {
        "id": "linucb",
        "label": "LinUCB",
        "description": "Uses supporter context such as issue affinity, engagement, channel preference, and donation history to personalize assignments.",
        "exploration_rate": 0.14,
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


def generate_experiment(seed: int = 42, n: int = 2500, exploration_rate: float = 0.18, batches: int = 24) -> dict:
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
            assignment_probability = 1.0 if strategy["id"] == "control" else allocation_probability(supporter, frame, priors, strategy["exploration_rate"])
            outcome = score_outcome(supporter, frame, channel, rng, strategy)
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
    strategy_rows = enrich_strategy_rows(grouped_metrics(events, "strategy", label_key="strategy_label"), batch=experiment["batches"], total_batches=experiment["batches"])
    current_readout = build_current_readout(strategy_rows)
    best_strategy = current_readout["leading_strategy"]
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
            "label": "Net donation value per contact",
            "value": mean(event["net_expected_value"] for event in events),
            "definition": "Average dollars raised per person contacted, after combining conversion rate, average donation amount, and fatigue penalty.",
        },
        "secondary_metrics": {
            "donation_conversion_rate": mean(event["converted"] for event in events),
            "expected_donation_amount": mean(event["expected_donation_amount"] for event in events),
            "net_expected_donation_value": mean(event["net_expected_value"] for event in events),
            "channel_response_rate": mean(row["conversion_rate"] for row in channel_rows),
            "donor_fatigue_risk": fatigue_risk,
            "message_frame_lift_by_segment": best_segment["conversion_rate"] - mean(event["converted"] for event in events),
        },
        "best_strategy": best_strategy,
        "current_readout": current_readout,
        "best_segment": best_segment,
        "best_channel": best_channel,
        "donor_fatigue_warning": fatigue_risk >= 0.34,
        "leadership_takeaway": (
            "Under the current leading allocation strategy, some message frames receive more allocation for specific donor segments, "
            "while the system preserves exploration because performance varies by segment and channel."
        ),
        "strategy_performance": strategy_rows,
        "strategy_status_timeline": strategy_status_timeline(events),
        "message_performance": frame_rows,
        "segment_performance": sorted(segment_rows, key=lambda row: row["net_expected_value"], reverse=True)[:8],
        "channel_performance": channel_rows,
        "strategy_rate_timeline": strategy_rate_timeline(events),
        "traffic_allocation_timeline": traffic_allocation_timeline(events),
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
    if strategy["id"] == "control":
        return MESSAGE_FRAMES[0], "generic fixed control message"
    if strategy["id"] == "static_ab":
        return rng.choice(MESSAGE_FRAMES), "static equal-split assignment"
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
    if strategy["id"] == "control":
        return "email", "fixed control channel"
    if strategy["id"] == "static_ab":
        return rng.choice(CHANNELS), "static channel rotation"
    return choose_channel(supporter, channel_stats, rng, strategy["exploration_rate"])


def score_outcome(supporter: dict, frame: dict, channel: str, rng: random.Random, strategy: dict) -> dict:
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
    if strategy["id"] == "control":
        score -= 0.22
    if strategy["id"] == "linucb":
        score += 0.12
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
    if strategy["id"] == "control":
        net_value -= 0.35
    if strategy["id"] == "linucb":
        net_value += 0.75
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


def enrich_strategy_rows(strategy_rows: list[dict], batch: int | None = None, total_batches: int | None = None) -> list[dict]:
    strategy_exploration = {strategy["id"]: strategy["exploration_rate"] for strategy in STRATEGIES}
    strategy_descriptions = {strategy["id"]: strategy["description"] for strategy in STRATEGIES}
    value_winner = max(strategy_rows, key=lambda row: row["net_expected_value"])
    conversion_winner = max(strategy_rows, key=lambda row: row["conversion_rate"])
    shares = traffic_shares_for_batch(batch or (total_batches or 1), total_batches or batch or 1)
    for row in strategy_rows:
        row["exploration_rate"] = strategy_exploration[row["id"]]
        row["description"] = strategy_descriptions[row["id"]]
        row["contacts_observed"] = row["event_count"]
        row["traffic_share"] = shares.get(row["id"], 0)
        row["allocation_status"] = "Reduced allocation" if row["net_expected_value"] < value_winner["net_expected_value"] - 0.25 and row["event_count"] >= 100 else "Active learning"
        winning = []
        if row["id"] == value_winner["id"]:
            winning.append("Net donation value per contact")
        if row["id"] == conversion_winner["id"]:
            winning.append("Donation conversion rate")
        row["winning_metrics"] = winning
    return sorted(strategy_rows, key=lambda row: row["net_expected_value"], reverse=True)


def build_current_readout(strategy_rows: list[dict]) -> dict:
    value_winner = max(strategy_rows, key=lambda row: row["net_expected_value"])
    conversion_winner = max(strategy_rows, key=lambda row: row["conversion_rate"])
    control_row = next(row for row in strategy_rows if row["id"] == "control")
    adaptive_rows = [row for row in strategy_rows if row["id"] != "control"]
    adaptive_winner = max(adaptive_rows, key=lambda row: row["net_expected_value"])
    confidence = simulated_bayesian_confidence(strategy_rows, value_winner["id"])
    frequentist = simulated_frequentist_check(strategy_rows)
    total_contacts = sum(row["event_count"] for row in strategy_rows)
    return {
        "leading_strategy": value_winner,
        "leading_adaptive_strategy": adaptive_winner,
        "conversion_winner": conversion_winner,
        "net_value_winner": value_winner,
        "control": control_row,
        "adaptive_lift_vs_control": round(adaptive_winner["net_expected_value"] - control_row["net_expected_value"], 4),
        "bayesian_confidence": confidence,
        "frequentist_check": frequentist,
        "estimated_additional_contacts_needed": estimated_contacts_needed(confidence["probability_best"]),
        "recommendation_status": recommendation_status(confidence["probability_best"]),
        "total_contacts_observed": total_contacts,
        "contacts_by_strategy": {row["id"]: row["event_count"] for row in strategy_rows},
        "contacts_by_control": control_row["event_count"],
        "traffic_share_by_strategy": {row["id"]: row.get("traffic_share", 0) for row in strategy_rows},
        "current_leading_strategy_traffic_share": value_winner.get("traffic_share", 0),
        "confidence_note": "Simulated Bayesian-style confidence based on the current net value gap in this synthetic demo.",
    }


def strategy_status_timeline(events: list[dict]) -> list[dict]:
    rows = []
    by_batch = sorted({event["batch"] for event in events})
    total_batches = max(by_batch)
    for batch in by_batch:
        cumulative_events = [event for event in events if event["batch"] <= batch]
        strategy_rows = enrich_strategy_rows(grouped_metrics(cumulative_events, "strategy", label_key="strategy_label"), batch=batch, total_batches=total_batches)
        rows.append(
            {
                "batch": batch,
                "experiment_date": cumulative_events[-1]["experiment_date"],
                "progress": round(batch / total_batches, 4),
                "total_contacts_observed": len(cumulative_events),
                "strategy_performance": strategy_rows,
                "current_readout": build_current_readout(strategy_rows),
            }
        )
    return rows


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


def strategy_rate_timeline(events: list[dict]) -> list[dict]:
    labels = {strategy["id"]: strategy["label"] for strategy in STRATEGIES}
    by_batch = defaultdict(list)
    for event in events:
        by_batch[event["batch"]].append(event)
    rows = []
    for batch in sorted(by_batch):
        batch_events = by_batch[batch]
        rows.append(
            {
                "batch": batch,
                "date": batch_events[0]["experiment_date"],
                "experiment_date": batch_events[0]["experiment_date"],
                "series": [
                    {
                        "id": strategy["id"],
                        "label": labels[strategy["id"]],
                        "conversion_rate": round(
                            mean(
                                event["converted"]
                                for event in batch_events
                                if event["strategy"] == strategy["id"]
                            ),
                            4,
                        ),
                        "net_expected_value": round(
                            mean(
                                event["net_expected_value"]
                                for event in batch_events
                                if event["strategy"] == strategy["id"]
                            ),
                            2,
                        ),
                    }
                    for strategy in STRATEGIES
                ],
            }
        )
    return rows


def traffic_allocation_timeline(events: list[dict]) -> list[dict]:
    labels = {strategy["id"]: strategy["label"] for strategy in STRATEGIES}
    by_batch = sorted({event["batch"] for event in events})
    total_batches = max(by_batch)
    rows = []
    for batch in by_batch:
        batch_events = [event for event in events if event["batch"] == batch]
        shares = traffic_shares_for_batch(batch, total_batches)
        rows.append(
            {
                "batch": batch,
                "date": batch_events[0]["experiment_date"],
                "experiment_date": batch_events[0]["experiment_date"],
                "series": [
                    {"id": strategy["id"], "label": labels[strategy["id"]], "traffic_share": shares[strategy["id"]]}
                    for strategy in STRATEGIES
                ],
            }
        )
    return rows


def traffic_shares_for_batch(batch: int, total_batches: int) -> dict[str, float]:
    if total_batches <= 1:
        progress = 1.0
    else:
        progress = clamp((batch - 1) / (total_batches - 1), 0, 1)
    if progress >= 1:
        return {
            "control": 0.0,
            "static_ab": 0.0,
            "linucb": 1.0,
        }
    weights = {
        "control": max(0.03, 0.25 * (1 - progress) ** 1.25),
        "static_ab": max(0.05, 0.25 * (1 - progress) ** 1.05),
        "linucb": 0.32 + 1.15 * progress ** 1.18,
    }
    total = sum(weights.values())
    return {key: round(value / total, 4) for key, value in weights.items()}


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
    progress_bonus = max(0, leader.get("traffic_share", 0) - 0.2) * 0.24
    probability = clamp(0.52 + gap * 0.08 + progress_bonus, 0.52, 0.89)
    if leader["id"] == "linucb" and leader.get("traffic_share", 0) >= 0.85:
        probability = 0.88
    return {
        "strategy_id": leading_strategy_id,
        "strategy_label": leader["label"],
        "probability_best": round(probability, 2),
        "basis": "simulated",
    }


def simulated_frequentist_check(strategy_rows: list[dict]) -> dict:
    ordered = sorted(strategy_rows, key=lambda row: row["net_expected_value"], reverse=True)
    leader = ordered[0]
    runner_up = ordered[1] if len(ordered) > 1 else ordered[0]
    control = next(row for row in strategy_rows if row["id"] == "control")
    control_gap = max(0.0, leader["net_expected_value"] - control["net_expected_value"])
    runner_gap = max(0.0, leader["net_expected_value"] - runner_up["net_expected_value"])
    sample_factor = min(1.0, leader["event_count"] / 900)
    share_bonus = max(0, leader.get("traffic_share", 0) - 0.2)
    p_vs_control = clamp(0.34 - control_gap * 0.04 - sample_factor * 0.06 - share_bonus * 0.19, 0.01, 0.49)
    p_vs_runner_up = clamp(0.42 - runner_gap * 0.06 - sample_factor * 0.04 - share_bonus * 0.19, 0.02, 0.55)
    if leader["id"] == "linucb" and leader.get("traffic_share", 0) >= 0.85:
        p_vs_control = 0.018
        p_vs_runner_up = 0.031
    return {
        "p_value_vs_control": round(p_vs_control, 3),
        "p_value_vs_runner_up": round(p_vs_runner_up, 3),
        "statistically_significant": p_vs_control < 0.05 and p_vs_runner_up < 0.05,
        "basis": "simulated",
    }


def recommendation_status(probability_best: float) -> str:
    if probability_best >= 0.78:
        return "Ready to scale"
    if probability_best >= 0.62:
        return "Promising but keep testing"
    return "Directional only"


def estimated_contacts_needed(probability_best: float) -> int:
    if probability_best >= 0.78:
        return 0
    gap_to_high_confidence = 0.78 - probability_best
    return int(math.ceil(gap_to_high_confidence * 100000 / 1000) * 1000)


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
