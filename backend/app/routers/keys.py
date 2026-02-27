import hashlib
import secrets
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.api_key import ApiKey
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.encryption import encrypt_value

router = APIRouter()


# --- Schemas ---

class CreateKeyRequest(BaseModel):
    label: str | None = None
    anthropic_api_key: str


class KeyResponse(BaseModel):
    id: UUID
    key_prefix: str
    label: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateKeyResponse(BaseModel):
    id: UUID
    proxy_key: str  # Only shown once at creation
    key_prefix: str
    label: str | None
    created_at: datetime


# --- Helpers ---

def _generate_proxy_key() -> str:
    return f"cua-{secrets.token_hex(24)}"


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


# --- Routes ---

@router.post("", response_model=CreateKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_key(
    body: CreateKeyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    proxy_key = _generate_proxy_key()

    api_key = ApiKey(
        user_id=user.id,
        key_hash=_hash_key(proxy_key),
        key_prefix=proxy_key[:12],
        label=body.label,
        anthropic_key_encrypted=encrypt_value(body.anthropic_api_key),
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return CreateKeyResponse(
        id=api_key.id,
        proxy_key=proxy_key,
        key_prefix=api_key.key_prefix,
        label=api_key.label,
        created_at=api_key.created_at,
    )


@router.get("", response_model=list[KeyResponse])
async def list_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key(
    key_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    await db.delete(api_key)
    await db.commit()
