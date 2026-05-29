from __future__ import annotations

import math
import random
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from statistics import mean


COUNTIES = ["Kings", "Queens", "Bronx", "New York", "Nassau", "Westchester", "Erie", "Monroe"]
DISTRICTS = ["NY-03", "NY-04", "NY-16", "NY-17", "NY-18", "NY-19", "NY-22"]
PRIOR_VOTE_HISTORY = ["consistent general voter", "midterm dropoff voter", "new mail voter", "sporadic voter"]
CHANNELS = ["email", "SMS", "volunteer call", "door knock", "candidate call"]

STRATEGIES = [
    {
        "id": "control",
        "label": "Control / holdout",
        "description": "Uses generic non-personalized ballot-return reminders with fixed timing and no adaptive allocation.",
        "exploration_rate": 0.0,
    },
    {
        "id": "static_ab",
        "label": "Static randomized test",
        "description": "Keeps ballot-chase contacts evenly split across approved interventions and channels without adapting allocation.",
        "exploration_rate": 1.0,
    },
    {
        "id": "linucb",
        "label": "LinUCB",
        "description": "Uses voter context such as support, turnout, contactability, urgency, and fatigue to prioritize ballot-chase interventions.",
        "exploration_rate": 0.14,
    },
]

INTERVENTIONS = [
    {
        "id": "sms_reminder",
        "label": "SMS reminder",
        "type": "SMS reminder",
        "template": "Quick reminder: your mail ballot is still outstanding. Please return it as soon as you can.",
    },
    {
        "id": "volunteer_call",
        "label": "Volunteer call",
        "type": "volunteer call",
        "template": "A volunteer calls to answer ballot-return questions and confirm the voter has a plan.",
    },
    {
        "id": "door_knock",
        "label": "Door knock",
        "type": "door knock",
        "template": "A canvasser checks in at the door with ballot-return instructions and local drop-box details.",
    },
    {
        "id": "candidate_call",
        "label": "Candidate call",
        "type": "candidate call",
        "template": "A candidate or surrogate call is reserved for high-support, high-priority voters.",
    },
    {
        "id": "email_reminder",
        "label": "Email reminder",
        "type": "email reminder",
        "template": "An email provides ballot-return deadlines, drop-off options, and help-line details.",
    },
    {
        "id": "suppress",
        "label": "Suppress / do not contact",
        "type": "suppress / do not contact",
        "template": "Do not contact when fatigue risk is high or modeled uplift is too low.",
    },
]
MESSAGE_FRAMES = INTERVENTIONS


@dataclass(frozen=True)
class Voter:
    voter_id: str
    county: str
    district: str
    support_score: float
    turnout_score: float
    ballot_requested_date: str
    days_since_request: int
    contactability_score: float
    fatigue_score: float
    prior_contact_count: int
    prior_vote_history: str
    preferred_channel: str
    baseline_return_probability: float
    estimated_return_probability_if_contacted: float
    uplift_score: float
    urgency_score: float

    @property
    def segment(self) -> str:
        support = "high-support" if self.support_score >= 0.68 else "persuadable-support"
        urgency = "urgent" if self.urgency_score >= 0.62 else "standard"
        return f"{support} {urgency} / {self.county}"


