# ============================================================
# QUIZ GENERATION SERVICE
# ============================================================
#
# Purpose:
#   Generate structured multiple-choice questions from
#   extracted learning material using Gemini.
#
# Flow:
#
#   Document Text
#        ↓
#   Quiz Generation Service
#        ↓
#   Gemini
#        ↓
#   JSON response
#        ↓
#   Validate / normalize
#        ↓
#   Structured Quiz
#
# This service does NOT:
#   - upload files
#   - extract PDF/PPTX text
#   - create database records
#   - publish assessments
#   - update learner competencies
#
# Those responsibilities belong to other services/routes.
# ============================================================

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.core.config import settings


logger = logging.getLogger(__name__)


# ============================================================
# CONSTANTS
# ============================================================

DEFAULT_QUESTION_COUNT = 10

MIN_QUESTION_COUNT = 1
MAX_QUESTION_COUNT = 20

MAX_SOURCE_TEXT_LENGTH = 80_000

ALLOWED_DIFFICULTIES = {
    "easy",
    "medium",
    "hard",
}

REQUIRED_OPTION_COUNT = 4


# ============================================================
# CUSTOM EXCEPTIONS
# ============================================================


class QuizGenerationError(Exception):
    """
    Base exception for quiz generation errors.
    """

    pass


class AIUnavailableError(QuizGenerationError):
    """
    Raised when Gemini is disabled or unavailable.
    """

    pass


class QuizGenerationResponseError(QuizGenerationError):
    """
    Raised when Gemini returns an invalid or unusable response.
    """

    pass


# ============================================================
# GEMINI CLIENT
# ============================================================


def _get_gemini_model():
    """
    Create and return the configured Gemini client.

    Uses the modern google-genai SDK.

    The API key and model are loaded from application settings.

    Returns:
        Configured Gemini Client instance.
    """

    if not settings.AI_ENABLED:
        raise AIUnavailableError(
            "AI generation is disabled in application settings."
        )

    if settings.AI_PROVIDER.lower() != "gemini":
        raise AIUnavailableError(
            f"Unsupported AI provider: {settings.AI_PROVIDER}"
        )

    if not settings.GEMINI_API_KEY:
        raise AIUnavailableError(
            "Gemini API key is not configured."
        )

    try:
        from google import genai

    except ImportError as exc:
        raise AIUnavailableError(
            "Gemini support requires the 'google-genai' package."
        ) from exc

    try:
        return genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    except Exception as exc:
        raise AIUnavailableError(
            "Unable to initialize the Gemini client."
        ) from exc


# ============================================================
# INPUT VALIDATION
# ============================================================


def _validate_question_count(question_count: int) -> int:
    """
    Validate requested question count.
    """

    if not isinstance(question_count, int):
        raise QuizGenerationError(
            "Question count must be an integer."
        )

    if not (
        MIN_QUESTION_COUNT
        <= question_count
        <= MAX_QUESTION_COUNT
    ):
        raise QuizGenerationError(
            f"Question count must be between "
            f"{MIN_QUESTION_COUNT} and "
            f"{MAX_QUESTION_COUNT}."
        )

    return question_count


def _prepare_source_text(source_text: str) -> str:
    """
    Clean and limit document text before sending it to Gemini.

    Limiting source text prevents extremely large documents
    from creating unnecessarily large prompts.
    """

    if not isinstance(source_text, str):
        raise QuizGenerationError(
            "Source document text must be a string."
        )

    cleaned = source_text.strip()

    if not cleaned:
        raise QuizGenerationError(
            "Source document does not contain readable text."
        )

    if len(cleaned) > MAX_SOURCE_TEXT_LENGTH:
        logger.warning(
            "Source document text exceeded the configured "
            "limit and was truncated."
        )

        cleaned = cleaned[:MAX_SOURCE_TEXT_LENGTH]

        # Avoid ending in the middle of a word when possible.
        last_space = cleaned.rfind(" ")

        if last_space > 100:
            cleaned = cleaned[:last_space]

        cleaned += (
            "\n\n[END OF AVAILABLE SOURCE MATERIAL]"
        )

    return cleaned


# ============================================================
# PROMPT
# ============================================================


