from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.assessment import router as assessment_router


app = FastAPI(
    title="SIH26101 Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(assessment_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIH26101 Backend",
        "version": "0.1.0",
    }