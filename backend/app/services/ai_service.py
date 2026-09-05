from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.assessment import (
    AssessmentAnswer,
    AssessmentAttempt,
    AssessmentQuestion,
)
from app.db.models.competency import Competency, UserCompetency


# ============================================================
# GEMINI STRUCTURED OUTPUT MODELS
# ============================================================


class GeminiSkillAnalysisItem(BaseModel):
    competency_id: int
    competency_name: str
    analysis: str
    strengths: list[str] = Field(
        default_factory=list
    )
    weaknesses: list[str] = Field(
        default_factory=list
    )
    recommended_focus: list[str] = Field(
        default_factory=list
    )


class GeminiSkillAnalysisResponse(BaseModel):
    items: list[GeminiSkillAnalysisItem] = Field(
        default_factory=list
    )


# ============================================================
# SKILL GAP HELPERS
# ============================================================


def _priority_from_gap(gap: float) -> str:
    """
    Convert numerical skill gap into a priority level.
    """

    if gap <= 0:
        return "LOW"

    if gap <= 1:
        return "MEDIUM"

    if gap <= 2:
        return "HIGH"

    return "CRITICAL"


def _status_from_gap(gap: float) -> str:
    """
    Determine the learner's competency status.
    """

    if gap <= 0:
        return "MEETS_REQUIRED_LEVEL"

    if gap <= 1:
        return "MINOR_GAP"

    if gap <= 2:
        return "SIGNIFICANT_GAP"

    return "MAJOR_GAP"


# ============================================================
# OVERALL ASSESSMENT PERFORMANCE
# ============================================================


def _get_overall_assessment_performance(
    db: Session,
    user_id: int,
) -> dict[str, Any]:
    """
    Get overall assessment performance for a learner.

    AssessmentAttempt uses completed_at, not created_at.
    """

    attempts = db.scalars(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.user_id == user_id
        )
        .order_by(
            AssessmentAttempt.completed_at.asc()
        )
    ).all()

    if not attempts:
        return {
            "attempts": 0,
            "latest_percentage": None,
            "best_percentage": None,
        }

    percentages: list[float] = []

    for attempt in attempts:
        percentage = getattr(
            attempt,
            "percentage",
            None,
        )

        if percentage is not None:
            percentages.append(
                float(percentage)
            )
            continue

        score = getattr(
            attempt,
            "score",
            None,
        )

        total_questions = getattr(
            attempt,
            "total_questions",
            None,
        )

        if (
            score is not None
            and total_questions
            and total_questions > 0
        ):
            calculated_percentage = (
                float(score)
                / float(total_questions)
            ) * 100

            percentages.append(
                calculated_percentage
            )

    latest_percentage = (
        round(percentages[-1], 2)
        if percentages
        else None
    )

    best_percentage = (
        round(max(percentages), 2)
        if percentages
        else None
    )

    return {
        "attempts": len(attempts),
        "latest_percentage": latest_percentage,
        "best_percentage": best_percentage,
    }


# ============================================================
# COMPETENCY-SPECIFIC ACCURACY
# ============================================================


def _get_competency_accuracy(
    db: Session,
    user_id: int,
    competency_id: int,
) -> float | None:
    """
    Calculate assessment accuracy for a particular competency.
    """

    answers = db.scalars(
        select(AssessmentAnswer)
        .join(
            AssessmentAttempt,
            AssessmentAnswer.attempt_id
            == AssessmentAttempt.id,
        )
        .join(
            AssessmentQuestion,
            AssessmentAnswer.question_id
            == AssessmentQuestion.id,
        )
        .where(
            AssessmentAttempt.user_id == user_id,
            AssessmentQuestion.competency_id
            == competency_id,
        )
    ).all()

    if not answers:
        return None

    correct_answers = sum(
        1
        for answer in answers
        if answer.is_correct is True
    )

    accuracy = (
        correct_answers
        / len(answers)
    ) * 100

    return round(
        accuracy,
        2,
    )


# ============================================================
# COMBINED ASSESSMENT PERFORMANCE
# ============================================================


