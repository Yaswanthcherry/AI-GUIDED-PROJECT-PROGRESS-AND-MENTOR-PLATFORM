# Deployment Guide — AI-Guided Project Progress Tracking Platform

## 1. Architecture

```
                     ┌────────────────────────────────────────────┐
   Browser  ──https──┤  Frontend (nginx, static React build)      │
                     │  same-origin:  /api ─┐  /health  /docs ─┐  │
                     └──────────────────────┼───────────────────┼──┘
                                            ▼                   ▼
                     ┌────────────────────────────────────────────┐
                     │  Backend (FastAPI + uvicorn)               │
                     │  JWT auth · CORS · logging · /health ·/docs│
                     │  AI Orchestrator → 5 planning agents       │
                     │  Doc Drafter · Mentor · Progress · Insights│
                     └───────────┬───────────────────┬────────────┘
                                 ▼                   ▼
                     ┌──────────────────┐   ┌────────────────────┐
                     │  PostgreSQL 16   │   │  AI provider       │
                     │  users, projects,│   │  OpenAI / Hugging  │
                     │  blueprints,     │   │  Face / offline    │
                     │  tasks, chat…    │   │  (keys stay here)  │
                     └──────────────────┘   └────────────────────┘
```

Security rule baked into this design: **AI keys and DB credentials only ever
reach the backend container.** The frontend receives exactly one build-time
value — `VITE_API_BASE_URL` — and defaults to the relative path `/api`,
so no host (and certainly no secret) is hardcoded in the JS bundle.

## 2. Run locally with Docker (beginner path)

```bash
# 0. Prerequisites: Docker Desktop (or docker + docker compose plugin)
cp .env.example .env
# edit .env: strong JWT_SECRET_KEY + POSTGRES_PASSWORD; optional OPENAI_API_KEY / HF_API_KEY

# 1–3. Build both images and start all three containers
docker compose up --build

# 4. Verify
curl http://localhost:8000/health          # {"status":"ok","database":"ok",...}
open  http://localhost:8080                # frontend (nginx proxies /api → backend)
open  http://localhost:8000/docs           # Swagger

# 5. Full-flow smoke test (register → login → project → blueprint → chat → doc → progress → faculty)
bash backend/scripts/smoke.sh
```

With `DEMO_MODE=true` you can also log straight in with
`student@campus.edu` / `faculty@campus.edu` (password `demo1234`).

Useful commands:

```bash
docker compose logs -f backend            # follow backend logs
docker compose ps                         # container status + health
docker compose down                       # stop (keeps data)
docker compose down -v                    # stop and DELETE the database volume
docker compose up -d --build backend      # rebuild/restart one service
```

## 3. Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | backend | `postgresql://user:pass@host:5432/db` (compose overrides host to `db`) |
| `JWT_SECRET_KEY` | backend | JWT signing secret (accepts `SECRET_KEY` too) |
| `OPENAI_API_KEY` | backend | Enables real LLM agents via LangChain |
| `HF_API_KEY` | backend | Hugging Face fallback provider (accepts `HUGGINGFACE_API_KEY`) |
| `LLM_PROVIDER` | backend | `auto` (default) · `openai` · `huggingface` · `offline` |
| `CORS_ORIGINS` | backend | Comma list of allowed browser origins |
| `DEMO_MODE` | backend | `true` seeds demo accounts + sample project (disable in prod) |
| `POSTGRES_USER/PASSWORD/DB` | db | Postgres superuser/DB for the compose service |
| `VITE_API_BASE_URL` | frontend **build** | `/api` (recommended, same-origin proxy) or `https://api.yourdomain.com` |

## 4. Database migrations

Tables auto-create on first boot (`create_all`), which is fine for first deploy.
For managed migrations (recommended from day two on):

```bash
cd backend
alembic upgrade head                              # apply all migrations
alembic revision --autogenerate -m "add column x" # after changing a model
alembic downgrade -1                              # roll back one step
alembic current                                   # show applied revision
```

Backups: `docker compose exec db pg_dump -U aapm aapm > backup.sql`
Restore: `docker compose exec -T db psql -U aapm aapm < backup.sql`