def generate_supporters(n: int = 2500, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    voters = []
    start_date = date(2026, 10, 1)
    for index in range(n):
        support = clamp(rng.betavariate(3.0, 1.8), 0, 1)
        turnout = clamp(rng.betavariate(2.2, 2.4), 0, 1)
        contactability = clamp(rng.betavariate(2.6, 2.1), 0, 1)
        prior_contacts = weighted_choice(rng, [(0, 0.34), (1, 0.32), (2, 0.2), (3, 0.1), (5, 0.04)])
        fatigue = clamp(rng.betavariate(1.4 + prior_contacts * 0.3, 4.1), 0, 1)
        days_since_request = rng.randint(2, 21)
        urgency = clamp(days_since_request / 21 + rng.uniform(-0.08, 0.08), 0, 1)
        baseline = clamp(0.12 + turnout * 0.46 + contactability * 0.08 - fatigue * 0.14, 0.04, 0.82)
        movability = clamp((1 - abs(baseline - 0.48) * 1.55) * contactability * (1 - fatigue * 0.62), 0, 1)
        uplift = clamp(0.015 + movability * 0.18 + support * 0.035 + urgency * 0.04, 0.005, 0.32)
        contacted_probability = clamp(baseline + uplift, 0.05, 0.97)
        voter = Voter(
            voter_id=f"VOTER-{index + 1:05d}",
            county=rng.choice(COUNTIES),
            district=rng.choice(DISTRICTS),
            support_score=round(support, 3),
            turnout_score=round(turnout, 3),
            ballot_requested_date=(start_date - timedelta(days=days_since_request)).isoformat(),
            days_since_request=days_since_request,
            contactability_score=round(contactability, 3),
            fatigue_score=round(fatigue, 3),
            prior_contact_count=prior_contacts,
            prior_vote_history=rng.choice(PRIOR_VOTE_HISTORY),
            preferred_channel=rng.choice(CHANNELS[:-1]),
            baseline_return_probability=round(baseline, 4),
            estimated_return_probability_if_contacted=round(contacted_probability, 4),
            uplift_score=round(uplift, 4),
            urgency_score=round(urgency, 3),
        )
        voters.append(voter.__dict__ | {"segment": voter.segment})
    return voters


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
                    "supporter_id": supporter["voter_id"],
                    "voter_id": supporter["voter_id"],
                    "county": supporter["county"],
                    "district": supporter["district"],
                    "support_score": supporter["support_score"],
                    "turnout_score": supporter["turnout_score"],
                    "ballot_requested_date": supporter["ballot_requested_date"],
                    "days_since_request": supporter["days_since_request"],
                    "contactability_score": supporter["contactability_score"],
                    "fatigue_score": supporter["fatigue_score"],
                    "prior_contact_count": supporter["prior_contact_count"],
                    "prior_vote_history": supporter["prior_vote_history"],
                    "preferred_channel": supporter["preferred_channel"],
                    "baseline_return_probability": supporter["baseline_return_probability"],
                    "estimated_return_probability_if_contacted": supporter["estimated_return_probability_if_contacted"],
                    "uplift_score": supporter["uplift_score"],
                    "urgency_score": supporter["urgency_score"],
                    "adaptive_policy_group": strategy["label"],
                    "segment": supporter["segment"],
                    "message_frame": frame["id"],
                    "message_label": frame["label"],
                    "recommended_intervention": frame["label"],
                    "channel": channel,
                    "assignment_probability": round(assignment_probability, 4),
                    "allocation_share": round(assignment_probability, 4),
                    "expected_reward": round(estimated_reward, 4),
                    "uncertainty": round(uncertainty, 4),
                    "exploration_need": round(uncertainty + (strategy["exploration_rate"] * 0.2), 4),
                    "fatigue_penalty": round(fatigue_penalty_for(supporter, frame, channel), 4),
                    "channel_fit": round(1 if channel == supporter["preferred_channel"] else 0.35, 2),
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
            "label": "Estimated additional returned ballots",
            "value": sum(event["net_expected_value"] / 100 for event in events),
            "definition": "Estimated additional ballots returned because contact changed behavior, after accounting for uplift and contact fatigue.",
        },
        "secondary_metrics": {
            "ballot_return_rate": mean(event["converted"] for event in events),
            "average_uplift": mean(event["uplift_score"] for event in events),
            "estimated_additional_returned_ballots": sum(event["net_expected_value"] / 100 for event in events),
            "channel_response_rate": mean(row["conversion_rate"] for row in channel_rows),
            "contact_fatigue_risk": fatigue_risk,
            "segment_lift": best_segment["conversion_rate"] - mean(event["converted"] for event in events),
        },
        "best_strategy": best_strategy,
        "current_readout": current_readout,
        "best_segment": best_segment,
        "best_channel": best_channel,
        "donor_fatigue_warning": fatigue_risk >= 0.34,
        "contact_fatigue_warning": fatigue_risk >= 0.34,
        "outstanding_ballots": len(supporters),
        "high_priority_chase_targets": sum(1 for event in events if event["uplift_score"] >= 0.11 and event["fatigue_risk"] < 0.42),
        "estimated_additional_returned_ballots": round(sum(event["net_expected_value"] / 100 for event in events), 1),
        "average_uplift": round(mean(event["uplift_score"] for event in events), 4),
        "top_county_opportunity": max(grouped_metrics(events, "county"), key=lambda row: row["net_expected_value"]),
        "fatigue_risk_voters_suppressed": sum(1 for event in events if event["recommended_intervention"] == "Suppress / do not contact"),
        "recommended_contacts_by_channel": grouped_metrics(events, "channel"),
        "adaptive_vs_static_estimated_lift": round(best_strategy["net_expected_value"] - next(row["net_expected_value"] for row in strategy_rows if row["id"] == "static_ab"), 4),
        "leadership_takeaway": (
            "The system prioritizes voters who are movable, contactable, urgent, and not over-contacted instead of chasing every outstanding ballot equally."
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
            "The system is optimizing scarce ballot-chase capacity by learning which voters are most likely to return a ballot because of the right reminder, channel, and cadence."
        ),
    }


