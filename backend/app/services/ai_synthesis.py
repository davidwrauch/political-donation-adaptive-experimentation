from __future__ import annotations

from .simulation import MESSAGE_FRAMES


def synthesize_recommendation(summary: dict) -> dict:
    best_segment = summary["best_segment"]
    best_frame = summary["best_message_frame"]
    best_channel = max(summary["channel_performance"], key=lambda row: row["net_expected_value"])
    template = next(frame for frame in MESSAGE_FRAMES if frame["id"] == best_frame["id"])
    lower_fatigue = "lower fatigue risk" if best_frame["fatigue_risk"] < 0.38 else "fatigue risk that requires monitoring"

    return {
        "approved_message_templates": MESSAGE_FRAMES,
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
