# ============================================================
# AI ROUTES
# ============================================================
#
# Handles:
#
#   1. Skill Intelligence / Skill Analysis
#   2. Learning Recommendations
#   3. AI Quiz Generation from uploaded documents
#
# AI provider:
#   Gemini
#
# Important:
#   Gemini API key is used only on the backend.
#
# Quiz generation does NOT directly create database
# assessments yet. It generates a validated quiz preview.
# Trainer approval + existing Assessment creation will be
# handled in the next phase.
# ============================================================

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.schemas.ai import (
    LearningRecommendationResponse,
    SkillAnalysisRequest,
    SkillAnalysisResponse,
)

from app.schemas.quiz import (
    GeneratedQuiz,
    QuizGenerationResponse,
)

from app.services.ai_service import analyse_user_skills

from app.services.document_service import (
    DocumentServiceError,
    extract_document_text,
)

from app.services.quiz_generation_service import (
    QuizGenerationError,
    generate_quiz_from_text,
)

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
        use_ai=True,
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
    the learner's current competency skill gaps.

    Recommendation generation is deterministic and
    uses the curated learning catalogue.

    Gemini is intentionally disabled for this endpoint
    because AI-generated interpretation is not required
    for catalogue matching.
    """

    # --------------------------------------------------------
    # For recommendations, only authoritative competency
    # and skill-gap data is required.
    #
    # use_ai=False prevents an unnecessary Gemini request
    # and helps conserve API usage limits.
    # --------------------------------------------------------

    items = analyse_user_skills(
        db=db,
        user_id=current_user.id,
        competency_id=request.competency_id,
        use_ai=False,
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


# ============================================================
# AI QUIZ GENERATION
# ============================================================
#
# Flow:
#
#   Trainer
#      ↓
#   Upload PDF / PPTX / TXT
#      ↓
#   document_service.py
#      ↓
#   Extracted Text
#      ↓
#   quiz_generation_service.py
#      ↓
#   Gemini
#      ↓
#   GeneratedQuiz
#      ↓
#   Backend/Pydantic validation
#      ↓
#   Trainer Preview
#
# NOTE:
#   This endpoint DOES NOT publish or save the assessment.
#   The generated quiz must be reviewed by the trainer first.
# ============================================================


@router.post(
    "/generate-quiz",
    response_model=QuizGenerationResponse,
)
async def generate_quiz(
    file: UploadFile = File(...),
    question_count: int = Form(default=10),
    difficulty: str | None = Form(default=None),
    competency_name: str | None = Form(default=None),
    current_user=Depends(get_current_user),
):
    """
    Generate an AI-powered quiz from an uploaded document.

    Supported document formats:
        PDF
        PPTX
        TXT

    The document is processed entirely by the backend.

    Gemini receives extracted text rather than the raw file.

    The endpoint returns a generated quiz for trainer review.
    It does not directly create an Assessment database record.
    """

    # ========================================================
    # BASIC FILE VALIDATION
    # ========================================================

    if not file.filename:
        raise DocumentServiceError(
            "Uploaded file must have a filename."
        )

    # --------------------------------------------------------
    # Read uploaded file
    # --------------------------------------------------------

    try:
        content = await file.read()

    except Exception as exc:
        raise DocumentServiceError(
            "Unable to read the uploaded document."
        ) from exc

    if not content:
        raise DocumentServiceError(
            "Uploaded document is empty."
        )

    # ========================================================
    # DOCUMENT TEXT EXTRACTION
    # ========================================================

    try:
        extracted_text = extract_document_text(
            content=content,
            filename=file.filename,
        )

    except DocumentServiceError:
        # Keep document-service errors meaningful so the API
        # layer does not hide the actual validation problem.
        raise

    # ========================================================
    # NORMALIZE OPTIONAL PARAMETERS
    # ========================================================

    normalized_difficulty = (
        difficulty.strip().lower()
        if difficulty
        else None
    )

    normalized_competency = (
        competency_name.strip()
        if competency_name
        else None
    )

    # ========================================================
    # GEMINI QUIZ GENERATION
    # ========================================================

    try:
        generated_quiz_data = generate_quiz_from_text(
            source_text=extracted_text,
            question_count=question_count,
            difficulty=normalized_difficulty,
            competency_name=normalized_competency,
        )

    except QuizGenerationError:
        # The service already provides meaningful exceptions.
        # Re-raise rather than hiding the original problem.
        raise

    # ========================================================
    # FINAL PYDANTIC VALIDATION
    # ========================================================
    #
    # quiz_generation_service already performs validation.
    #
    # This second validation layer ensures that the object
    # returned by the route strictly follows the public API
    # schema before it leaves FastAPI.
    # ========================================================

    validated_quiz = GeneratedQuiz.model_validate(
        generated_quiz_data
    )

    # ========================================================
    # SOURCE FILE TYPE
    # ========================================================

    filename_lower = file.filename.lower()

    if filename_lower.endswith(".pdf"):
        source_type = "pdf"

    elif filename_lower.endswith(".pptx"):
        source_type = "pptx"

    elif filename_lower.endswith(".txt"):
        source_type = "txt"

    else:
        # document_service should already reject this.
        source_type = "unknown"

    # ========================================================
    # RESPONSE
    # ========================================================

    return QuizGenerationResponse(
        quiz=validated_quiz,
        source_filename=file.filename,
        source_type=source_type,
        question_count=len(
            validated_quiz.questions
        ),
        ai_generated=True,
        source_note=(
            "Questions were generated by Gemini from "
            "the uploaded learning material and validated "
            "by the backend. Trainer review is required "
            "before publishing the assessment."
        ),
    )