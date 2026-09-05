# ============================================================
# iGOT LEARNING CATALOGUE
# ============================================================
#
# This is currently a curated prototype catalogue representing
# iGOT-aligned learning resources.
#
# These are NOT live API results from iGOT Karmayogi.
# Live catalogue integration can be added later when an
# authorized API/integration mechanism is available.
#
# Each resource contains:
#   title
#   source
#   resource_type
#   url
#   competency_keywords
#
# The recommendation engine uses competency_keywords to
# deterministically match resources with identified skill gaps.
# ============================================================


IGOT_LEARNING_CATALOGUE = [
    # ========================================================
    # DATA / STATISTICS / ANALYTICS
    # ========================================================
    {
        "title": "Data Driven Decision Making For Government",
        "source": "iGOT Karmayogi",
        "resource_type": "external_link",
        "url": "https://www.igotkarmayogi.gov.in/",
        "competency_keywords": [
            "data",
            "statistics",
            "statistical",
            "analytics",
            "analysis",
            "decision",
            "data analysis",
            "data driven",
        ],
    },

    # ========================================================
    # EXCEL / SPREADSHEETS
    # ========================================================
    {
        "title": "Excel Learning Resources",
        "source": "iGOT Karmayogi",
        "resource_type": "external_link",
        "url": "https://www.igotkarmayogi.gov.in/",
        "competency_keywords": [
            "excel",
            "spreadsheet",
            "data",
            "digital",
            "office",
            "data handling",
        ],
    },

    # ========================================================
    # PYTHON / PROGRAMMING
    # ========================================================
    #
    # Prototype resource entry for deterministic matching.
    # This is NOT a claim that this exact course currently
    # exists on iGOT.
    #
    {
        "title": "Python Programming Learning Resources",
        "source": "iGOT Karmayogi",
        "resource_type": "external_link",
        "url": "https://www.igotkarmayogi.gov.in/",
        "competency_keywords": [
            "python",
            "programming",
            "coding",
            "software",
            "technical",
            "development",
            "automation",
            "data analysis",
        ],
    },

    # ========================================================
    # PROJECT MANAGEMENT / LEADERSHIP
    # ========================================================
    {
        "title": "Project Management Learning Resources",
        "source": "iGOT Karmayogi",
        "resource_type": "external_link",
        "url": "https://www.igotkarmayogi.gov.in/",
        "competency_keywords": [
            "project",
            "management",
            "planning",
            "leadership",
            "coordination",
            "team",
            "execution",
        ],
    },

    # ========================================================
    # DIGITAL SKILLS / CYBER SAFETY
    # ========================================================
    {
        "title": "Digital Safety and Digital Skills Resources",
        "source": "iGOT Karmayogi",
        "resource_type": "external_link",
        "url": "https://www.igotkarmayogi.gov.in/",
        "competency_keywords": [
            "digital",
            "technology",
            "cyber",
            "computer",
            "information",
            "digital safety",
            "cyber security",
            "cybersecurity",
        ],
    },
]


# ============================================================
# CATALOGUE METADATA
# ============================================================

IGOT_CATALOGUE_SOURCE = "iGOT Karmayogi"

IGOT_CATALOGUE_IS_PROTOTYPE = True

IGOT_CATALOGUE_NOTE = (
    "This catalogue is a curated prototype representation "
    "of iGOT-aligned learning resources. It is not a live "
    "iGOT API catalogue. Live integration requires an "
    "authorized API or approved integration mechanism."
)