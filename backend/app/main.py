from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analytics, auth, keys, proxy

app = FastAPI(
    title="Claude Usage Analytics",
    description="FinOps for AI — track Claude API usage, cost, and ROI",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(keys.router, prefix="/keys", tags=["keys"])
app.include_router(proxy.router, tags=["proxy"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
async def health():
    return {"status": "ok"}
