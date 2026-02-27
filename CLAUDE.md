# Prism — AI Cost & Usage Analytics

## What This Is
Enterprise FinOps for AI. A proxy-based SaaS that intercepts Claude API calls, logs usage metadata, and displays cost/analytics on a premium dashboard. Think "Datadog for LLM spend."

**Business model:** Free tier → Team $199/mo → Enterprise $2,500/mo (or 2-3% of tracked AI spend)

## Architecture

```
Company's App → PROXY (FastAPI) → Anthropic API
                    ↓
              PostgreSQL (logs)
                    ↓
              React Dashboard (Prism UI)
```

### Monorepo Structure
```
claude-usage-analytics/
├── backend/          # Python FastAPI — proxy + API + auth
│   ├── app/
│   │   ├── main.py           # FastAPI app entry, CORS, router mounts
│   │   ├── config.py         # Settings (env prefix: CUA_), model pricing
│   │   ├── database.py       # SQLAlchemy async engine + session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── user.py       # User (email, password_hash, company)
│   │   │   ├── api_key.py    # ApiKey (key_hash, prefix, encrypted anthropic key)
│   │   │   └── request_log.py # RequestLog (model, tokens, cost, latency, JSONB metadata)
│   │   ├── routers/
│   │   │   ├── auth.py       # JWT auth (signup, login, /me)
│   │   │   ├── keys.py       # Proxy key CRUD
│   │   │   ├── proxy.py      # THE CORE — /v1/messages forward (streaming + non-streaming)
│   │   │   └── analytics.py  # Dashboard data endpoints (5 routes)
│   │   ├── services/
│   │   │   ├── encryption.py # Fernet AES encryption for Anthropic keys
│   │   │   ├── log_service.py # Async request logging + cost calculation
│   │   │   └── analytics_service.py # SQL aggregation queries
│   │   └── middleware/
│   │       └── proxy_auth.py # x-api-key validation for proxy route
│   ├── alembic/              # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React + Vite + Tailwind v4 — "Prism" design system
│   ├── src/
│   │   ├── App.tsx           # Sidebar layout + routes
│   │   ├── index.css         # Prism design tokens, glassmorphism, animations
│   │   ├── lib/
│   │   │   ├── api.ts        # Typed API client with JWT auth
│   │   │   ├── auth.tsx      # React auth context (token in localStorage)
│   │   │   └── colors.ts     # Department color map (shared across all pages)
│   │   ├── components/       # Reusable chart/card components
│   │   └── pages/            # Dashboard, Keys, Requests, Login
│   └── ...config files
├── design/           # Cowork design artifacts (reference only)
├── docker-compose.yml
└── CLAUDE.md
```

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | Python 3.12 + FastAPI | Async everywhere (asyncpg, httpx) |
| Database | PostgreSQL 16 | Homebrew on macOS, Docker in prod |
| ORM | SQLAlchemy 2.x async | `async_sessionmaker`, `mapped_column` |
| Migrations | Alembic | Async engine, custom `sys.path` fix in env.py |
| Auth | JWT (HS256) | `python-jose`, `passlib[bcrypt]` — PINNED bcrypt==4.2.1 |
| Encryption | Fernet (AES-256) | PBKDF2HMAC key derivation from config string |
| Frontend | React 19 + TypeScript | Vite 7, Tailwind CSS v4 (uses `@tailwindcss/vite` plugin) |
| Charts | Recharts 3 | Formatter types need `number | undefined` in v3 |
| Design | "Prism" glassmorphism | Inter + JetBrains Mono fonts, dark-only |

## Development Setup

### Prerequisites
- Python 3.12+, Node 22+, PostgreSQL 16
- macOS: `brew install postgresql@16 node`

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Start Postgres (macOS Homebrew — needs LC_ALL fix):
LC_ALL="en_US.UTF-8" pg_ctl -D /opt/homebrew/var/postgresql@16 start
createdb claude_analytics
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173 (proxies API to :8000)
```

### Both together (Docker)
```bash
docker compose up
```

## Key Conventions

### Backend
- **All env vars prefixed with `CUA_`** (e.g., `CUA_DATABASE_URL`, `CUA_JWT_SECRET`)
- **Database URL for local dev:** `postgresql+asyncpg://rishivyas@localhost:5432/claude_analytics` (Homebrew peer auth, no password)
- **Proxy keys format:** `cua-{secrets.token_hex(24)}` — stored as SHA256 hash
- **Cost calculation uses Anthropic's own token counts** from response `usage` field, NOT a tokenizer
- **Streaming proxy:** Parse SSE events — `message_start` has `input_tokens`, `message_delta` has `output_tokens`
- **Background tasks for logging:** Non-blocking via FastAPI `BackgroundTasks`
- **Analytics queries are user-scoped:** Always filter by user's API keys via subquery

