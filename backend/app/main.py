from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.init_db import init_db
from app.routes.auth import router as auth_router
from app.routes.assessment import router as assessment_router
from app.routes.competency import router as competency_router
from app.routes.profile import router as profile_router
from app.routes.learning import router as learning_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SIH26101 Backend",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(assessment_router)
app.include_router(competency_router)
app.include_router(profile_router)
app.include_router(learning_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIH26101 Backend",
        "version": "0.1.0",
    }