from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.assessment import (
    Assessment,
    AssessmentAssignment,
    AssessmentAnswer,
    AssessmentAttempt,
    AssessmentQuestion,
)
from app.db.models.competency import Competency, UserCompetency
from app.db.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentQuestionCreate,
    AssessmentQuestionUpdate,
    AssessmentUpdate,
    AssessmentSubmitRequest,
    AssessmentAssignmentCreate,
    AssessmentAssignmentFeedback,
)


def create_assessment(
    db: Session,
    assessment_data: AssessmentCreate,
) -> Assessment:

    validate_question_data(db, assessment_data.questions)

    assessment = Assessment(
        title=assessment_data.title,
        description=assessment_data.description,
    )

    try:
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

    except Exception:
        db.rollback()
        raise


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


def get_all_active_assessments(
    db: Session,
) -> list[Assessment]:

    return list(
        db.scalars(
            select(Assessment)
            .where(
                Assessment.is_active.is_(True)
            )
            .order_by(
                Assessment.created_at.desc()
            )
        ).all()
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


def get_attempt_by_id(
    db: Session,
    attempt_id: int,
    user_id: int,
) -> AssessmentAttempt | None:

    return db.scalar(
        select(AssessmentAttempt).where(
            AssessmentAttempt.id == attempt_id,
            AssessmentAttempt.user_id == user_id,
        )
    )


def get_user_attempts(
    db: Session,
    user_id: int,
) -> list[AssessmentAttempt]:

    return list(
        db.scalars(
            select(AssessmentAttempt)
            .where(
                AssessmentAttempt.user_id == user_id,
            )
            .order_by(
                AssessmentAttempt.completed_at.desc()
            )
        ).all()
    )


def get_assignment_response(db: Session, assignment: AssessmentAssignment) -> dict:
    attempt = db.scalar(
        select(AssessmentAttempt)
        .where(
            AssessmentAttempt.assessment_id == assignment.assessment_id,
            AssessmentAttempt.user_id == assignment.learner_id,
        )
        .order_by(AssessmentAttempt.completed_at.desc())
    )
    return {
        "id": assignment.id,
        "assessment_id": assignment.assessment_id,
        "learner_id": assignment.learner_id,
        "assigned_by": assignment.assigned_by,
        "status": assignment.status,
        "assigned_at": assignment.assigned_at,
        "due_at": assignment.due_at,
        "completed_at": assignment.completed_at,
        "feedback": assignment.feedback,
        "reviewed_at": assignment.reviewed_at,
        "assessment": assignment.assessment,
        "learner_email": assignment.learner.email,
        "attempt": attempt,
        "answers": get_attempt_answers(db, attempt.id) if attempt else [],
    }


def create_assignment(db: Session, assigned_by: int, assignment_data: AssessmentAssignmentCreate) -> AssessmentAssignment:
    assessment = db.scalar(select(Assessment).where(Assessment.id == assignment_data.assessment_id, Assessment.is_active.is_(True)))
    learner = db.scalar(select(User).where(User.id == assignment_data.learner_id))
    if assessment is None:
        raise ValueError("Active assessment not found")
    if learner is None or learner.role != "learner":
        raise ValueError("Learner not found")
    existing = db.scalar(select(AssessmentAssignment).where(AssessmentAssignment.assessment_id == assignment_data.assessment_id, AssessmentAssignment.learner_id == assignment_data.learner_id, AssessmentAssignment.status.in_(["assigned", "completed"])))
    if existing is not None:
        raise ValueError("Assessment is already assigned to this learner")
    assignment = AssessmentAssignment(assigned_by=assigned_by, **assignment_data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def get_learner_assignments(db: Session, learner_id: int) -> list[dict]:
    assignments = db.scalars(select(AssessmentAssignment).where(AssessmentAssignment.learner_id == learner_id).order_by(AssessmentAssignment.assigned_at.desc())).all()
    return [get_assignment_response(db, assignment) for assignment in assignments]


def get_review_assignments(db: Session) -> list[dict]:
    assignments = db.scalars(select(AssessmentAssignment).order_by(AssessmentAssignment.assigned_at.desc())).all()
    return [get_assignment_response(db, assignment) for assignment in assignments]


def get_assignment_for_user(db: Session, assignment_id: int, user_id: int, is_tester: bool = False) -> dict | None:
    assignment = db.get(AssessmentAssignment, assignment_id)
    if assignment is None or (not is_tester and assignment.learner_id != user_id):
        return None
    return get_assignment_response(db, assignment)


def review_assignment(db: Session, assignment_id: int, feedback_data: AssessmentAssignmentFeedback) -> dict:
    assignment = db.get(AssessmentAssignment, assignment_id)
    if assignment is None:
        raise ValueError("Assessment assignment not found")
    assignment.feedback = feedback_data.feedback
    assignment.status = "reviewed"
    assignment.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assignment)
    return get_assignment_response(db, assignment)


def get_attempt_answers(
    db: Session,
    attempt_id: int,
) -> list[AssessmentAnswer]:

    return list(
        db.scalars(
            select(AssessmentAnswer)
            .where(
                AssessmentAnswer.attempt_id == attempt_id,
            )
            .order_by(AssessmentAnswer.id)
        ).all()
    )


def percentage_to_level(
    percentage: float,
) -> int:
    """
    Convert assessment percentage into competency level.

    0-39   -> Level 1
    40-59  -> Level 2
    60-74  -> Level 3
    75-89  -> Level 4
    90-100 -> Level 5
    """

    if percentage < 40:
        return 1

    if percentage < 60:
        return 2

    if percentage < 75:
        return 3

    if percentage < 90:
        return 4

    return 5


def update_user_competencies(
    db: Session,
    user_id: int,
    questions: list[AssessmentQuestion],
    submitted_answers: list,
) -> None:
    """
    Update learner competency levels based on
    assessment performance.

    Questions are grouped by competency so one
    assessment can evaluate multiple competencies.
    """

    competency_questions: dict[
        int,
        list[AssessmentQuestion]
    ] = defaultdict(list)

    for question in questions:
        competency_questions[
            question.competency_id
        ].append(question)

    submitted_answer_map = {
        answer.question_id: answer
        for answer in submitted_answers
    }

    for (
        competency_id,
        competency_question_list,
    ) in competency_questions.items():

        competency_score = 0
        competency_total = len(
            competency_question_list
        )

        for question in competency_question_list:

            submitted_answer = submitted_answer_map.get(
                question.id
            )

            if submitted_answer is None:
                continue

            if (
                submitted_answer.selected_answer
                == question.correct_answer
            ):
                competency_score += 1

        if competency_total == 0:
            continue

        competency_percentage = round(
            (
                competency_score
                / competency_total
            ) * 100,
            2,
        )

        new_level = percentage_to_level(
            competency_percentage
        )

        user_competency = db.scalar(
            select(UserCompetency).where(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id
                == competency_id,
            )
        )

        if user_competency is None:

            user_competency = UserCompetency(
                user_id=user_id,
                competency_id=competency_id,
                current_level=new_level,
                required_level=1,
            )

            db.add(user_competency)

        else:

            user_competency.current_level = new_level


def submit_assessment(
    db: Session,
    user_id: int,
    assessment_id: int,
    submission: AssessmentSubmitRequest,
) -> AssessmentAttempt:

    assessment = get_assessment(
        db,
        assessment_id,
    )

    if not assessment:
        raise ValueError(
            "Assessment not found"
        )

    questions = get_assessment_questions(
        db,
        assessment_id,
    )

    if not questions:
        raise ValueError(
            "Assessment has no questions"
        )

    question_map = {
        question.id: question
        for question in questions
    }

    submitted_question_ids = [
        answer.question_id
        for answer in submission.answers
    ]

    # -------------------------------------------------
    # Validate question IDs
    # -------------------------------------------------

    invalid_question_ids = [
        question_id
        for question_id in submitted_question_ids
        if question_id not in question_map
    ]

    if invalid_question_ids:
        raise ValueError(
            f"Invalid question ID(s): "
            f"{invalid_question_ids}"
        )

    # -------------------------------------------------
    # Prevent duplicate answers
    # -------------------------------------------------

    if len(submitted_question_ids) != len(
        set(submitted_question_ids)
    ):
        raise ValueError(
            "Duplicate question IDs are not allowed"
        )

    # -------------------------------------------------
    # Validate selected answers
    # -------------------------------------------------

    for submitted_answer in submission.answers:

        question = question_map[
            submitted_answer.question_id
        ]

        if (
            submitted_answer.selected_answer
            not in question.options
        ):
            raise ValueError(
                f"Invalid answer option for "
                f"question {question.id}"
            )

    # -------------------------------------------------
    # Create attempt
    # -------------------------------------------------

    attempt = AssessmentAttempt(
        user_id=user_id,
        assessment_id=assessment_id,
        score=0,
        total_questions=len(questions),
        percentage=0.0,
    )

    try:
        db.add(attempt)
        db.flush()

        score = 0

        for submitted_answer in submission.answers:

            question = question_map[
                submitted_answer.question_id
            ]

            is_correct = (
                submitted_answer.selected_answer
                == question.correct_answer
            )

            if is_correct:
                score += 1

            answer = AssessmentAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_answer=(
                    submitted_answer.selected_answer
                ),
                is_correct=is_correct,
            )

            db.add(answer)

        attempt.score = score

        attempt.percentage = round(
            (
                score
                / len(questions)
            ) * 100,
            2,
        )

        # Update learner competency levels.
        update_user_competencies(
            db=db,
            user_id=user_id,
            questions=questions,
            submitted_answers=submission.answers,
        )

        assignments = db.scalars(
            select(AssessmentAssignment).where(
                AssessmentAssignment.assessment_id == assessment_id,
                AssessmentAssignment.learner_id == user_id,
                AssessmentAssignment.status == "assigned",
            )
        ).all()
        for assignment in assignments:
            assignment.status = "completed"
            assignment.completed_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(attempt)

        return attempt

    except Exception:
        db.rollback()
        raise