### Frontend
- **Tailwind v4 syntax:** `@import "tailwindcss"` in index.css, tokens in `@theme {}` block
- **Prism design system:** Glassmorphism cards (`.glass-card`), near-black background (#0A0B0F), amber/violet accents
- **Department colors are centralized** in `src/lib/colors.ts` — used on Dashboard, Keys, and Requests pages
- **Color coding logic:** Label-based keyword matching (label contains "legal" → violet, "sales" → amber, etc.)
- **Recharts v3 types:** Tooltip formatters must accept `number | undefined`, not just `number`
- **Import types with `type` keyword:** `import { type ReactNode }` (verbatimModuleSyntax enabled)

## Known Gotchas

1. **bcrypt 5.x breaks passlib** → Pin `bcrypt==4.2.1` in requirements.txt
2. **PostgreSQL on macOS** → May need `LC_ALL="en_US.UTF-8"` to start
3. **Alembic can't find `app` module** → `env.py` has `sys.path.insert(0, ...)` fix
4. **Tailwind v4 + Tremor incompatible** → We use Recharts directly, no Tremor
5. **Streaming cost logging** → Relies on Anthropic's SSE format; audit if their streaming format changes
6. **Port PATH on macOS** → Need to export `/opt/homebrew/bin:/opt/homebrew/opt/postgresql@16/bin` in PATH

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/signup | Create account |
| POST | /auth/login | Get JWT token |
| GET | /auth/me | Current user info |

### Keys
| Method | Path | Description |
|--------|------|-------------|
| POST | /keys | Create proxy key (returns key once) |
| GET | /keys | List user's keys |
| DELETE | /keys/{id} | Delete key |

### Proxy (the product)
| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/messages | Forward to Anthropic (streaming + non-streaming) |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | /analytics/summary | Total requests, tokens, cost, latency |
| GET | /analytics/cost-over-time | Daily cost timeseries |
| GET | /analytics/by-model | Cost grouped by model |
| GET | /analytics/by-key | Cost grouped by API key/team |
| GET | /analytics/requests | Paginated request log |

## Pricing Config (in config.py)
```python
"claude-opus-4-6":            {"input": 15.0, "output": 75.0}    # per 1M tokens
"claude-sonnet-4-6":          {"input": 3.0,  "output": 15.0}
"claude-haiku-4-5-20251001":  {"input": 0.80, "output": 4.0}
```

---

## Workflow

1. **Understand** — Listen to what the user wants. Do not edit code yet.
2. **Review** — Read the existing code that will be affected. Understand the Prism design system, backend patterns, and DB schema before making changes.
3. **Plan** — Describe changes in plain English. Get explicit approval before editing.
4. **Build** — Make changes following existing code style, conventions, and design system.
5. **Test** — Verify locally: backend (`uvicorn`), frontend (`npm run dev`), check browser, run `npm run build` for type errors.
6. **Commit** — Stage and commit with a clear message. Always ask before pushing.

---

## Boundaries

### Always Ask Before
- **Any git push** — always confirm before pushing to any remote branch
- **Changing the Prism design system** — colors, fonts, glassmorphism patterns, animation styles
- **Adding external dependencies** — new pip packages or npm packages
- **Changing the database schema** — any model changes require an Alembic migration
- **Changing the proxy forwarding logic** — `routers/proxy.py` is the core product; changes affect every API call
- **Changing the `localStorage` key** — `'token'` would break existing auth sessions
- **Deleting code or features** — confirm before removing functionality
- **Modifying encryption logic** — `services/encryption.py` handles Anthropic key security
- **Changing env var names** — `CUA_*` prefix is established; renaming breaks deployments
- **Deploying to production** — never deploy without explicit user approval

### Never Do
- Never commit `.env` files or any file containing API keys or secrets
- Never log secret values (`print(api_key)`, `console.log(token)`) — security violation
- Never hardcode credentials — not even temporarily, not even in comments
- Never bypass safety checks (`--no-verify`, `--force`, etc.) without the user requesting it
- Never push to remote without explicit approval
- Never use `innerHTML` for user-provided text — use safe rendering (React handles this, but never use `dangerouslySetInnerHTML`)
- Never store unencrypted Anthropic API keys — always use Fernet encryption via `encryption.py`
- Never return full API keys in responses — only `key_prefix` (first 8 chars)
- Never skip user-scoping on analytics queries — all data must be filtered by the authenticated user's keys
- Never add synchronous blocking calls in the proxy path — logging must be async via `BackgroundTasks`
- Never hardcode color values in components — use CSS variables or `colors.ts`

### Always Do
- Read existing code before modifying it — understand the current pattern first
- Match the Prism design language (glassmorphism, dark theme, CSS variables, Inter + JetBrains Mono)
- Use department colors from `src/lib/colors.ts` — never define ad-hoc colors for departments
- Use `CUA_` prefix for all new environment variables
- Validate env vars at startup — fail fast if required config is missing
- Use async/await everywhere in the backend — no sync DB calls
- Scope all analytics queries by `user_id` — never expose cross-user data
- Run `npm run build` before committing frontend changes (catches TypeScript errors)
- Use Recharts v3 formatter pattern: accept `number | undefined`, use `value ?? 0`
- Use `import { type X }` for type-only imports (verbatimModuleSyntax)
- Pin `bcrypt==4.2.1` — do not upgrade without testing passlib compatibility

---

## Security

- **API key encryption**: Anthropic keys are Fernet-encrypted (AES-256) before DB storage. Never store plaintext.
- **Proxy key hashing**: Proxy keys (`cua-*`) are SHA256-hashed. The raw key is shown once on creation, never again.
- **JWT tokens**: HS256 signed, stored in `localStorage`. Backend validates on every authenticated request.
- **No secrets in code**: Never commit API keys, even in example code or comments.
- **Env vars**: All secrets in `.env` with `CUA_` prefix. Verify `.gitignore` includes `.env` before any commit.
- **SQL injection prevention**: SQLAlchemy ORM handles parameterization. Never use raw SQL string interpolation.
- **CORS**: Configured in `main.py`. Review allowed origins before deploying to production.
- **Input validation**: FastAPI `Query()` patterns validate period/granularity params. Add validation for any new user inputs.
- **XSS**: React escapes by default. Never use `dangerouslySetInnerHTML` with user content.

---

## Git Workflow

### Branches
- `main` — stable, working code
- `feature/{short-description}` — new features
- `fix/{short-description}` — bug fixes

### Flow
```
feature/add-person-tracking → main
```
1. Create a feature branch from `main`
2. Make changes, commit with clear messages
3. Run `npm run build` (frontend) and verify backend starts clean
4. Merge back to `main` when ready

### Commits
- Concise messages focused on the "why": `Add department color coding to request logs`
- One logical change per commit
- Never commit `.env`, `__pycache__`, `node_modules`, or files containing secrets

### Repository
- `.gitignore` must include at minimum:
  ```
  .env
  .env.*
  .DS_Store
  __pycache__/
  node_modules/
  *.pyc
  venv/
  ```

---

## Performance Standards

- **Proxy latency overhead**: Target <10ms added on top of Anthropic response time
- **Non-blocking logging**: All request logging via FastAPI `BackgroundTasks` — never block the proxy response
- **Frontend bundle**: Keep production build under 250KB gzipped
- **Fonts**: Google Fonts loaded with `display=swap` (prevents invisible text flash)
- **Database indexes**: Ensure indexes on `(api_key_id, created_at)` and `(model, created_at)` for analytics queries
- **Pagination**: Always paginate request logs (default 50, max 100). Never return unbounded result sets.
- **Streaming proxy**: SSE pass-through must not buffer — stream chunks to client as they arrive from Anthropic

---

## Accessibility (WCAG AA)

- MUST maintain 4.5:1 contrast ratio for body text, 3:1 for large text and UI elements
- MUST ensure all interactive elements (buttons, inputs, links) are keyboard-accessible
- MUST provide visible focus styles on all interactive elements
- SHOULD respect `prefers-reduced-motion` — disable glassmorphism animations when set
- SHOULD use semantic HTML (`<main>`, `<nav>`, `<header>`) instead of generic `<div>` where appropriate
- SHOULD add `aria-label` attributes to icon-only buttons (sidebar nav, delete actions)
- SHOULD ensure data tables have proper `<thead>` / `<tbody>` structure (already implemented)

---

## Audit Checklist (run before major releases)

- [ ] No hardcoded API keys or secrets anywhere in codebase
- [ ] `.env` is in `.gitignore` and not committed
- [ ] All Anthropic keys stored Fernet-encrypted in DB
- [ ] Proxy keys stored as SHA256 hashes only
- [ ] All analytics queries scoped by authenticated user's API keys
- [ ] CSS variables used consistently — no orphaned hex values in components
- [ ] Department colors all flow from `src/lib/colors.ts`
- [ ] `npm run build` passes with zero errors
- [ ] Backend starts cleanly (`uvicorn app.main:app`)
- [ ] Proxy latency overhead <10ms on local testing
- [ ] No `console.log` statements leaking sensitive data
- [ ] CORS origins appropriate for deployment environment
- [ ] All env vars documented with `CUA_` prefix in config.py
- [ ] Database migrations up to date (`alembic upgrade head` works cleanly)

---

## Next Steps (Roadmap)
1. **Person-level tracking** — `x-cua-user`, `x-cua-department`, `x-cua-project` headers → JSONB metadata → new analytics endpoints + drilldown UI
2. **Push to GitHub** — Public repo, open-source proxy core (Apache 2.0)
3. **Show HN post** — "Show HN: Open-source Claude API cost tracker"
4. **Dog-food** — Route own Claude usage through proxy
5. **Multi-model support** — Add OpenAI + Gemini proxy routes
6. **Go proxy rewrite** — Production-grade proxy by Month 3
