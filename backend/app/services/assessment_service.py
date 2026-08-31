from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.assessment import (
    Assessment,
    AssessmentAnswer,
    AssessmentAttempt,
    AssessmentQuestion,
)
from app.schemas.assessment import AssessmentCreate, AssessmentSubmitRequest


def create_assessment(
    db: Session,
    assessment_data: AssessmentCreate,
) -> Assessment:

    assessment = Assessment(
        title=assessment_data.title,
        description=assessment_data.description,
    )

    db.add(assessment)
    db.flush()

    for question_data in assessment_data.questions:
        question = AssessmentQuestion(
            assessment_id=assessment.id,
            competency_id=question_data.competency_id,
            question_text=question_data.question_text,
            options=question_data.options,
            correct_answer=question_data.correct_answer,
            difficulty=question_data.difficulty,
            explanation=question_data.explanation,
        )

        db.add(question)

    db.commit()
    db.refresh(assessment)

    return assessment


def get_assessment(
    db: Session,
    assessment_id: int,
) -> Assessment | None:

    return db.scalar(
        select(Assessment).where(
            Assessment.id == assessment_id,
            Assessment.is_active.is_(True),
        )
    )


def get_assessment_questions(
    db: Session,
    assessment_id: int,
) -> list[AssessmentQuestion]:

    return list(
        db.scalars(
            select(AssessmentQuestion)
            .where(
                AssessmentQuestion.assessment_id == assessment_id,
            )
            .order_by(AssessmentQuestion.id)
        ).all()
    )


def submit_assessment(
    db: Session,
    user_id: int,
    assessment_id: int,
    submission: AssessmentSubmitRequest,
) -> AssessmentAttempt:

    assessment = get_assessment(db, assessment_id)

    if not assessment:
        raise ValueError("Assessment not found")

    questions = get_assessment_questions(
        db,
        assessment_id,
    )

    if not questions:
        raise ValueError("Assessment has no questions")

    question_map = {
        question.id: question
        for question in questions
    }

    submitted_question_ids = [
        answer.question_id
        for answer in submission.answers
    ]

    # Validate question IDs before creating an attempt
    invalid_question_ids = [
        question_id
        for question_id in submitted_question_ids
        if question_id not in question_map
    ]

    if invalid_question_ids:
        raise ValueError(
            f"Invalid question ID(s): {invalid_question_ids}"
        )

    # Prevent duplicate answers for the same question
    if len(submitted_question_ids) != len(
        set(submitted_question_ids)
    ):
        raise ValueError(
            "Duplicate question IDs are not allowed"
        )

    attempt = AssessmentAttempt(
        user_id=user_id,
        assessment_id=assessment_id,
        score=0,
        total_questions=len(questions),
        percentage=0.0,
    )

    db.add(attempt)
    db.flush()

    score = 0

    for submitted_answer in submission.answers:

        question = question_map[submitted_answer.question_id]

        is_correct = (
            submitted_answer.selected_answer
            == question.correct_answer
        )

        if is_correct:
            score += 1

        answer = AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_answer=submitted_answer.selected_answer,
            is_correct=is_correct,
        )

        db.add(answer)

    attempt.score = score
    attempt.percentage = round(
        (score / len(questions)) * 100,
        2,
    )

    db.commit()
    db.refresh(attempt)

    return attempt