def validate_question_data(
    db: Session,
    questions: list[AssessmentQuestionCreate],
) -> None:
    for question_data in questions:
        if len(set(question_data.options)) != len(question_data.options):
            raise ValueError("Question options must be unique")
        if question_data.correct_answer not in question_data.options:
            raise ValueError("Correct answer must be one of the options")
        if db.scalar(select(Competency).where(Competency.id == question_data.competency_id)) is None:
            raise ValueError("Competency not found")


def get_manage_assessment(db: Session, assessment_id: int) -> Assessment | None:
    return db.scalar(select(Assessment).where(Assessment.id == assessment_id))


def update_assessment(db: Session, assessment_id: int, assessment_data: AssessmentUpdate) -> Assessment:
    assessment = get_manage_assessment(db, assessment_id)
    if assessment is None:
        raise ValueError("Assessment not found")
    for field, value in assessment_data.model_dump(exclude_unset=True).items():
        setattr(assessment, field, value)
    db.commit()
    db.refresh(assessment)
    return assessment


def delete_assessment(db: Session, assessment_id: int) -> None:
    assessment = get_manage_assessment(db, assessment_id)
    if assessment is None:
        raise ValueError("Assessment not found")
    if db.scalar(select(AssessmentAttempt.id).where(AssessmentAttempt.assessment_id == assessment_id)) is not None:
        raise ValueError("Assessment has learner attempts and cannot be deleted")
    db.delete(assessment)
    db.commit()