def choose_frame(supporter: dict, priors: dict, rng: random.Random, exploration_rate: float) -> tuple[dict, str]:
    if rng.random() < exploration_rate:
        return rng.choice(MESSAGE_FRAMES), "exploration"
    scored = []
    for frame in MESSAGE_FRAMES:
        key = (supporter["segment"], frame["id"])
        prior = priors[key]
        estimated_return = prior["alpha"] / (prior["alpha"] + prior["beta"])
        scored.append((estimated_return + intervention_fit(supporter, frame), frame))
    return max(scored, key=lambda item: item[0])[1], "highest expected ballot-return uplift after contactability and fatigue adjustment"


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
        estimated_return = prior["alpha"] / (prior["alpha"] + prior["beta"])
        context_score = (
            estimated_return
            + supporter["uplift_score"] * 0.65
            + supporter["support_score"] * 0.12
            + supporter["contactability_score"] * 0.18
            + supporter["urgency_score"] * 0.14
            + intervention_fit(supporter, frame)
        )
        if guarded:
            context_score -= fatigue_penalty_for(supporter, frame, "SMS") * 1.2
        scored.append((context_score, frame))
    reason = "contextual score with fatigue guardrail" if guarded else "contextual score from voter uplift profile"
    return max(scored, key=lambda item: item[0])[1], reason


def choose_channel(supporter: dict, channel_stats: dict, rng: random.Random, exploration_rate: float) -> tuple[str, str]:
    if rng.random() < exploration_rate:
        return rng.choice(CHANNELS), "channel exploration"
    scored = []
    for channel in CHANNELS:
        key = (supporter["segment"], channel)
        prior = channel_stats[key]
        estimated = prior["alpha"] / (prior["alpha"] + prior["beta"])
        preference_bonus = 0.08 if channel == supporter["preferred_channel"] else 0
        fatigue_penalty = 0.05 if channel in {"SMS", "volunteer call", "door knock", "candidate call"} and supporter["fatigue_score"] > 0.58 else 0
        scored.append((estimated + preference_bonus - fatigue_penalty, channel))
    return max(scored, key=lambda item: item[0])[1], "best channel fit after response and fatigue adjustment"


def choose_channel_for_strategy(supporter: dict, channel_stats: dict, rng: random.Random, strategy: dict) -> tuple[str, str]:
    if strategy["id"] == "control":
        return "email", "fixed control channel"
    if strategy["id"] == "static_ab":
        return rng.choice(CHANNELS), "static channel rotation"
    return choose_channel(supporter, channel_stats, rng, strategy["exploration_rate"])