def _get_assessment_performance(
    db: Session,
    user_id: int,
    competency_id: int,
) -> dict[str, Any]:
    """
    Combine overall assessment performance and
    competency-specific accuracy.
    """

    overall = (
        _get_overall_assessment_performance(
            db=db,
            user_id=user_id,
        )
    )

    competency_accuracy = (
        _get_competency_accuracy(
            db=db,
            user_id=user_id,
            competency_id=competency_id,
        )
    )

    return {
        "attempts": overall["attempts"],
        "latest_percentage": overall[
            "latest_percentage"
        ],
        "best_percentage": overall[
            "best_percentage"
        ],
        "competency_accuracy": competency_accuracy,
    }


# ============================================================
# FALLBACK ANALYSIS
# ============================================================


def _fallback_analysis(
    item: dict[str, Any],
) -> dict[str, Any]:
    """
    Deterministic fallback when Gemini is unavailable.

    This keeps Skill Intelligence functional even when:
        - AI is disabled
        - Gemini is unavailable
        - Gemini request fails
        - Gemini returns invalid structured output
    """

    gap = float(
        item["gap"]
    )

    current_level = float(
        item["current_level"]
    )

    required_level = float(
        item["required_level"]
    )

    competency_name = item[
        "competency_name"
    ]

    strengths: list[str] = []
    weaknesses: list[str] = []
    recommended_focus: list[str] = []

    # --------------------------------------------------------
    # Strengths
    # --------------------------------------------------------

    if current_level >= required_level:

        strengths.append(
            f"Current proficiency in "
            f"{competency_name} meets the "
            f"required level."
        )

    elif current_level >= 3:

        strengths.append(
            f"The learner has a reasonably "
            f"strong foundation in "
            f"{competency_name}."
        )

    elif current_level >= 2:

        strengths.append(
            f"The learner has a basic "
            f"understanding of "
            f"{competency_name}."
        )

    else:

        strengths.append(
            f"{competency_name} can be developed "
            f"through foundational learning."
        )

    # --------------------------------------------------------
    # Weaknesses
    # --------------------------------------------------------

    if gap > 0:

        weaknesses.append(
            f"There is a {round(gap, 2)} level "
            f"gap between the current and "
            f"required proficiency in "
            f"{competency_name}."
        )

    else:

        weaknesses.append(
            f"No significant proficiency gap "
            f"was detected for "
            f"{competency_name}."
        )

    competency_accuracy = item[
        "assessment_performance"
    ].get(
        "competency_accuracy"
    )

    if competency_accuracy is not None:

        if competency_accuracy < 50:

            weaknesses.append(
                "Assessment performance indicates "
                "that this competency needs "
                "additional practice."
            )

        elif competency_accuracy < 75:

            weaknesses.append(
                "Assessment performance is moderate "
                "and could benefit from targeted "
                "practice."
            )

    # --------------------------------------------------------
    # Recommended Focus
    # --------------------------------------------------------

    if gap > 2:

        recommended_focus.extend(
            [
                (
                    f"Build foundational knowledge "
                    f"in {competency_name}."
                ),
                "Use structured learning resources.",
                "Complete regular practice assessments.",
            ]
        )

    elif gap > 1:

        recommended_focus.extend(
            [
                (
                    f"Strengthen practical application "
                    f"of {competency_name}."
                ),
                "Focus on identified weak areas.",
                "Complete targeted assessments.",
            ]
        )

    elif gap > 0:

        recommended_focus.extend(
            [
                (
                    f"Improve specific areas of "
                    f"{competency_name}."
                ),
                "Use targeted learning resources.",
                "Reassess progress after learning.",
            ]
        )

    else:

        recommended_focus.extend(
            [
                (
                    f"Maintain proficiency in "
                    f"{competency_name}."
                ),
                (
                    "Explore advanced applications "
                    "where relevant."
                ),
            ]
        )

    return {
        "competency_id": item[
            "competency_id"
        ],
        "competency_name": competency_name,
        "analysis": (
            f"The learner currently has a "
            f"proficiency level of "
            f"{current_level} against a required "
            f"level of {required_level} in "
            f"{competency_name}. The calculated "
            f"skill gap is {round(gap, 2)}."
        ),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommended_focus": recommended_focus,
    }


# ============================================================
# GEMINI PROMPT
# ============================================================


