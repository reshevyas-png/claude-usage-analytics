"""
Seed script — populate the database with realistic enterprise demo data.

Usage:
    cd backend
    python seed.py

Creates:
    - 1 demo user (demo@acme.com / demo1234)
    - 6 department API keys (Legal, Sales, Engineering, HR, Marketing, Finance)
    - ~2,500 request logs spread over 90 days with realistic patterns

The data simulates a mid-size company with 6 departments using Claude through
the proxy. Each department has different usage patterns:
    - Engineering: heavy Opus + Sonnet, big context windows, high volume
    - Sales: moderate Sonnet, short prompts, steady daily use
    - Legal: heavy Opus for contract review, large docs, business hours
    - Marketing: Haiku-heavy for copy, bursts around campaigns
    - HR: light Sonnet use for policy Q&A
    - Finance: moderate Opus for analysis, business hours only
"""

import asyncio
import hashlib
import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEMO_EMAIL = "demo@acme.com"
DEMO_PASSWORD = "demo1234"
DEMO_COMPANY = "Acme Corp"

# Department definitions with usage profiles
DEPARTMENTS = {
    "Engineering": {
        "models": {
            "claude-opus-4-6": 0.15,
            "claude-sonnet-4-6": 0.60,
            "claude-haiku-4-5-20251001": 0.25,
        },
        "daily_requests": (25, 60),  # min, max requests per day
        "input_tokens": (800, 12000),
        "output_tokens": (200, 4000),
        "latency_ms": (300, 3500),
        "error_rate": 0.03,
        "weekend_factor": 0.3,  # 30% of weekday volume on weekends
        "endpoints": ["/v1/messages"],
    },
    "Sales": {
        "models": {
            "claude-sonnet-4-6": 0.75,
            "claude-haiku-4-5-20251001": 0.25,
        },
        "daily_requests": (10, 30),
        "input_tokens": (300, 3000),
        "output_tokens": (100, 1500),
        "latency_ms": (200, 1800),
        "error_rate": 0.02,
        "weekend_factor": 0.05,
        "endpoints": ["/v1/messages"],
    },
    "Legal": {
        "models": {
            "claude-opus-4-6": 0.65,
            "claude-sonnet-4-6": 0.30,
            "claude-haiku-4-5-20251001": 0.05,
        },
        "daily_requests": (8, 25),
        "input_tokens": (5000, 50000),  # large docs
        "output_tokens": (1000, 8000),
        "latency_ms": (800, 8000),
        "error_rate": 0.01,
        "weekend_factor": 0.02,
        "endpoints": ["/v1/messages"],
    },
    "Marketing": {
        "models": {
            "claude-sonnet-4-6": 0.30,
            "claude-haiku-4-5-20251001": 0.70,
        },
        "daily_requests": (12, 45),
        "input_tokens": (200, 2000),
        "output_tokens": (300, 2500),
        "latency_ms": (150, 1200),
        "error_rate": 0.04,
        "weekend_factor": 0.1,
        "endpoints": ["/v1/messages"],
    },
    "HR": {
        "models": {
            "claude-sonnet-4-6": 0.60,
            "claude-haiku-4-5-20251001": 0.40,
        },
        "daily_requests": (3, 12),
        "input_tokens": (500, 4000),
        "output_tokens": (200, 2000),
        "latency_ms": (200, 1500),
        "error_rate": 0.02,
        "weekend_factor": 0.0,
        "endpoints": ["/v1/messages"],
    },
    "Finance": {
        "models": {
            "claude-opus-4-6": 0.40,
            "claude-sonnet-4-6": 0.50,
            "claude-haiku-4-5-20251001": 0.10,
        },
        "daily_requests": (5, 18),
        "input_tokens": (1000, 15000),
        "output_tokens": (500, 5000),
        "latency_ms": (400, 4000),
        "error_rate": 0.01,
        "weekend_factor": 0.0,
        "endpoints": ["/v1/messages"],
    },
}