## 5. Production deployment — single VPS (simplest, recommended start)

Any $6–12/mo VPS (DigitalOcean, Hetzner, Linode…) with Docker installed:

```bash
# on the VPS
git clone <your-repo> && cd <repo>
cp .env.example .env
#  .env: DEMO_MODE=false, strong secrets,
#        CORS_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com
#        VITE_API_BASE_URL=/api

docker compose up -d --build
```

Put a reverse proxy (Caddy is the easiest — automatic HTTPS) in front:

```caddyfile
# /etc/caddy/Caddyfile
app.yourdomain.com {
    reverse_proxy localhost:8080          # frontend nginx
}
api.yourdomain.com {
    reverse_proxy localhost:8000          # FastAPI directly
}
```

Then set `CORS_ORIGINS=https://app.yourdomain.com` and keep
`VITE_API_BASE_URL=/api` (traffic still flows same-origin through the frontend
container — the `api.` host is only needed if you host the frontend elsewhere).

## 6. AWS deployment (no credentials used here — exact steps)

**Backend + DB (ECS Fargate + RDS):**
1. RDS: create PostgreSQL 16 instance (db.t3.micro), note endpoint; allow inbound 5432 from the ECS security group only.
2. ECR: `aws ecr create-repository --repository-name aapm-backend`; build & push:
   `docker build -t aapm-backend backend/ && docker tag … && docker push …`
3. ECS: cluster → task definition (container `aapm-backend`, port 8000, env vars
   `DATABASE_URL` → RDS endpoint, `JWT_SECRET_KEY` via **Secrets Manager**,
   `LLM_PROVIDER`, `OPENAI_API_KEY` via Secrets Manager, `DEMO_MODE=false`,
   `CORS_ORIGINS=https://app.yourdomain.com`).
4. Service behind an Application Load Balancer; target group health check `GET /health`.

**Frontend (S3 + CloudFront):**
1. `VITE_API_BASE_URL=https://api.yourdomain.com npm run build` (absolute origin — CORS configured above).
2. `aws s3 sync dist/ s3://aapm-frontend --delete`.
3. CloudFront distribution → S3 origin; alternate domain `app.yourdomain.com` + ACM cert.

Scale path when you outgrow this: same compose file on AWS App Runner, or ECS
services for all three containers. Kubernetes is not required at this scale.

## 7. Production testing checklist

After every deploy, run through (or just run `bash backend/scripts/smoke.sh`):

- [ ] `GET /health` → `{"status":"ok","database":"ok"}`
- [ ] `/docs` loads; OpenAPI schema visible
- [ ] Register student → 201 + token; duplicate email → 409
- [ ] Login student & faculty → tokens; wrong password → 401
- [ ] Protected route without token → 401 (frontend redirects to /login)
- [ ] Create project → blueprint sections all populated (scores, scope, 6 tech picks, timeline = durationWeeks, risks)
- [ ] `GET /api/projects/{id}` returns the same blueprint (persisted in PostgreSQL)
- [ ] Mentor chat answers referencing the project's own numbers/risks
- [ ] Generate a document → appears in `GET .../docs` (persisted)
- [ ] Update a task → `progress` recomputed; `GET .../progress` returns recommendations
- [ ] Faculty dashboard shows the student's project; `scope=all` denied for students (403)
- [ ] Cross-student access denied (403)
- [ ] Browser console clean on dashboard, blueprint, mentor, docs, progress, faculty pages
- [ ] Secrets audit: `grep -r "sk-" dist/` finds nothing; no keys in frontend bundle or repo

## 8. Remaining issues / honest notes

- The backend could not be executed inside this sandbox (no Python/Docker runtime here); the frontend build passes and the smoke script above is the one-command verification to run on your machine.
- The original Colab notebook remains unreachable (gateway 429s); agents keep marked `NOTEBOOK INTEGRATION POINT`s for pasting its exact logic.
- `docker compose up` runs the app on HTTP; TLS is delegated to Caddy/CloudFront/ALB as described.
- Multi-worker uvicorn + `create_all` at startup is safe (idempotent) but adopt Alembic before schema changes.
