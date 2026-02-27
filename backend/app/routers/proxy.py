import json
import time

import httpx
from fastapi import APIRouter, BackgroundTasks, Request, Response
from fastapi.responses import StreamingResponse

from app.middleware.proxy_auth import authenticate_proxy_key
from app.services.log_service import log_request

router = APIRouter()

ANTHROPIC_BASE_URL = "https://api.anthropic.com"
PASS_THROUGH_HEADERS = {"anthropic-version", "anthropic-beta", "content-type"}


def _build_forward_headers(request: Request, anthropic_key: str) -> dict:
    headers = {"x-api-key": anthropic_key}
    for header_name in PASS_THROUGH_HEADERS:
        value = request.headers.get(header_name)
        if value:
            headers[header_name] = value
    return headers


@router.post("/v1/messages")
async def proxy_messages(request: Request, background_tasks: BackgroundTasks):
    start = time.time()

    api_key, anthropic_key = await authenticate_proxy_key(request)
    body = await request.body()
    forward_headers = _build_forward_headers(request, anthropic_key)

    # Check if this is a streaming request
    try:
        request_data = json.loads(body)
        is_streaming = request_data.get("stream", False)
        request_model = request_data.get("model", "unknown")
    except Exception:
        is_streaming = False
        request_model = "unknown"

    if is_streaming:
        return await _handle_streaming(
            api_key, body, forward_headers, request_model, start
        )
    else:
        return await _handle_non_streaming(
            api_key, body, forward_headers, request_model, start, background_tasks
        )


async def _handle_non_streaming(
    api_key, body, forward_headers, request_model, start, background_tasks
):
    async with httpx.AsyncClient(timeout=300.0) as client:
        anthropic_response = await client.post(
            f"{ANTHROPIC_BASE_URL}/v1/messages",
            content=body,
            headers=forward_headers,
        )

    latency_ms = int((time.time() - start) * 1000)

    model = request_model
    input_tokens = 0
    output_tokens = 0

    if anthropic_response.status_code == 200:
        try:
            response_data = anthropic_response.json()
            model = response_data.get("model", request_model)
            usage = response_data.get("usage", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
        except Exception:
            pass

    background_tasks.add_task(
        log_request,
        api_key_id=api_key.id,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        status_code=anthropic_response.status_code,
        latency_ms=latency_ms,
    )

    return Response(
        content=anthropic_response.content,
        status_code=anthropic_response.status_code,
        headers=dict(anthropic_response.headers),
        media_type=anthropic_response.headers.get("content-type"),
    )


async def _handle_streaming(api_key, body, forward_headers, request_model, start):
    """
    Stream SSE events from Anthropic to the client while capturing usage data.

    Anthropic streaming sends:
    - event: message_start  (contains model, input_tokens in usage)
    - event: content_block_delta (content chunks)
    - event: message_delta  (contains output_tokens in usage)
    - event: message_stop

    We capture usage from message_start and message_delta events.
    """
    client = httpx.AsyncClient(timeout=300.0)

    anthropic_request = client.build_request(
        "POST",
        f"{ANTHROPIC_BASE_URL}/v1/messages",
        content=body,
        headers=forward_headers,
    )

    anthropic_response = await client.send(anthropic_request, stream=True)

    # Mutable state captured by the generator
    usage_data = {
        "model": request_model,
        "input_tokens": 0,
        "output_tokens": 0,
        "status_code": anthropic_response.status_code,
    }

    async def event_generator():
        try:
            async for line in anthropic_response.aiter_lines():
                # Parse SSE data lines to extract usage
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        event_type = data.get("type", "")

                        if event_type == "message_start":
                            message = data.get("message", {})
                            usage_data["model"] = message.get("model", request_model)
                            usage = message.get("usage", {})
                            usage_data["input_tokens"] = usage.get("input_tokens", 0)

                        elif event_type == "message_delta":
                            usage = data.get("usage", {})
                            usage_data["output_tokens"] = usage.get("output_tokens", 0)
                    except json.JSONDecodeError:
                        pass

                yield line + "\n"
        finally:
            await anthropic_response.aclose()
            await client.aclose()

            # Log after stream completes
            latency_ms = int((time.time() - start) * 1000)
            await log_request(
                api_key_id=api_key.id,
                model=usage_data["model"],
                input_tokens=usage_data["input_tokens"],
                output_tokens=usage_data["output_tokens"],
                status_code=usage_data["status_code"],
                latency_ms=latency_ms,
            )

    return StreamingResponse(
        event_generator(),
        status_code=anthropic_response.status_code,
        media_type="text/event-stream",
        headers={
            "cache-control": "no-cache",
            "connection": "keep-alive",
        },
    )
