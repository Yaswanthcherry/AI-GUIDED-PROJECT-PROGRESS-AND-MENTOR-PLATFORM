# =====================================================================
# AI-Guided Project Progress Tracking Platform — frontend
# Build context is ./frontend (directory containing package.json + src/):
#   docker compose build frontend
#   or: docker build -f frontend/Dockerfile -t aapm-frontend ./frontend
#
# VITE_API_BASE_URL is baked at build time:
#   /api (default)            -> same-origin; nginx proxies to the backend
#   https://api.example.com   -> call separately hosted backend (CORS applies)
# =====================================================================
FROM node:20-alpine AS build

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.js ./
COPY src ./src
RUN npm run build

# ---------------- runtime ----------------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=20s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