def _build_ai_prompt(
    items: list[dict[str, Any]],
) -> str:
    """
    Build the Gemini prompt using backend-calculated data.
    """

    competency_data = []

    for item in items:

        competency_data.append(
            {
                "competency_id": item[
                    "competency_id"
                ],
                "competency_name": item[
                    "competency_name"
                ],
                "category": item[
                    "category"
                ],
                "current_level": item[
                    "current_level"
                ],
                "required_level": item[
                    "required_level"
                ],
                "gap": item[
                    "gap"
                ],
                "status": item[
                    "status"
                ],
                "priority": item[
                    "priority"
                ],
                "assessment_performance": item[
                    "assessment_performance"
                ],
            }
        )

    return f"""
You are an AI Skill Intelligence Assistant
for a government employee learning platform.

The platform helps government statistical
officials identify competency gaps and receive
personalised learning guidance.

IMPORTANT RULES:

1. Do not change numerical values.
2. current_level, required_level and gap are
   authoritative backend values.
3. Do not invent assessment scores.
4. Do not invent assessment attempts.
5. Do not invent learning resources.
6. Provide professional and practical guidance.
7. Keep the recommendations relevant to the
   competency.
8. Do not make unsupported claims about the learner.
9. Return only structured JSON matching the
   provided response schema.

For each competency provide:

analysis:
A concise interpretation of the learner's
current situation.

strengths:
1 to 3 realistic strengths.

weaknesses:
1 to 3 areas requiring improvement.

recommended_focus:
2 to 4 concrete learning or practice areas.

Learner competency data:

{competency_data}
""".strip()


# ============================================================
# GEMINI EXECUTION
# ============================================================


def _run_gemini(
    items: list[dict[str, Any]],
) -> dict[int, GeminiSkillAnalysisItem]:
    """
    Execute Gemini structured-output generation.

    Raises an exception when Gemini cannot successfully
    generate and validate the requested response.

    The caller handles the exception and activates the
    deterministic fallback.
    """

    if not settings.GEMINI_API_KEY:

        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    model_name = (
        settings.GEMINI_MODEL.strip()
    )

    if not model_name:

        raise RuntimeError(
            "GEMINI_MODEL is empty."
        )

    print(
        "[AI] Starting Gemini skill analysis..."
    )

    print(
        f"[AI] Provider: {settings.AI_PROVIDER}"
    )

    print(
        f"[AI] Model: {model_name}"
    )

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY
    )

    response = client.models.generate_content(
        model=model_name,
        contents=_build_ai_prompt(
            items
        ),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiSkillAnalysisResponse,
            temperature=0.2,
        ),
    )

    if response is None:

        raise RuntimeError(
            "Gemini returned no response object."
        )

    response_text = getattr(
        response,
        "text",
        None,
    )

    if not response_text:

        raise RuntimeError(
            "Gemini returned an empty response."
        )

    print(
        "[AI] Gemini response received successfully."
    )

    try:

        parsed = (
            GeminiSkillAnalysisResponse
            .model_validate_json(
                response_text
            )
        )

    except Exception as exc:

        raise RuntimeError(
            "Gemini returned invalid structured "
            f"output: {exc}"
        ) from exc

    if not parsed.items:

        raise RuntimeError(
            "Gemini returned an empty items list."
        )

    return {
        item.competency_id: item
        for item in parsed.items
    }


# ============================================================
# MAIN SKILL ANALYSIS
# ============================================================