# Pricing per 1M tokens
PRICING = {
    "claude-opus-4-6": {"input": 15.0, "output": 75.0},
    "claude-sonnet-4-6": {"input": 3.0, "output": 15.0},
    "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.0},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> Decimal:
    pricing = PRICING[model]
    input_cost = Decimal(str(pricing["input"])) * input_tokens / 1_000_000
    output_cost = Decimal(str(pricing["output"])) * output_tokens / 1_000_000
    return (input_cost + output_cost).quantize(Decimal("0.000001"))


def pick_model(model_weights: dict[str, float]) -> str:
    models = list(model_weights.keys())
    weights = list(model_weights.values())
    return random.choices(models, weights=weights, k=1)[0]


def business_hours_bias(hour: int) -> float:
    """Return a multiplier for request probability by hour (UTC).
    Simulates US business hours (9am-6pm ET = 14:00-23:00 UTC)."""
    if 14 <= hour <= 22:
        return 1.0
    elif 23 <= hour or hour <= 4:
        return 0.3
    else:
        return 0.15


def generate_request_time(day: datetime) -> datetime:
    """Generate a random request timestamp within a day, biased toward business hours."""
    while True:
        hour = random.randint(0, 23)
        if random.random() < business_hours_bias(hour):
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            return day.replace(hour=hour, minute=minute, second=second)


# ---------------------------------------------------------------------------
# Main seed logic
# ---------------------------------------------------------------------------

async def seed():
    # Import here so the script can be run standalone
    from app.database import Base, async_session, engine

    print("Connecting to database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Schema ready.")

    async with async_session() as db:
        from sqlalchemy import select, text
        from app.models.user import User
        from app.models.api_key import ApiKey
        from app.models.request_log import RequestLog

        # Check if demo user already exists
        existing = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        if existing.scalar_one_or_none():
            print(f"Demo user {DEMO_EMAIL} already exists. Clearing old data...")
            # Delete existing data for clean re-seed
            user = (await db.execute(select(User).where(User.email == DEMO_EMAIL))).scalar_one()
            keys = (await db.execute(select(ApiKey).where(ApiKey.user_id == user.id))).scalars().all()
            for key in keys:
                await db.execute(text("DELETE FROM request_logs WHERE api_key_id = :kid"), {"kid": key.id})
            await db.execute(text("DELETE FROM api_keys WHERE user_id = :uid"), {"uid": user.id})
            await db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user.id})
            await db.commit()
            print("Old data cleared.")

        # Create demo user
        user_id = uuid.uuid4()
        user = User(
            id=user_id,
            email=DEMO_EMAIL,
            password_hash=pwd_context.hash(DEMO_PASSWORD),
            company_name=DEMO_COMPANY,
        )
        db.add(user)
        await db.flush()
        print(f"Created user: {DEMO_EMAIL} (password: {DEMO_PASSWORD})")

        # Create department API keys
        key_ids = {}
        for dept_name in DEPARTMENTS:
            key_id = uuid.uuid4()
            fake_proxy_key = f"cua-{uuid.uuid4().hex[:48]}"
            key_hash = hashlib.sha256(fake_proxy_key.encode()).hexdigest()

            api_key = ApiKey(
                id=key_id,
                user_id=user_id,
                key_hash=key_hash,
                key_prefix=fake_proxy_key[:12],
                label=dept_name,
                anthropic_key_encrypted="DEMO_ENCRYPTED_KEY_NOT_REAL",
            )
            db.add(api_key)
            key_ids[dept_name] = key_id
            print(f"  Created key: {dept_name} ({fake_proxy_key[:12]}...)")

        await db.flush()

        # Generate request logs over the last 90 days
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=90)
        total_logs = 0
        batch = []
        BATCH_SIZE = 500

        print("\nGenerating request logs...")

        for day_offset in range(91):
            day = start_date + timedelta(days=day_offset)
            is_weekend = day.weekday() >= 5
            # Gradually ramp up usage over 90 days (company adoption curve)
            adoption_factor = 0.3 + 0.7 * (day_offset / 90)

            for dept_name, profile in DEPARTMENTS.items():
                min_req, max_req = profile["daily_requests"]
                base_count = random.randint(min_req, max_req)

                # Apply weekend + adoption factors
                if is_weekend:
                    base_count = int(base_count * profile["weekend_factor"])
                daily_count = max(0, int(base_count * adoption_factor))

                # Add occasional spikes (campaign launches, quarter-end, etc.)
                if random.random() < 0.05:
                    daily_count = int(daily_count * random.uniform(1.5, 3.0))

                for _ in range(daily_count):
                    model = pick_model(profile["models"])
                    input_tok = random.randint(*profile["input_tokens"])
                    output_tok = random.randint(*profile["output_tokens"])
                    latency = random.randint(*profile["latency_ms"])

                    # Opus is slower
                    if "opus" in model:
                        latency = int(latency * random.uniform(1.5, 3.0))
                    elif "haiku" in model:
                        latency = int(latency * random.uniform(0.3, 0.7))

                    # Errors
                    is_error = random.random() < profile["error_rate"]
                    status = random.choice([400, 429, 500, 503]) if is_error else 200

                    # Errors have fewer tokens
                    if is_error:
                        output_tok = random.randint(0, 50)

                    cost = calculate_cost(model, input_tok, output_tok)
                    created = generate_request_time(day)

                    log = RequestLog(
                        api_key_id=key_ids[dept_name],
                        model=model,
                        input_tokens=input_tok,
                        output_tokens=output_tok,
                        cost_usd=cost,
                        status_code=status,
                        latency_ms=latency,
                        endpoint=random.choice(profile["endpoints"]),
                        metadata_={"department": dept_name},
                        created_at=created,
                    )
                    batch.append(log)
                    total_logs += 1

                    if len(batch) >= BATCH_SIZE:
                        db.add_all(batch)
                        await db.flush()
                        batch = []

            # Progress indicator
            if day_offset % 10 == 0:
                print(f"  Day {day_offset}/90 — {total_logs} logs so far...")

        # Flush remaining
        if batch:
            db.add_all(batch)
            await db.flush()

        await db.commit()

        # Summary stats
        print(f"\nDone! Seeded {total_logs} request logs across 6 departments over 90 days.")
        print(f"\nLogin credentials:")
        print(f"  Email:    {DEMO_EMAIL}")
        print(f"  Password: {DEMO_PASSWORD}")

        # Quick cost summary per department
        for dept_name, key_id in key_ids.items():
            result = await db.execute(
                text("SELECT COUNT(*), COALESCE(SUM(cost_usd), 0) FROM request_logs WHERE api_key_id = :kid"),
                {"kid": key_id},
            )
            row = result.one()
            print(f"  {dept_name:15s} — {row[0]:>5} requests, ${float(row[1]):>10,.2f}")


if __name__ == "__main__":
    asyncio.run(seed())