def add_assessment_question(db: Session, assessment_id: int, question_data: AssessmentQuestionCreate) -> AssessmentQuestion:
    if get_manage_assessment(db, assessment_id) is None:
        raise ValueError("Assessment not found")
    validate_question_data(db, [question_data])
    question = AssessmentQuestion(assessment_id=assessment_id, **question_data.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def update_assessment_question(db: Session, question_id: int, question_data: AssessmentQuestionUpdate) -> AssessmentQuestion:
    question = db.get(AssessmentQuestion, question_id)
    if question is None:
        raise ValueError("Assessment question not found")
    data = question_data.model_dump(exclude_unset=True)
    candidate = AssessmentQuestionCreate(
        competency_id=data.get("competency_id", question.competency_id),
        question_text=data.get("question_text", question.question_text),
        options=data.get("options", question.options),
        correct_answer=data.get("correct_answer", question.correct_answer),
        difficulty=data.get("difficulty", question.difficulty),
        explanation=data.get("explanation", question.explanation),
    )
    validate_question_data(db, [candidate])
    for field, value in data.items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question


def delete_assessment_question(db: Session, question_id: int) -> None:
    question = db.get(AssessmentQuestion, question_id)
    if question is None:
        raise ValueError("Assessment question not found")
    if db.scalar(select(AssessmentAnswer.id).where(AssessmentAnswer.question_id == question_id)) is not None:
        raise ValueError("Question has learner answers and cannot be deleted")
    db.delete(question)
    db.commit()