from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.models.request_log import RequestLog


def _get_period_start(period: str) -> datetime:
    now = datetime.now(timezone.utc)
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    return now - timedelta(days=days)


def _user_keys_filter(user_id: UUID):
    """Subquery to get all API key IDs belonging to a user."""
    return select(ApiKey.id).where(ApiKey.user_id == user_id).scalar_subquery()


async def get_summary(db: AsyncSession, user_id: UUID, period: str = "30d") -> dict:
    period_start = _get_period_start(period)
    keys_subq = _user_keys_filter(user_id)

    result = await db.execute(
        select(
            func.count(RequestLog.id).label("total_requests"),
            func.coalesce(func.sum(RequestLog.input_tokens), 0).label("total_input_tokens"),
            func.coalesce(func.sum(RequestLog.output_tokens), 0).label("total_output_tokens"),
            func.coalesce(func.sum(RequestLog.cost_usd), 0).label("total_cost"),
            func.coalesce(func.avg(RequestLog.latency_ms), 0).label("avg_latency_ms"),
        ).where(
            RequestLog.api_key_id.in_(keys_subq),
            RequestLog.created_at >= period_start,
        )
    )
    row = result.one()
    return {
        "total_requests": row.total_requests,
        "total_input_tokens": int(row.total_input_tokens),
        "total_output_tokens": int(row.total_output_tokens),
        "total_cost": float(row.total_cost),
        "avg_latency_ms": round(float(row.avg_latency_ms)),
        "period": period,
    }


async def get_cost_over_time(
    db: AsyncSession, user_id: UUID, period: str = "30d", granularity: str = "day"
) -> list[dict]:
    period_start = _get_period_start(period)
    keys_subq = _user_keys_filter(user_id)

    trunc_fn = func.date_trunc(granularity, RequestLog.created_at)

    result = await db.execute(
        select(
            trunc_fn.label("bucket"),
            func.count(RequestLog.id).label("requests"),
            func.coalesce(func.sum(RequestLog.cost_usd), 0).label("cost"),
            func.coalesce(func.sum(RequestLog.input_tokens), 0).label("input_tokens"),
            func.coalesce(func.sum(RequestLog.output_tokens), 0).label("output_tokens"),
        )
        .where(
            RequestLog.api_key_id.in_(keys_subq),
            RequestLog.created_at >= period_start,
        )
        .group_by(trunc_fn)
        .order_by(trunc_fn)
    )

    return [
        {
            "date": row.bucket.isoformat(),
            "requests": row.requests,
            "cost": float(row.cost),
            "input_tokens": int(row.input_tokens),
            "output_tokens": int(row.output_tokens),
        }
        for row in result.all()
    ]


async def get_by_model(db: AsyncSession, user_id: UUID, period: str = "30d") -> list[dict]:
    period_start = _get_period_start(period)
    keys_subq = _user_keys_filter(user_id)

    result = await db.execute(
        select(
            RequestLog.model,
            func.count(RequestLog.id).label("requests"),
            func.coalesce(func.sum(RequestLog.cost_usd), 0).label("cost"),
            func.coalesce(func.sum(RequestLog.input_tokens), 0).label("input_tokens"),
            func.coalesce(func.sum(RequestLog.output_tokens), 0).label("output_tokens"),
        )
        .where(
            RequestLog.api_key_id.in_(keys_subq),
            RequestLog.created_at >= period_start,
        )
        .group_by(RequestLog.model)
        .order_by(func.sum(RequestLog.cost_usd).desc())
    )

    return [
        {
            "model": row.model,
            "requests": row.requests,
            "cost": float(row.cost),
            "input_tokens": int(row.input_tokens),
            "output_tokens": int(row.output_tokens),
        }
        for row in result.all()
    ]


async def get_by_key(db: AsyncSession, user_id: UUID, period: str = "30d") -> list[dict]:
    period_start = _get_period_start(period)

    result = await db.execute(
        select(
            ApiKey.key_prefix,
            ApiKey.label,
            func.count(RequestLog.id).label("requests"),
            func.coalesce(func.sum(RequestLog.cost_usd), 0).label("cost"),
            func.coalesce(func.sum(RequestLog.input_tokens), 0).label("input_tokens"),
            func.coalesce(func.sum(RequestLog.output_tokens), 0).label("output_tokens"),
        )
        .join(RequestLog, RequestLog.api_key_id == ApiKey.id)
        .where(
            ApiKey.user_id == user_id,
            RequestLog.created_at >= period_start,
        )
        .group_by(ApiKey.id, ApiKey.key_prefix, ApiKey.label)
        .order_by(func.sum(RequestLog.cost_usd).desc())
    )

    return [
        {
            "key_prefix": row.key_prefix,
            "label": row.label,
            "requests": row.requests,
            "cost": float(row.cost),
            "input_tokens": int(row.input_tokens),
            "output_tokens": int(row.output_tokens),
        }
        for row in result.all()
    ]


async def get_request_logs(
    db: AsyncSession, user_id: UUID, page: int = 1, limit: int = 50
) -> dict:
    keys_subq = _user_keys_filter(user_id)
    offset = (page - 1) * limit

    # Count total
    count_result = await db.execute(
        select(func.count(RequestLog.id)).where(RequestLog.api_key_id.in_(keys_subq))
    )
    total = count_result.scalar()

    # Get page
    result = await db.execute(
        select(RequestLog)
        .where(RequestLog.api_key_id.in_(keys_subq))
        .order_by(RequestLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    logs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": str(log.id),
                "api_key_id": str(log.api_key_id),
                "model": log.model,
                "input_tokens": log.input_tokens,
                "output_tokens": log.output_tokens,
                "cost_usd": float(log.cost_usd),
                "status_code": log.status_code,
                "latency_ms": log.latency_ms,
                "endpoint": log.endpoint,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
    }
