from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.init_db import init_db

from app.routes.admin import router as admin_router
from app.routes.ai import router as ai_router
from app.routes.auth import router as auth_router
from app.routes.assessment import router as assessment_router
from app.routes.competency import router as competency_router
from app.routes.profile import router as profile_router
from app.routes.learning import router as learning_router


# ============================================================
# APPLICATION LIFESPAN
# ============================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup/shutdown lifecycle.

    On startup:
        Initialize the database tables.

    On shutdown:
        Nothing additional is currently required.
    """

    init_db()

    yield


# ============================================================
# FASTAPI APPLICATION
# ============================================================


app = FastAPI(
    title="SIH26101 Backend",
    version="0.1.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================
#
# AI router contains:
#
#   POST /api/ai/skill-analysis
#   POST /api/ai/recommendations
#   POST /api/ai/generate-quiz
#
# Because ai_router is already included here, the new
# quiz-generation endpoint is automatically registered.
# ============================================================


app.include_router(auth_router)

app.include_router(admin_router)

app.include_router(assessment_router)

app.include_router(competency_router)

app.include_router(profile_router)

app.include_router(learning_router)

app.include_router(ai_router)


# ============================================================
# HEALTH CHECK
# ============================================================


@app.get("/health")
def health_check():
    """
    Basic backend health check.
    """

    return {
        "status": "healthy",
        "service": "SIH26101 Backend",
        "version": "0.1.0",
    }