def _build_quiz_prompt(
    source_text: str,
    question_count: int,
    difficulty: str | None = None,
    competency_name: str | None = None,
) -> str:
    """
    Build a strict prompt for Gemini.

    The model is instructed to generate JSON only so that the
    backend can validate the result before it reaches the
    assessment system.
    """

    difficulty_instruction = (
        f"Target difficulty: {difficulty}."
        if difficulty
        else
        "Use a balanced mixture of easy, medium and hard questions."
    )

    competency_instruction = (
        f"Primary competency/topic: {competency_name}."
        if competency_name
        else
        "Infer the relevant topic from the supplied learning material."
    )

    return f"""
You are an expert government training assessment designer.

Your task is to create a high-quality multiple-choice assessment
from the supplied learning material.

IMPORTANT RULES:

1. Generate exactly {question_count} questions.

2. Every question MUST be directly supported by the supplied
   learning material.

3. Do NOT invent facts that are not supported by the material.

4. Each question must have exactly four options:
   A, B, C and D.

5. Exactly ONE option must be correct.

6. Every option must be plausible and related to the same topic.

7. Avoid:
   - trick questions
   - ambiguous questions
   - duplicate questions
   - "all of the above"
   - "none of the above"
   - questions whose answer depends on outside knowledge
   - questions with multiple defensible answers

8. Every question must include:
   - question
   - difficulty
   - competency/topic
   - four options
   - correct answer
   - explanation
   - a short hint

9. The correct answer must be represented by the option value:
   A, B, C or D.

10. Difficulty must be exactly one of:
    easy
    medium
    hard

11. Explanations should briefly explain WHY the correct answer
    is correct using the supplied material.

12. The hint must help the learner think about the question
    without directly revealing the answer.

13. Questions should test understanding rather than merely
    copying complete sentences from the material.

14. Maintain professional language suitable for government
    officials and structured learning.

15. Return ONLY valid JSON.
    Do not use Markdown.
    Do not use ```json.
    Do not add commentary before or after the JSON.

{difficulty_instruction}

{competency_instruction}

OUTPUT FORMAT:

{{
  "title": "Generated Assessment",
  "description": "AI-generated assessment based on the supplied learning material.",
  "questions": [
    {{
      "question": "Question text",
      "difficulty": "medium",
      "competency": "Topic or competency",
      "options": [
        {{
          "value": "A",
          "text": "Option A"
        }},
        {{
          "value": "B",
          "text": "Option B"
        }},
        {{
          "value": "C",
          "text": "Option C"
        }},
        {{
          "value": "D",
          "text": "Option D"
        }}
      ],
      "correct_answer": "B",
      "explanation": "Explanation of why B is correct.",
      "hint": "A useful answer-neutral hint."
    }}
  ]
}}

SUPPLIED LEARNING MATERIAL:

---------------- SOURCE START ----------------

{source_text}

---------------- SOURCE END ----------------
""".strip()


# ============================================================
# JSON EXTRACTION
# ============================================================


def _extract_json_from_response(
    response_text: str,
) -> dict[str, Any]:
    """
    Convert Gemini's response into a Python dictionary.

    Handles:
        - pure JSON
        - accidental Markdown code fences
        - surrounding whitespace
    """

    if not response_text:
        raise QuizGenerationResponseError(
            "Gemini returned an empty response."
        )

    text = response_text.strip()

    # Remove Markdown code fences if Gemini accidentally returns
    # them despite the prompt.
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    text = text.strip()

    try:
        parsed = json.loads(text)

    except json.JSONDecodeError:

        # Attempt to recover JSON object if Gemini added
        # accidental explanatory text around it.
        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end == -1 or end <= start:
            raise QuizGenerationResponseError(
                "Gemini did not return valid JSON."
            )

        candidate = text[start : end + 1]

        try:
            parsed = json.loads(candidate)

        except json.JSONDecodeError as exc:
            raise QuizGenerationResponseError(
                "Gemini returned malformed JSON."
            ) from exc

    if not isinstance(parsed, dict):
        raise QuizGenerationResponseError(
            "Gemini response must contain a JSON object."
        )

    return parsed


# ============================================================
# QUESTION VALIDATION
# ============================================================


