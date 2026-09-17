# =====================================================================
# AI-Guided Project Progress Tracking Platform — FastAPI backend
# Build from backend/:  docker build -t aapm-backend .
# Config comes ONLY from environment variables (see ../.env.example).
# =====================================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# psycopg2 needs libpq; curl powers the healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY app ./app
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=4s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# Production server (workers = 2x CPU cores is a good default)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
