from collections.abc import Mapping
from typing import Any

from app.core.config import settings
from app.data.learning_catalogue import (
    IGOT_LEARNING_CATALOGUE,
)
from app.schemas.ai import (
    LearningRecommendation,
)


# ============================================================
# HELPERS
# ============================================================


def _get_item_value(
    item: Mapping,
    key: str,
    default: Any = None,
) -> Any:
    """
    Safely read a value from the skill-analysis
    dictionary returned by ai_service.
    """
    return item.get(key, default)


def _normalise_text(value: Any) -> str:
    """
    Convert optional values into searchable lowercase text.

    Lists are flattened so that fields such as:
        recommended_focus
        strengths
        weaknesses
    can also participate in catalogue matching.
    """
    if value is None:
        return ""

    if isinstance(value, (list, tuple, set)):
        return " ".join(
            str(item)
            for item in value
            if item is not None
        ).lower()

    return str(value).lower()


def _resource_keywords(
    resource: Mapping,
) -> list[str]:
    """
    Safely extract competency keywords from a catalogue
    resource.
    """
    keywords = resource.get(
        "competency_keywords",
        [],
    )

    if keywords is None:
        return []

    if isinstance(keywords, str):
        return [keywords.lower()]

    if isinstance(keywords, (list, tuple, set)):
        return [
            str(keyword).lower().strip()
            for keyword in keywords
            if str(keyword).strip()
        ]

    return [str(keywords).lower().strip()]


def _resource_matches_competency(
    item: Mapping,
    resource: Mapping,
) -> bool:
    """
    Determine whether a learning resource is relevant
    to the learner's competency.

    Matching considers:

        competency name
        competency category
        recommended focus
        strengths
        weaknesses

    The recommendation engine remains deterministic and
    does not require an AI-generated analysis.
    """

    competency_text = " ".join(
        [
            _normalise_text(
                _get_item_value(
                    item,
                    "competency_name",
                )
            ),
            _normalise_text(
                _get_item_value(
                    item,
                    "category",
                )
            ),
            _normalise_text(
                _get_item_value(
                    item,
                    "recommended_focus",
                    [],
                )
            ),
            _normalise_text(
                _get_item_value(
                    item,
                    "strengths",
                    [],
                )
            ),
            _normalise_text(
                _get_item_value(
                    item,
                    "weaknesses",
                    [],
                )
            ),
        ]
    )

    keywords = _resource_keywords(resource)

    if not competency_text or not keywords:
        return False

    return any(
        keyword in competency_text
        for keyword in keywords
    )


def _build_reason(
    item: Mapping,
    resource: Mapping,
) -> str:
    """
    Build an explainable recommendation reason.

    The resource parameter is intentionally retained so the
    function can be extended later with resource-specific
    reasoning without changing the public API.
    """

    # Avoid an unused-resource warning while preserving the
    # function signature for future resource-specific logic.
    _ = resource

    competency_name = _get_item_value(
        item,
        "competency_name",
        "this competency",
    )

    gap = _get_item_value(
        item,
        "gap",
        0,
    )

    priority = _get_item_value(
        item,
        "priority",
        "LOW",
    )

    if gap > 0:
        return (
            f"Recommended because your "
            f"{competency_name} competency has a "
            f"skill gap of {gap}. This "
            f"{str(priority).lower()} priority learning "
            f"resource is aligned with the identified "
            f"development need."
        )

    return (
        f"Recommended as a relevant learning resource "
        f"for maintaining and extending your "
        f"{competency_name} competency."
    )


# ============================================================
# RECOMMENDATION ENGINE
# ============================================================


def get_learning_recommendations(
    items: list[dict],
) -> list[LearningRecommendation]:
    """
    Generate personalised learning recommendations
    from the current prototype learning catalogue.

    The catalogue is currently a curated prototype
    representation of iGOT-aligned resources.

    The function accepts dictionaries because
    ai_service.analyse_user_skills() returns
    serialisable dictionaries.

    Recommendation generation is deterministic.
    Gemini is not called from this service.
    """

    # --------------------------------------------------------
    # iGOT / learning catalogue feature switch
    # --------------------------------------------------------

    if not settings.IGOT_ENABLED:
        return []

    if not items:
        return []

    recommendations: list[
        LearningRecommendation
    ] = []

    # Use competency ID + resource title to prevent
    # duplicate recommendations.
    seen: set[tuple[int | None, str]] = set()

    # --------------------------------------------------------
    # Only competencies with an actual skill gap need
    # development recommendations.
    # --------------------------------------------------------

    priority_items = [
        item
        for item in items
        if _get_item_value(
            item,
            "gap",
            0,
        ) > 0
    ]

    # --------------------------------------------------------
    # Largest skill gaps first.
    #
    # Secondary sorting by competency name makes the output
    # deterministic when two competencies have the same gap.
    # --------------------------------------------------------

    priority_items.sort(
        key=lambda item: (
            -_get_item_value(
                item,
                "gap",
                0,
            ),
            _normalise_text(
                _get_item_value(
                    item,
                    "competency_name",
                    "",
                )
            ),
        )
    )

    # --------------------------------------------------------
    # Match learner competencies against the catalogue.
    # --------------------------------------------------------

    for item in priority_items:

        competency_id = _get_item_value(
            item,
            "competency_id",
        )

        competency_name = _get_item_value(
            item,
            "competency_name",
        )

        for resource in IGOT_LEARNING_CATALOGUE:

            if not isinstance(resource, Mapping):
                continue

            if not _resource_matches_competency(
                item,
                resource,
            ):
                continue

            title = resource.get(
                "title",
                "Learning Resource",
            )

            title = str(title).strip()

            if not title:
                title = "Learning Resource"

            key = (
                competency_id,
                title,
            )

            if key in seen:
                continue

            seen.add(key)

            recommendations.append(
                LearningRecommendation(
                    title=title,
                    source=str(
                        resource.get(
                            "source",
                            "Learning Platform",
                        )
                    ),
                    resource_type=str(
                        resource.get(
                            "resource_type",
                            "external_link",
                        )
                    ),
                    url=str(
                        resource.get(
                            "url",
                            "",
                        )
                    ),
                    competency_id=competency_id,
                    competency_name=competency_name,
                    reason=_build_reason(
                        item,
                        resource,
                    ),
                )
            )

            # ------------------------------------------------
            # Stop once the maximum recommendation count is
            # reached. This avoids unnecessary catalogue
            # processing.
            # ------------------------------------------------

            if len(recommendations) >= 10:
                return recommendations

    return recommendations