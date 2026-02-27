<p align="center">
  <strong>Prism</strong> — Open-Source Claude API Cost & Usage Analytics
</p>

<p align="center">
  Drop-in proxy that tracks every Claude API call — cost, tokens, latency, by team.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/python-3.12+-green.svg" alt="Python">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/docker-ready-2496ED.svg" alt="Docker">
</p>

---

## The Problem

Companies deploying Claude across Legal, Sales, Engineering, HR, and Finance teams have zero visibility into what it's costing them. "What did Claude cost us this month?" has no answer. Anthropic's console shows total spend — but not *who* spent it, *which model*, or *whether it was worth it*.

Prism answers that in under 5 minutes.

## How It Works

```
Your App  ──→  Prism Proxy (FastAPI)  ──→  Anthropic API
                      │
                      ▼
                PostgreSQL (logs every request)
                      │
                      ▼
                React Dashboard (cost, tokens, latency — by team, model, key)
```

**It's a drop-in replacement.** Change your `base_url` from `api.anthropic.com` to your Prism instance. Everything else stays the same — same SDK, same headers, same streaming. Prism forwards the request, logs the metadata, and returns the response untouched.

## Features

- **Real-time cost dashboard** — total spend, requests, tokens, avg latency at a glance
- **Cost by model** — see exactly how much Opus vs Sonnet vs Haiku is costing you
- **Cost by team/key** — each API key gets a label (Legal, Sales, Engineering) with color coding
- **Streaming support** — full SSE pass-through, zero buffering, usage extracted from stream events
- **Request log viewer** — paginated table of every request with model, tokens, cost, status, latency
- **Cost over time** — daily/weekly/hourly charts with configurable time ranges (7d, 30d, 90d)
- **Glassmorphism UI** — dark, premium dashboard built with the Prism design system
- **Background logging** — non-blocking; proxy adds <10ms latency overhead
- **Encryption at rest** — Anthropic API keys are Fernet-encrypted (AES-256) before storage
- **JWT auth** — email/password signup, token-based sessions

## Quickstart

### Option A: Docker (recommended)

```bash
git clone https://github.com/reshevyas-png/claude-usage-analytics.git
cd claude-usage-analytics
docker compose up
```

- Dashboard: http://localhost:3000
- API/Proxy: http://localhost:8000
- Health check: http://localhost:8000/health

### Option B: Manual Setup

**Backend:**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL (macOS Homebrew):
LC_ALL="en_US.UTF-8" pg_ctl -D /opt/homebrew/var/postgresql@16 start
createdb claude_analytics

# Run migrations and start server:
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

### Seed Demo Data

Want to see the dashboard with realistic data instantly? Run the seed script:

```bash
cd backend
python seed.py
```

This creates a demo account (`demo@acme.com` / `demo1234`) with 6 department keys and ~5,700 request logs spread over 90 days — Engineering, Sales, Legal, Marketing, HR, and Finance, each with realistic usage patterns.

## Usage

### 1. Create an account and API key

Sign up on the dashboard, then go to **API Keys → Create Proxy Key**. Enter your Anthropic API key and a label (e.g., "Engineering"). You'll receive a proxy key starting with `cua-`.

### 2. Route your traffic through Prism

**Python (Anthropic SDK):**

```python
import anthropic

client = anthropic.Anthropic(
    api_key="cua-your-proxy-key",
    base_url="http://localhost:8000",
)

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude!"}],
)
print(message.content[0].text)
```

**curl:**

```bash
curl -X POST http://localhost:8000/v1/messages \
  -H "x-api-key: cua-your-proxy-key" \
  -H "content-type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 3. Open the dashboard

Every request is logged automatically. Open the dashboard to see cost, tokens, latency — broken down by model, team, and time period.

## Dashboard

The dashboard has 4 main views:

| Page | What it shows |
|------|---------------|
| **Dashboard** | Hero cost card, KPI grid (spend, requests, avg cost, latency), cost-over-time chart, cost-by-model breakdown, cost-by-team donut chart |
| **API Keys** | Create/manage proxy keys with department labels, color-coded by team |
| **Request Logs** | Paginated table of every request — time, key, model, input/output tokens, cost, latency, status code |
| **Login** | Email/password auth with JWT sessions |

> Screenshots coming soon. Run `python seed.py` and see it yourself.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | Python 3.12 + FastAPI | Async everywhere (asyncpg, httpx) |
| Database | PostgreSQL 16 | Indexed on `(api_key_id, created_at)` and `(model, created_at)` |
| ORM | SQLAlchemy 2.x async | `async_sessionmaker`, `mapped_column` |
| Migrations | Alembic | Async engine support |
| Auth | JWT (HS256) | `python-jose` + `passlib[bcrypt]` |
| Encryption | Fernet (AES-256) | PBKDF2HMAC key derivation |
| Frontend | React 19 + TypeScript | Vite 7, Tailwind CSS v4 |
| Charts | Recharts 3 | Area charts, bar charts, donut charts |
| Design | Prism (glassmorphism) | Inter + JetBrains Mono, dark-only |

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account (email, password, company) |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Current user info |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/keys` | Create proxy key (returns key once) |
| GET | `/keys` | List your keys |
| DELETE | `/keys/{id}` | Delete a key |

### Proxy
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/messages` | Forward to Anthropic (streaming + non-streaming) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/summary?period=30d` | Total requests, tokens, cost, latency |
| GET | `/analytics/cost-over-time?period=30d&granularity=day` | Time series data |
| GET | `/analytics/by-model?period=30d` | Cost grouped by model |
| GET | `/analytics/by-key?period=30d` | Cost grouped by API key/team |
| GET | `/analytics/requests?page=1&limit=50` | Paginated request log |

## Roadmap

- [ ] **Person-level tracking** — `x-cua-user`, `x-cua-department`, `x-cua-project` headers for per-person analytics
- [ ] **Cost alerts** — Email/Slack notifications when spend exceeds thresholds
- [ ] **Multi-model support** — OpenAI + Gemini proxy routes (unified cost view across providers)
- [ ] **Budget forecasting** — project next month's spend based on trends
- [ ] **CSV/PDF export** — download reports for finance teams
- [ ] **Go proxy rewrite** — production-grade proxy for high-throughput deployments
- [ ] **Docker Hub image** — `docker pull prism/proxy` one-liner setup

## Contributing

PRs welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Run the backend
cd backend && uvicorn app.main:app --reload

# Run the frontend
cd frontend && npm run dev

# Build check (run before committing)
cd frontend && npm run build
```

## License

[Apache 2.0](LICENSE)

---

Built because "what did Claude cost us?" shouldn't be a hard question.