def _validate_option(
    option: Any,
    index: int,
) -> dict[str, str]:
    """
    Validate and normalize a single quiz option.
    """

    if not isinstance(option, dict):
        raise QuizGenerationResponseError(
            f"Question option {index + 1} is invalid."
        )

    value = str(
        option.get("value", "")
    ).strip().upper()

    text = str(
        option.get("text", "")
    ).strip()

    if value not in {"A", "B", "C", "D"}:
        raise QuizGenerationResponseError(
            f"Invalid option value: {value}"
        )

    if not text:
        raise QuizGenerationResponseError(
            f"Option {value} cannot be empty."
        )

    return {
        "value": value,
        "text": text,
    }


def _validate_question(
    question: Any,
    index: int,
) -> dict[str, Any]:
    """
    Validate and normalize one generated question.
    """

    if not isinstance(question, dict):
        raise QuizGenerationResponseError(
            f"Generated question {index + 1} is invalid."
        )

    question_text = str(
        question.get("question", "")
    ).strip()

    difficulty = str(
        question.get("difficulty", "")
    ).strip().lower()

    competency = str(
        question.get("competency", "")
    ).strip()

    correct_answer = str(
        question.get("correct_answer", "")
    ).strip().upper()

    explanation = str(
        question.get("explanation", "")
    ).strip()

    hint = str(
        question.get("hint", "")
    ).strip()

    options = question.get("options")

    # --------------------------------------------------------
    # Required fields
    # --------------------------------------------------------

    if not question_text:
        raise QuizGenerationResponseError(
            f"Question {index + 1} has no question text."
        )

    if difficulty not in ALLOWED_DIFFICULTIES:
        raise QuizGenerationResponseError(
            f"Question {index + 1} has invalid difficulty "
            f"'{difficulty}'."
        )

    if not competency:
        raise QuizGenerationResponseError(
            f"Question {index + 1} has no competency/topic."
        )

    if not explanation:
        raise QuizGenerationResponseError(
            f"Question {index + 1} has no explanation."
        )

    if not hint:
        raise QuizGenerationResponseError(
            f"Question {index + 1} has no hint."
        )

    if not isinstance(options, list):
        raise QuizGenerationResponseError(
            f"Question {index + 1} options must be a list."
        )

    if len(options) != REQUIRED_OPTION_COUNT:
        raise QuizGenerationResponseError(
            f"Question {index + 1} must contain exactly "
            f"{REQUIRED_OPTION_COUNT} options."
        )

    # --------------------------------------------------------
    # Validate options
    # --------------------------------------------------------

    validated_options: list[dict[str, str]] = []

    seen_values: set[str] = set()
    seen_texts: set[str] = set()

    for option_index, option in enumerate(options):

        validated_option = _validate_option(
            option,
            option_index,
        )

        value = validated_option["value"]
        text = validated_option["text"]

        if value in seen_values:
            raise QuizGenerationResponseError(
                f"Question {index + 1} contains duplicate "
                f"option value '{value}'."
            )

        normalized_text = re.sub(
            r"\s+",
            " ",
            text.lower(),
        ).strip()

        if normalized_text in seen_texts:
            raise QuizGenerationResponseError(
                f"Question {index + 1} contains duplicate "
                "option text."
            )

        seen_values.add(value)
        seen_texts.add(normalized_text)

        validated_options.append(
            validated_option
        )

    # --------------------------------------------------------
    # Ensure A-D all exist
    # --------------------------------------------------------

    option_values = {
        option["value"]
        for option in validated_options
    }

    if option_values != {"A", "B", "C", "D"}:
        raise QuizGenerationResponseError(
            f"Question {index + 1} must contain option values "
            "A, B, C and D."
        )

    # --------------------------------------------------------
    # Validate correct answer
    # --------------------------------------------------------

    if correct_answer not in option_values:
        raise QuizGenerationResponseError(
            f"Question {index + 1} has an invalid correct answer."
        )

    # --------------------------------------------------------
    # Return normalized question
    # --------------------------------------------------------

    return {
        "question": question_text,
        "difficulty": difficulty,
        "competency": competency,
        "options": validated_options,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "hint": hint,
    }


# ============================================================
# COMPLETE QUIZ VALIDATION
# ============================================================


