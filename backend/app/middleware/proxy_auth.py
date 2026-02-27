import hashlib

from fastapi import HTTPException, Request
from sqlalchemy import select

from app.database import async_session
from app.models.api_key import ApiKey
from app.services.encryption import decrypt_value


async def authenticate_proxy_key(request: Request) -> tuple[ApiKey, str]:
    """
    Validate the proxy API key from the x-api-key header.
    Returns the ApiKey model and the decrypted Anthropic API key.
    """
    proxy_key = request.headers.get("x-api-key")
    if not proxy_key:
        raise HTTPException(status_code=401, detail="Missing x-api-key header")

    key_hash = hashlib.sha256(proxy_key.encode()).hexdigest()

    async with async_session() as db:
        result = await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))
        api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")

    anthropic_key = decrypt_value(api_key.anthropic_key_encrypted)
    return api_key, anthropic_key
