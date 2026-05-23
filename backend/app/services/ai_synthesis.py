from __future__ import annotations

from .simulation import MESSAGE_FRAMES


def synthesize_recommendation(summary: dict) -> dict:
    best_segment = summary["best_segment"]
    best_frame = summary["best_message_frame"]
    best_channel = summary["best_channel"]
    template = next(frame for frame in MESSAGE_FRAMES if frame["id"] == best_frame["id"])
    lower_fatigue = "lower fatigue risk" if best_frame["fatigue_risk"] < 0.38 else "fatigue risk that requires monitoring"
    latest = summary["latest_decision"]

    return {
        "approved_message_templates": MESSAGE_FRAMES,
        "segment_context": {
            "segment": best_segment["label"],
            "conversion_rate": best_segment["conversion_rate"],
            "expected_value": best_segment["net_expected_value"],
            "fatigue_risk": best_segment["fatigue_risk"],
        },
        "issue_affinity_summary": {
            "priority_segment": best_segment["label"],
            "dominant_frame": best_frame["label"],
            "interpretation": (
                f"{best_segment['label']} is currently the strongest segment by net expected value, "
                f"with {best_frame['label']} as the leading frame."
            ),
        },
        "recommended_message_frame_by_segment": {
            best_segment["label"]: {
                "frame": best_frame["label"],
                "channel": best_channel["label"],
                "conversion_rate": best_segment["conversion_rate"],
                "net_expected_value": best_segment["net_expected_value"],
            }
        },
        "recommended_outreach_strategy": (
            f"Prioritize {best_segment['label']} with {best_frame['label']} over {best_channel['label']}."
        ),
        "recommended_message_frame": best_frame["label"],
        "recommended_channel": best_channel["label"],
        "why_prioritized": (
            f"This segment combines strong donation conversion, high net expected value, and an issue-frame match."
        ),
        "fatigue_risk": best_segment["fatigue_risk"],
        "risk_note": (
            "Keep fatigue and exposure caps active. Do not maximize donations at all costs or overreact to one batch."
        ),
        "decision_explanation": {
            "expected_reward": latest["expected_reward"],
            "uncertainty": latest["uncertainty"],
            "exploration_need": latest["exploration_need"],
            "fatigue_penalty": latest["fatigue_penalty"],
            "channel_fit": latest["channel_fit"],
            "selection_reason": latest["selection_reason"],
        },
        "generated_rationale": (
            f"For {best_segment['label']}, use a {best_frame['label'].lower()} frame over "
            f"{best_channel['label']} because this segment shows stronger response, "
            f"higher expected donation value, and {lower_fatigue}. Messaging should remain "
            "human-reviewed before use."
        ),
        "sample_template": template["template"],
        "human_review_required": True,
        "warning": "This is AI-assisted campaign research synthesis, not autonomous persuasion. All messaging requires human review.",
        "retrieved_evidence": [
            f"Best segment conversion rate: {best_segment['conversion_rate']:.1%}",
            f"Best frame net expected value: ${best_frame['net_expected_value']:.2f}",
            f"Best channel response rate: {best_channel['conversion_rate']:.1%}",
        ],
    }