def analyse_user_skills(
    db: Session,
    user_id: int,
    competency_id: int | None = None,
    use_ai: bool = True,
) -> list[dict[str, Any]]:
    """
    Main Skill Intelligence pipeline.

    Flow:

        User Competencies
                ↓
        Current Level
                ↓
        Required Level
                ↓
        Skill Gap
                ↓
        Priority / Status
                ↓
        Assessment Performance
                ↓
        Gemini Interpretation
                ↓
        Fallback if Gemini unavailable

    use_ai:
        True  -> Gemini is allowed.
        False -> deterministic backend analysis only.
    """

    query = (
        select(UserCompetency)
        .join(
            Competency,
            UserCompetency.competency_id
            == Competency.id,
        )
        .where(
            UserCompetency.user_id == user_id
        )
    )

    if competency_id is not None:

        query = query.where(
            UserCompetency.competency_id
            == competency_id
        )

    user_competencies = (
        db.scalars(query).all()
    )

    if not user_competencies:

        return []

    items: list[
        dict[str, Any]
    ] = []

    # --------------------------------------------------------
    # Build authoritative backend data
    # --------------------------------------------------------

    for user_competency in user_competencies:

        competency = (
            user_competency.competency
        )

        if competency is None:
            continue

        current_level = float(
            user_competency.current_level
        )

        required_level = float(
            user_competency.required_level
        )

        # Backend is authoritative for the skill gap.
        gap = max(
            0.0,
            required_level
            - current_level,
        )

        status = _status_from_gap(
            gap
        )

        priority = _priority_from_gap(
            gap
        )

        performance = (
            _get_assessment_performance(
                db=db,
                user_id=user_id,
                competency_id=(
                    user_competency.competency_id
                ),
            )
        )

        items.append(
            {
                "competency_id": competency.id,
                "competency_name": competency.name,
                "category": competency.category,
                "current_level": current_level,
                "required_level": required_level,
                "gap": round(gap, 2),
                "status": status,
                "priority": priority,
                "assessment_performance": performance,
            }
        )

    if not items:

        return []

    # --------------------------------------------------------
    # Determine whether Gemini should be used
    # --------------------------------------------------------

    ai_enabled = (
        use_ai
        and settings.AI_ENABLED
        and settings.AI_PROVIDER.lower()
        == "gemini"
        and bool(settings.GEMINI_API_KEY)
    )

    print(
        "[AI] --------------------------------------------------"
    )

    print(
        f"[AI] use_ai={use_ai}"
    )

    print(
        f"[AI] AI_ENABLED={settings.AI_ENABLED}"
    )

    print(
        f"[AI] AI_PROVIDER={settings.AI_PROVIDER}"
    )

    print(
        f"[AI] GEMINI_MODEL={settings.GEMINI_MODEL}"
    )

    print(
        f"[AI] GEMINI_API_KEY_SET="
        f"{bool(settings.GEMINI_API_KEY)}"
    )

    print(
        f"[AI] Gemini execution enabled={ai_enabled}"
    )

    print(
        "[AI] --------------------------------------------------"
    )

    # --------------------------------------------------------
    # Gemini execution
    # --------------------------------------------------------

    ai_results: dict[
        int,
        GeminiSkillAnalysisItem
    ] = {}

    if ai_enabled:

        try:

            ai_results = _run_gemini(
                items
            )

            print(
                "[AI] Gemini skill analysis completed."
            )

        except Exception as exc:

            print(
                "[AI] =================================================="
            )

            print(
                "[AI] GEMINI REQUEST FAILED"
            )

            print(
                f"[AI] Error type: {type(exc).__name__}"
            )

            print(
                f"[AI] Error: {exc}"
            )

            print(
                "[AI] Falling back to deterministic analysis."
            )

            print(
                "[AI] =================================================="
            )

            ai_results = {}

    elif use_ai:

        print(
            "[AI] Gemini was requested but configuration "
            "does not allow AI execution."
        )

    # --------------------------------------------------------
    # Combine backend facts + AI interpretation
    # --------------------------------------------------------

    final_items: list[
        dict[str, Any]
    ] = []

    for item in items:

        ai_item = ai_results.get(
            item["competency_id"]
        )

        if ai_item is not None:

            analysis = ai_item.analysis

            strengths = (
                ai_item.strengths
            )

            weaknesses = (
                ai_item.weaknesses
            )

            recommended_focus = (
                ai_item.recommended_focus
            )

            ai_generated = True

        else:

            fallback = _fallback_analysis(
                item
            )

            analysis = fallback[
                "analysis"
            ]

            strengths = fallback[
                "strengths"
            ]

            weaknesses = fallback[
                "weaknesses"
            ]

            recommended_focus = fallback[
                "recommended_focus"
            ]

            ai_generated = False

        final_items.append(
            {
                "competency_id": item[
                    "competency_id"
                ],
                "competency_name": item[
                    "competency_name"
                ],
                "category": item[
                    "category"
                ],
                "current_level": item[
                    "current_level"
                ],
                "required_level": item[
                    "required_level"
                ],
                "gap": item[
                    "gap"
                ],
                "status": item[
                    "status"
                ],
                "priority": item[
                    "priority"
                ],
                "analysis": analysis,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "recommended_focus": (
                    recommended_focus
                ),
                "assessment_performance": item[
                    "assessment_performance"
                ],
                "ai_generated": ai_generated,
            }
        )

    # --------------------------------------------------------
    # Sort by priority
    # --------------------------------------------------------

    priority_order = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3,
    }

    final_items.sort(
        key=lambda item: (
            priority_order.get(
                item["priority"],
                99,
            ),
            -float(
                item["gap"]
            ),
        )
    )

    return final_items