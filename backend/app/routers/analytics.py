from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services import analytics_service

router = APIRouter()


@router.get("/summary")
async def summary(
    period: str = Query("30d", pattern="^(7d|30d|90d)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_service.get_summary(db, user.id, period)


@router.get("/cost-over-time")
async def cost_over_time(
    period: str = Query("30d", pattern="^(7d|30d|90d)$"),
    granularity: str = Query("day", pattern="^(hour|day|week)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_service.get_cost_over_time(db, user.id, period, granularity)


@router.get("/by-model")
async def by_model(
    period: str = Query("30d", pattern="^(7d|30d|90d)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_service.get_by_model(db, user.id, period)


@router.get("/by-key")
async def by_key(
    period: str = Query("30d", pattern="^(7d|30d|90d)$"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_service.get_by_key(db, user.id, period)


@router.get("/requests")
async def request_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_service.get_request_logs(db, user.id, page, limit)