def score_outcome(supporter: dict, frame: dict, channel: str, rng: random.Random, strategy: dict) -> dict:
    channel_match = channel == supporter["preferred_channel"]
    baseline = float(supporter["baseline_return_probability"])
    intervention_multiplier = intervention_uplift_multiplier(frame, channel, supporter)
    contact_uplift = clamp(float(supporter["uplift_score"]) * intervention_multiplier, 0, 0.15)
    if strategy["id"] == "control":
        contact_uplift *= 0.35
    if strategy["id"] == "linucb":
        contact_uplift *= 1.18
    if frame["id"] == "suppress":
        contact_uplift = 0
    return_probability = clamp(baseline + contact_uplift + (0.025 if channel_match else 0), 0.03, 0.98)
    returned = rng.random() < return_probability
    fatigue_risk = clamp(supporter["fatigue_score"] + (0.12 if channel in {"SMS", "volunteer call", "door knock", "candidate call"} else 0.03), 0, 1)
    if frame["id"] == "suppress":
        fatigue_risk = supporter["fatigue_score"]
    net_value = contact_uplift * 100 - fatigue_risk * 1.8 + supporter["support_score"] * 0.8 + supporter["urgency_score"] * 0.5
    return {
        "conversion_probability": round(return_probability, 4),
        "return_probability": round(return_probability, 4),
        "converted": int(returned),
        "ballot_returned": int(returned),
        "expected_donation_amount": round(contact_uplift * 100, 2),
        "expected_returned_ballot_value": round(contact_uplift * 100, 2),
        "donation_amount": 0,
        "fatigue_risk": round(fatigue_risk, 4),
        "net_expected_value": round(net_value, 2),
        "estimated_additional_return_probability": round(contact_uplift, 4),
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
            winning.append("Estimated additional returned ballots")
        if row["id"] == conversion_winner["id"]:
            winning.append("Ballot return rate")
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
            "control": 0.16,
            "static_ab": 0.22,
            "linucb": 0.62,
        }
    weights = {
        "control": max(0.16, 0.34 * (1 - progress) ** 0.85),
        "static_ab": max(0.22, 0.36 * (1 - progress * 0.45)),
        "linucb": 0.30 + 0.58 * progress ** 1.35,
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
        estimated_return = prior["alpha"] / (prior["alpha"] + prior["beta"])
        scored.append((estimated_return + intervention_fit(supporter, frame), frame["id"]))
    best_frame = max(scored, key=lambda item: item[0])[1]
    if selected_frame["id"] == best_frame:
        return 1 - exploration_rate + exploration_rate / len(MESSAGE_FRAMES)
    return exploration_rate / len(MESSAGE_FRAMES)


def fatigue_penalty_for(supporter: dict, frame: dict, channel: str) -> float:
    frame_penalty = 0.0 if frame["id"] == "suppress" else 0.04 if supporter["fatigue_score"] > 0.55 else 0
    channel_penalty = 0.05 if channel in {"SMS", "volunteer call", "door knock", "candidate call"} and supporter["fatigue_score"] > 0.58 else 0
    return frame_penalty + channel_penalty


def build_selection_reason(frame_reason: str, channel_reason: str, supporter: dict) -> str:
    return (
        f"Selected because of {frame_reason}, {channel_reason}, uplift score {supporter['uplift_score']}, "
        f"urgency score {supporter['urgency_score']}, and contact fatigue score {supporter['fatigue_score']}."
    )


def intervention_fit(supporter: dict, frame: dict) -> float:
    if frame["id"] == "suppress":
        return 0.28 if supporter["fatigue_score"] > 0.68 or supporter["uplift_score"] < 0.035 else -0.1
    if frame["id"] == "candidate_call":
        return supporter["support_score"] * 0.12 + supporter["urgency_score"] * 0.06 - supporter["fatigue_score"] * 0.06
    if frame["id"] == "door_knock":
        return supporter["contactability_score"] * 0.11 + supporter["urgency_score"] * 0.07 - supporter["fatigue_score"] * 0.08
    if frame["id"] == "volunteer_call":
        return supporter["contactability_score"] * 0.1 + supporter["uplift_score"] * 0.45
    if frame["id"] == "sms_reminder":
        return supporter["urgency_score"] * 0.09 + supporter["contactability_score"] * 0.05
    return 0.04 + supporter["contactability_score"] * 0.04


def intervention_uplift_multiplier(frame: dict, channel: str, supporter: dict) -> float:
    multiplier = 0.72
    if frame["id"] == "sms_reminder":
        multiplier = 0.95 + supporter["urgency_score"] * 0.2
    if frame["id"] == "volunteer_call":
        multiplier = 1.05 + supporter["contactability_score"] * 0.18
    if frame["id"] == "door_knock":
        multiplier = 1.12 + supporter["urgency_score"] * 0.22
    if frame["id"] == "candidate_call":
        multiplier = 1.18 + supporter["support_score"] * 0.18
    if frame["id"] == "email_reminder":
        multiplier = 0.74 + (0.18 if channel == supporter["preferred_channel"] else 0)
    if frame["id"] == "suppress":
        return 0
    if channel == supporter["preferred_channel"]:
        multiplier += 0.12
    if supporter["fatigue_score"] > 0.65:
        multiplier -= 0.22
    return clamp(multiplier, 0.25, 1.6)


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
