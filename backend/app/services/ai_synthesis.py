from __future__ import annotations


def synthesize_recommendation(summary: dict) -> dict:
    return {
        "base_message": (
            "Costs are too high for New York families. Rent, groceries, child care, transit, and "
            "utility bills are stretching household budgets across the state.\n\n"
            "Our campaign is organizing around practical affordability solutions and a fairer "
            "economy. Will you make a grassroots donation today to help us reach more voters before "
            "the next outreach deadline?\n\n"
            "Every contribution helps organizers talk with more neighbors, share our plan, and build "
            "support for leaders who will focus on the cost of living."
        ),
        "retrieved_context": {
            "approved_issue_brief": "Affordability / cost of living",
            "approved_tone": "Clear, direct, non-inflammatory",
            "channel_constraints": (
                "SMS drafts must be brief and easy to opt out of. Email can include more context. "
                "Door-knocking scripts should open with listening before making an ask."
            ),
            "prior_performance_note": (
                "Shorter SMS performs better for high-engagement prior donors; longer email works "
                "better for lower-engagement prospects."
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
                "id": "sms_prior_donor",
                "audience": "High-engagement prior donor",
                "medium": "SMS",
                "length": "Short",
                "message": (
                    "Costs are still too high for NY families. Can you chip in again today to help us "
                    "fight for lower everyday costs?"
                ),
                "reason": "Prior donors respond well to concise SMS reminders tied to a familiar issue frame.",
            },
            {
                "id": "email_prior_donor",
                "audience": "High-engagement prior donor",
                "medium": "Email",
                "length": "Medium",
                "message": (
                    "You have helped power this campaign before. Today, we are focused on lowering "
                    "everyday costs for New York families, and another grassroots donation would help "
                    "us reach more voters before the next outreach push."
                ),
                "reason": "Email allows a little more context while keeping the ask direct for engaged donors.",
            },
            {
                "id": "sms_prospect",
                "audience": "Lower-engagement prospect",
                "medium": "SMS",
                "length": "Very short",
                "message": (
                    "We are organizing around lower costs for NY families. Can we count on your support today?"
                ),
                "reason": "Prospects get a softer, lower-pressure SMS with no assumption of prior donation history.",
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
                "reason": "Door outreach should start with listening and issue relevance rather than an immediate donation ask.",
            },
        ],
    }
