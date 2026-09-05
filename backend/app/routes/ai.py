from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.schemas.ai import (
    LearningRecommendationResponse,
    SkillAnalysisRequest,
    SkillAnalysisResponse,
)
from app.services.ai_service import analyse_user_skills
from app.services.recommendation_service import (
    get_learning_recommendations,
)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


# ============================================================
# SKILL INTELLIGENCE
# ============================================================


@router.post(
    "/skill-analysis",
    response_model=SkillAnalysisResponse,
)
def skill_analysis(
    request: SkillAnalysisRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Analyse the current user's competency profile.

    Backend calculates:
        current level
        required level
        skill gap
        status
        priority
        assessment performance

    Gemini provides:
        analysis
        strengths
        weaknesses
        recommended focus

    If Gemini is unavailable, deterministic fallback
    analysis is returned.
    """

    items = analyse_user_skills(
        db=db,
        user_id=current_user.id,
        competency_id=request.competency_id,
    )

    # --------------------------------------------------------
    # Determine whether at least one result was AI-generated
    # --------------------------------------------------------

    ai_available = any(
        item.get("ai_generated", False)
        for item in items
    )

    return SkillAnalysisResponse(
        generated_for_user_id=current_user.id,
        ai_available=ai_available,
        items=items,
    )


# ============================================================
# LEARNING RECOMMENDATIONS
# ============================================================


@router.post(
    "/recommendations",
    response_model=LearningRecommendationResponse,
)
def recommendations(
    request: SkillAnalysisRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Generate learning recommendations based on
    the learner's skill gaps.
    """

    items = analyse_user_skills(
        db=db,
        user_id=current_user.id,
        competency_id=request.competency_id,
    )

    recommendations = get_learning_recommendations(
        items=items,
    )

    return LearningRecommendationResponse(
        recommendations=recommendations,
        source_note=(
            "Recommendations are based on the current "
            "prototype learning catalogue. Live iGOT "
            "integration requires an authorized API or "
            "approved integration mechanism."
        ),
    )