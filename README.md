# AI-Guided Academic Project Progress Tracking Platform

An intelligent project-based learning platform that guides students through academic projects with AI-powered mentorship, progress tracking, and automated documentation generation.

## Features

- **AI Project Mentor** — Conversational guidance grounded in your project's live context
- **Blueprint Generator** — AI-driven project scoping, timeline planning, and risk assessment
- **Progress Tracking** — Week-by-week milestones with automated progress recommendations
- **Document Drafter** — Generates 11 standard academic documents from project data
- **Faculty Dashboard** — Overview of student projects with AI-generated insights
- **Multi-Provider AI** — Supports OpenAI, Hugging Face, or offline deterministic mode

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11+, Pydantic, SQLAlchemy |
| Database | PostgreSQL 16 |
| Auth | JWT with role-based access (Student/Faculty) |
| AI | LangChain orchestrator with multiple LLM providers |

## Quick Start

### Prerequisites

- Docker Desktop or Docker + docker-compose plugin
- Git

### Development with Docker

```bash
# Clone and enter directory
git clone <repository-url>
cd AI-Guided-Project-Progress-Tracking-Platform

# Configure environment
cp .env.example .env
# Edit .env with your settings (JWT_SECRET_KEY, database password, optional API keys)

# Start all services
docker compose up --build

# Verify
curl http://localhost:8000/health
open http://localhost:8080      # Frontend
open http://localhost:8000/docs # API docs
```

### Demo Mode

With `DEMO_MODE=true` (default), use these pre-seeded accounts:
- **Student:** `student@campus.edu` / `demo1234`
- **Faculty:** `faculty@campus.edu` / `demo1234`

### Manual Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/        # AI agents (mentor, timeline, scope, etc.)
│   │   ├── api/           # FastAPI endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── core/          # Config, security, deps
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route components
│   │   ├── components/    # Reusable UI
│   │   ├── services/      # API client
│   │   └── context/       # State management
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── DEPLOYMENT.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for JWT token signing |
| `OPENAI_API_KEY` | OpenAI API key (optional) |
| `HF_API_KEY` | Hugging Face API key (optional) |
| `LLM_PROVIDER` | `auto`, `openai`, `huggingface`, or `offline` |
| `DEMO_MODE` | Seed demo accounts when `true` |
| `CORS_ORIGINS` | Allowed browser origins |

## API Documentation

FastAPI auto-generates OpenAPI docs at `http://localhost:8000/docs`. Key endpoints:

- `POST /auth/register` — User registration
- `POST /auth/login` — Get JWT token
- `POST /projects` — Create new project
- `GET /projects/{id}` — Get project with blueprint
- `POST /projects/{id}/chat` — Mentor chat
- `GET /projects/{id}/progress` — Progress recommendations
- `GET /faculty/projects` — Faculty dashboard

## License

MIT License