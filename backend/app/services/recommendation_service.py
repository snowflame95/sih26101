from app.core.config import settings
from app.data.learning_catalogue import (
    IGOT_LEARNING_CATALOGUE,
)
from app.schemas.ai import (
    LearningRecommendation,
    SkillAnalysisItem,
)


def get_learning_recommendations(
    items: list[SkillAnalysisItem],
) -> list[LearningRecommendation]:
    if not settings.IGOT_ENABLED:
        return []

    recommendations: list[
        LearningRecommendation
    ] = []

    seen: set[tuple[int, str]] = set()

    priority_items = [
        item
        for item in items
        if item.gap > 0
    ]

    priority_items.sort(
        key=lambda item: (
            -item.gap,
            item.competency_name.lower(),
        )
    )

    for item in priority_items:
        competency_text = (
            f"{item.competency_name} "
            f"{item.category or ''} "
            f"{' '.join(item.recommended_focus)}"
        ).lower()

        for resource in IGOT_LEARNING_CATALOGUE:
            matched = any(
                keyword.lower()
                in competency_text
                for keyword in resource[
                    "competency_keywords"
                ]
            )

            if not matched:
                continue

            key = (
                item.competency_id,
                resource["title"],
            )

            if key in seen:
                continue

            seen.add(key)

            recommendations.append(
                LearningRecommendation(
                    title=resource["title"],
                    source=resource["source"],
                    resource_type=resource[
                        "resource_type"
                    ],
                    url=resource["url"],
                    competency_id=item.competency_id,
                    competency_name=item.competency_name,
                    reason=(
                        f"Recommended because "
                        f"{item.competency_name} has "
                        f"a skill gap of {item.gap}."
                    ),
                )
            )

    return recommendations[:10]