def _validate_quiz(
    data: dict[str, Any],
    expected_question_count: int,
) -> dict[str, Any]:
    """
    Validate the complete Gemini quiz response.
    """

    title = str(
        data.get("title", "")
    ).strip()

    description = str(
        data.get("description", "")
    ).strip()

    questions = data.get("questions")

    if not title:
        title = "AI Generated Assessment"

    if not description:
        description = (
            "Assessment generated from the supplied "
            "learning material."
        )

    if not isinstance(questions, list):
        raise QuizGenerationResponseError(
            "Gemini response does not contain a valid "
            "'questions' list."
        )

    if len(questions) != expected_question_count:
        raise QuizGenerationResponseError(
            f"Expected {expected_question_count} questions, "
            f"but Gemini returned {len(questions)}."
        )

    validated_questions: list[dict[str, Any]] = []

    seen_questions: set[str] = set()

    for index, question in enumerate(questions):

        validated_question = _validate_question(
            question,
            index,
        )

        normalized_question = re.sub(
            r"\s+",
            " ",
            validated_question["question"].lower(),
        ).strip()

        if normalized_question in seen_questions:
            raise QuizGenerationResponseError(
                f"Duplicate question detected at question "
                f"{index + 1}."
            )

        seen_questions.add(normalized_question)

        validated_questions.append(
            validated_question
        )

    return {
        "title": title,
        "description": description,
        "questions": validated_questions,
    }


# ============================================================
# GEMINI GENERATION
# ============================================================


def generate_quiz_from_text(
    source_text: str,
    question_count: int = DEFAULT_QUESTION_COUNT,
    difficulty: str | None = None,
    competency_name: str | None = None,
) -> dict[str, Any]:
    """
    Generate a structured quiz from extracted document text.

    Args:
        source_text:
            Text extracted from PDF/PPTX/TXT.

        question_count:
            Number of questions to generate.

        difficulty:
            Optional target difficulty:
                easy
                medium
                hard

        competency_name:
            Optional competency/topic name.

    Returns:
        Validated quiz dictionary.

    Raises:
        QuizGenerationError
        AIUnavailableError
        QuizGenerationResponseError
    """

    question_count = _validate_question_count(
        question_count
    )

    if difficulty is not None:

        difficulty = difficulty.strip().lower()

        if difficulty not in ALLOWED_DIFFICULTIES:
            raise QuizGenerationError(
                "Difficulty must be one of: "
                "easy, medium, hard."
            )

    prepared_text = _prepare_source_text(
        source_text
    )

    prompt = _build_quiz_prompt(
        source_text=prepared_text,
        question_count=question_count,
        difficulty=difficulty,
        competency_name=competency_name,
    )

    # --------------------------------------------------------
    # Initialize modern Gemini client
    # --------------------------------------------------------

    client = _get_gemini_model()

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )

    except Exception as exc:
        logger.exception(
            "Gemini quiz generation failed."
        )

        raise QuizGenerationError(
            "Gemini failed while generating the quiz."
        ) from exc

    # --------------------------------------------------------
    # Extract response text
    # --------------------------------------------------------

    response_text = getattr(
        response,
        "text",
        None,
    )

    if not response_text:
        raise QuizGenerationResponseError(
            "Gemini returned no usable text."
        )

    # --------------------------------------------------------
    # Parse Gemini JSON
    # --------------------------------------------------------

    parsed_response = _extract_json_from_response(
        response_text
    )

    # --------------------------------------------------------
    # Validate complete quiz
    # --------------------------------------------------------

    validated_quiz = _validate_quiz(
        data=parsed_response,
        expected_question_count=question_count,
    )

    return validated_quiz


# ============================================================
# CONVENIENCE WRAPPER
# ============================================================


def generate_quiz(
    source_text: str,
    question_count: int = DEFAULT_QUESTION_COUNT,
    difficulty: str | None = None,
    competency_name: str | None = None,
) -> dict[str, Any]:
    """
    Public service function used by API routes.

    Kept as a small wrapper so future AI providers or generation
    strategies can be introduced without changing route code.
    """

    return generate_quiz_from_text(
        source_text=source_text,
        question_count=question_count,
        difficulty=difficulty,
        competency_name=competency_name,
    )