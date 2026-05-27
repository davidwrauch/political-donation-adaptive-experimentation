from __future__ import annotations


def synthesize_recommendation(summary: dict) -> dict:
    return {
        "base_message": (
            "Costs are too high for New York families. Rent, groceries, child care, transit, and "
            "utility bills are stretching household budgets across the state.\n\n"
            "Our campaign is organizing around practical affordability solutions and a fairer "
            "economy. Our records show your mail ballot was requested but may not have been returned yet.\n\n"
            "Please return your ballot as soon as possible, and contact the campaign if you need help finding "
            "deadline, drop-off, or ballot-return information."
        ),
        "retrieved_context": {
            "approved_issue_brief": "Affordability / cost of living",
            "approved_tone": "Clear, direct, non-inflammatory",
            "channel_constraints": (
                "SMS drafts must be brief and easy to opt out of. Email can include more context. "
                "Door-knocking scripts should open with listening before making an ask."
            ),
            "prior_performance_note": (
                "High-contactability voters usually need concise, practical reminders. "
                "Lower-contactability voters often need more context, trust-building, and clear ballot-return help."
            ),
        },
        "human_review_required": True,
        "explanation": (
            "This tab shows how a constrained RAG/LLM layer could adapt an approved campaign message "
            "into channel-specific drafts. It does not send messages automatically. Staff must approve "
            "or replace every draft."
        ),
        "variants": [
            {
                "id": "sms_high_contactability",
                "audience": "High-contactability outstanding ballot voter",
                "medium": "SMS",
                "length": "Short",
                "message": (
                    "Your mail ballot is still outstanding. Please return it today if you can, and reply if you need deadline or drop-off info."
                ),
                "reason": "High-contactability voters respond well to concise practical SMS reminders.",
            },
            {
                "id": "email_ballot_help",
                "audience": "Outstanding ballot voter needing more context",
                "medium": "Email",
                "length": "Medium",
                "message": (
                    "Our records show your requested mail ballot may still be outstanding. This election affects everyday costs for New York families. Please return your ballot as soon as possible, and contact us if you need official return instructions or deadline information."
                ),
                "reason": "Email allows more context and practical ballot-return guidance.",
            },
            {
                "id": "sms_prospect",
                "audience": "Lower-engagement prospect",
                "medium": "SMS",
                "length": "Very short",
                "message": (
                    "We are organizing around lower costs for NY families. Can we count on your support today?"
                ),
                "reason": "Lower-contactability voters get a softer reminder focused on help rather than pressure.",
            },
            {
                "id": "door_script_prospect",
                "audience": "Lower-engagement prospect",
                "medium": "Door-knocking script",
                "length": "Conversational",
                "message": (
                    "Hi, I am with the campaign. We are talking with neighbors about the cost "
                    "of living and what would make life more affordable here in New York. Is that an issue "
                    "you would like to hear more about?"
                ),
                "reason": "Door outreach should start with listening and practical ballot-return help.",
            },
        ],
    }
