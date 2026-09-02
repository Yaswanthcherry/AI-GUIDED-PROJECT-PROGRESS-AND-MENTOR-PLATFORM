#!/usr/bin/env bash
# =====================================================================
# Production smoke test — exercises the full flow against a running API.
# Usage:  BASE=http://localhost:8000 bash backend/scripts/smoke.sh
# Requires: curl + python3 (for JSON parsing).
# =====================================================================
set -euo pipefail

BASE="${BASE:-http://localhost:8000}"
J() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
step() { printf '\n\033[1m→ %s\033[0m\n' "$1"; }

step "1. Health"
curl -fsS "$BASE/health" | python3 -m json.tool
ok "/health reachable"

step "2. Register student + faculty"
STUDENT=$(curl -fsS -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Student","email":"smoke.student@example.com","password":"password123","role":"student"}')
TOKEN=$(echo "$STUDENT" | J "d['token']")
FACULTY=$(curl -fsS -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Faculty","email":"smoke.faculty@example.com","password":"password123","role":"faculty"}')
FTOKEN=$(echo "$FACULTY" | J "d['token']")
ok "registered both roles"

step "3. Login"
curl -fsS -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"smoke.student@example.com","password":"password123"}' > /dev/null
ok "login returns token"

step "4. Create project (runs full agent pipeline)"
PROJECT=$(curl -fsS -X POST "$BASE/api/projects" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{
  "title":"Smoke Test Chatbot",
  "idea":"A retrieval-augmented chatbot answering campus support questions from an institutional knowledge base with confidence scores.",
  "problemStatement":"Support staff repeat the same answers for hours while students wait; keyword bots fail on paraphrased questions.",
  "domain":"AI / Machine Learning","technologies":"Python","teamSize":2,"durationWeeks":10,"level":"Undergraduate — Final Year"}')
PID=$(echo "$PROJECT" | J "d['id']")
VERDICT=$(echo "$PROJECT" | J "d['blueprint']['evaluation']['verdict']")
TASKS=$(echo "$PROJECT" | J "len(d['tasks'])")
ok "project $PID · verdict: $VERDICT · $TASKS tasks materialized"

step "5. AI mentor chat"
REPLY=$(curl -fsS -X POST "$BASE/api/projects/$PID/chat" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"content":"What are the risks in my project?"}')
echo "$REPLY" | J "d['content']" | head -c 240; echo "…"
ok "mentor replied (agent: $(echo "$REPLY" | J "d['agent']"))"

step "6. Generate documentation"
curl -fsS -X POST "$BASE/api/projects/$PID/documents/generate" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"type":"synopsis"}' > /dev/null
ok "synopsis generated and stored"

step "7. Update progress"
TASK_ID=$(echo "$PROJECT" | J "d['tasks'][0]['id']")
UPDATED=$(curl -fsS -X POST "$BASE/api/projects/$PID/progress" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"taskId\":\"$TASK_ID\",\"status\":\"done\"}")
PROG=$(echo "$UPDATED" | J "d['progress']")
RECS=$(curl -fsS "$BASE/api/projects/$PID/progress" -H "Authorization: Bearer $TOKEN" | J "len(d['recommendations'])")
ok "progress now $PROG% · Progress Agent returned $RECS recommendations"

step "8. Faculty dashboard + insights"
curl -fsS "$BASE/api/faculty/dashboard" -H "Authorization: Bearer $FTOKEN" | J "d['totals']"
curl -fsS "$BASE/api/faculty/insights/$PID" -H "Authorization: Bearer $FTOKEN" | J "d['insights'][0]"
ok "faculty endpoints healthy"

step "9. Permission checks"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/faculty/dashboard" -H "Authorization: Bearer $TOKEN")
[ "$CODE" = "403" ] && ok "student blocked from faculty API (403)" || { echo "  ✗ expected 403, got $CODE"; exit 1; }
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/projects")
[ "$CODE" = "401" ] && ok "missing token rejected (401)" || { echo "  ✗ expected 401, got $CODE"; exit 1; }

printf '\n\033[32m\033[1mAll smoke tests passed.\033[0m\n'
