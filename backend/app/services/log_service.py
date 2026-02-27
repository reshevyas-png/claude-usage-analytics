import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session
from app.models.request_log import RequestLog


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> Decimal:
    pricing = settings.pricing.get(model, {"input": 3.0, "output": 15.0})
    input_cost = Decimal(str(pricing["input"])) * input_tokens / 1_000_000
    output_cost = Decimal(str(pricing["output"])) * output_tokens / 1_000_000
    return (input_cost + output_cost).quantize(Decimal("0.000001"))


async def log_request(
    api_key_id: uuid.UUID,
    model: str,
    input_tokens: int,
    output_tokens: int,
    status_code: int,
    latency_ms: int,
    endpoint: str = "/v1/messages",
    metadata: dict | None = None,
) -> None:
    """Log a proxied request to the database. Runs as a background task."""
    cost = calculate_cost(model, input_tokens, output_tokens)

    async with async_session() as db:
        log = RequestLog(
            api_key_id=api_key_id,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
            status_code=status_code,
            latency_ms=latency_ms,
            endpoint=endpoint,
            metadata_=metadata,
        )
        db.add(log)
        await db.commit()
