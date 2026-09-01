"""
Domain knowledge base + deterministic composers.

These are the agents' fallback brains (used when LLM_PROVIDER=offline or a
provider call fails). They compose output from the actual project input, so
different input always produces a different blueprint.
"""
from __future__ import annotations

import uuid
from typing import Any

DOMAINS = [
    "AI / Machine Learning",
    "Web Development",
    "Mobile Development",
    "Data Science & Analytics",
    "IoT & Embedded",
    "Cloud & DevOps",
    "Cybersecurity",
    "Blockchain",
]


def new_id() -> str:
    return str(uuid.uuid4())[:13]


def clamp(n: float, lo: float, hi: float) -> float:
    return min(hi, max(lo, n))


def hash01(s: str) -> float:
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return (h % 1000) / 1000


def _g(risk: str, category: str, severity: str, probability: str, mitigation: str) -> dict[str, str]:
    return {"risk": risk, "category": category, "severity": severity, "probability": probability, "mitigation": mitigation}


_PRESETS: dict[str, dict[str, Any]] = {
    "AI / Machine Learning": {
        "stack": [
            ("Frontend", "React + TypeScript", "Component model scales well for chat/visualization UIs; strong typing reduces integration bugs during the ML hand-off.", "Streamlit (faster prototyping)"),
            ("Backend", "FastAPI (Python)", "Native async support for model inference and tight fit with the Python ML ecosystem.", "Flask"),
            ("AI / ML", "sentence-transformers + FAISS (RAG)", "Local embeddings keep costs zero and data on-campus; FAISS gives sub-second retrieval over the knowledge base.", "LangChain + hosted LLM API"),
            ("Database", "PostgreSQL + pgvector", "Single engine for app data and vector search — one less service to operate for a student team.", "MongoDB Atlas Vector Search"),
            ("Deployment", "Docker + Render / campus VM", "Containerised deploy makes the demo reproducible for evaluators.", "AWS EC2 free tier"),
            ("Libraries & Frameworks", "Pydantic, React Query, Tailwind CSS", "Typed contracts between model output and UI; cache management for inference calls.", "SWR"),
        ],
        "architecture": {
            "layers": [
                {"name": "Client", "components": ["React Web App", "Chat Widget", "Admin Console"]},
                {"name": "API Gateway", "components": ["FastAPI REST", "Auth & Rate Limiting", "WebSocket Stream"]},
                {"name": "Intelligence Services", "components": ["RAG Pipeline", "Embedding Service", "Prompt Manager", "Evaluation Harness"]},
                {"name": "Data Layer", "components": ["PostgreSQL", "Vector Store (FAISS)", "Knowledge Base"]},
            ],
            "dataFlow": [
                "User query is normalised and sent to the API gateway over REST/WebSocket.",
                "The Embedding Service converts the query into a vector and hits the Vector Store.",
                "Top-k chunks are reranked and packed into a prompt by the Prompt Manager.",
                "The generated answer is streamed back to the client and logged for evaluation.",
            ],
        },
        "features": [
            "Multi-turn conversational interface with session memory",
            "Retrieval-augmented answers grounded in the knowledge base",
            "Confidence scoring with human-handoff fallback",
            "Admin panel to curate the knowledge base",
            "Analytics on question categories and deflection rate",
            "Exportable Q&A evaluation report (BLEU + human rating)",
        ],
        "risks": [
            _g("Dataset availability — real support transcripts may be restricted", "Data", "High", "Medium", "Fall back to a public dataset (e.g., Ubuntu Dialogue Corpus) plus 100+ seeded campus FAQs; document the substitution in the report."),
            _g("Hallucinated or unverifiable answers", "Model", "High", "Medium", "Constrain generation with retrieval-only grounding, add a confidence threshold and a 'not sure' path."),
            _g("Inference latency on low-spec machines", "Performance", "Medium", "Medium", "Batch embeddings, cache frequent queries, quantise the model; set a 2s response budget."),
            _g("Team skill gap in vector search tuning", "Team", "Low", "Medium", "Time-box retrieval experiments in week 4–5 and keep a simple keyword fallback."),
        ],
    },
    "Web Development": {
        "stack": [
            ("Frontend", "React + TypeScript + Vite", "Fast dev loop, huge ecosystem, and evaluators can run it locally with one command.", "Next.js"),
            ("Backend", "Node.js + Express", "Same language across the stack shrinks the learning curve for a small team.", "NestJS"),
            ("AI / ML", "Chart.js / Recharts", "Declarative charts cover dashboard needs without a BI tool.", "D3 (steeper curve)"),
            ("Database", "PostgreSQL + Prisma", "Relational integrity for core records; Prisma's typed queries prevent most schema bugs.", "MySQL"),
            ("Deployment", "Vercel + Render (free tiers)", "Zero-ops hosting keeps the team focused on features; preview URLs help faculty review.", "Netlify + Railway"),
            ("Libraries & Frameworks", "Tailwind CSS, React Query, Zod", "Rapid consistent UI, server-state caching, and runtime validation of API payloads.", "React Hook Form + Yup"),
        ],
        "architecture": {
            "layers": [
                {"name": "Client", "components": ["React SPA", "Responsive Layouts", "Role-based Views"]},
                {"name": "API Layer", "components": ["Express REST API", "JWT Auth", "Validation Middleware"]},
                {"name": "Services", "components": ["Business Rules", "Reporting Engine", "Notification Service"]},
                {"name": "Data Layer", "components": ["PostgreSQL", "Prisma ORM", "Object Storage"]},
            ],
            "dataFlow": [
                "The SPA issues typed REST calls with a JWT bearer token.",
                "Validation middleware rejects malformed payloads before business logic runs.",
                "Services apply domain rules and persist through the Prisma ORM.",
                "Reporting endpoints aggregate reads; the SPA caches them with React Query.",
            ],
        },
        "features": [
            "Role-based dashboards with protected routes",
            "CRUD modules with inline validation",
            "Search, filtering and CSV export",
            "Realtime notifications via WebSockets",
            "Audit trail of record changes",
            "Responsive layouts down to 360px",
        ],
        "risks": [
            _g("Scope creep from stakeholder feature requests", "Scope", "Medium", "High", "Freeze the feature list after week 3; park new requests in a 'v2' backlog shown in the report."),
            _g("API contract drift between frontend and backend", "Integration", "Medium", "Medium", "Define Zod schemas first and share them across both sides of the repo."),
            _g("Third-party service limits on free tiers", "Infra", "Low", "Medium", "Cache aggressively and keep a local fallback dataset for demos."),
            _g("Uneven contribution across team members", "Team", "Medium", "Medium", "Assign module ownership in week 1 and review PRs in pairs weekly."),
        ],
    },
    "Mobile Development": {
        "stack": [
            ("Frontend", "Flutter", "One codebase for Android + iOS demo builds; hot reload speeds up a short timeline.", "React Native"),
            ("Backend", "Firebase (Auth, Firestore, FCM)", "Managed backend removes server ops for a small team; offline sync is built in.", "Supabase"),
            ("AI / ML", "Riverpod / BLoC", "Predictable state for offline-first flows.", "Provider"),
            ("Database", "Cloud Firestore", "Schema-less docs map well to campus use-cases and sync offline.", "SQLite + custom sync"),
            ("Deployment", "Firebase App Distribution", "Evaluators install the APK/TestFlight build without store review.", "Play Internal Testing"),
            ("Libraries & Frameworks", "google_maps_flutter, camera, image_picker", "Cover location and capture needs with first-party plugins.", "Platform channels"),
        ],
        "architecture": {
            "layers": [
                {"name": "Client", "components": ["Flutter App", "Offline Cache", "Push Handlers"]},
                {"name": "Backend-as-a-Service", "components": ["Firebase Auth", "Cloud Functions", "FCM"]},
                {"name": "Data Layer", "components": ["Firestore", "Cloud Storage"]},
            ],
            "dataFlow": [
                "The app writes to Firestore with optimistic UI; sync resolves when online.",
                "Cloud Functions enforce rules and trigger push notifications via FCM.",
                "Media uploads go to Cloud Storage with signed URLs stored in the document.",
            ],
        },
        "features": [
            "Offline-first data entry with background sync",
            "Push notifications for reminders",
            "Camera capture with on-device compression",
            "Map view of geo-tagged records",
            "Profile & settings with biometric lock",
            "Accessible contrast & font scaling",
        ],
        "risks": [
            _g("Device fragmentation during evaluation", "Platform", "Medium", "Medium", "Test on 3 reference devices and record a demo video as a fallback."),
            _g("Store/distribution delays for evaluator installs", "Release", "Medium", "Medium", "Use Firebase App Distribution links; ship a web-preview build."),
            _g("Offline-sync edge cases (conflicting edits)", "Data", "High", "Medium", "Apply last-write-wins with a visible conflict banner in v1."),
        ],
    },
    "Data Science & Analytics": {
        "stack": [
            ("Frontend", "Streamlit / Dash", "Turns analysis scripts into an interactive dashboard reviewers can click.", "Flask + Plotly"),
            ("Backend", "Python (pandas, scikit-learn)", "The lingua franca for EDA and modelling; everything runs in notebooks for the report.", "R"),
            ("AI / ML", "Plotly + seaborn", "Interactive + publication-quality static charts for the report.", "Matplotlib"),
            ("Database", "DuckDB / PostgreSQL", "DuckDB gives in-process analytics speed on CSV/Parquet without a server.", "SQLite"),
            ("Deployment", "GitHub Pages / Streamlit Cloud", "Free hosted demo the faculty can open from the report link.", "Render"),
            ("Libraries & Frameworks", "Jupyter, Great Expectations", "Reproducible pipeline: extract → clean → validate → model → visualise.", "Airflow (overkill)"),
        ],
        "architecture": {
            "layers": [
                {"name": "Presentation", "components": ["Streamlit Dashboard", "Exportable Reports"]},
                {"name": "Analytics Services", "components": ["ETL Pipeline", "Validation Layer", "Model Store"]},
                {"name": "Data Layer", "components": ["DuckDB / PostgreSQL", "Parquet Lake", "Source CSV APIs"]},
            ],
            "dataFlow": [
                "Source records are extracted on a schedule into the parquet lake.",
                "Validation rules quarantine bad rows and surface a data-quality score.",
                "Models are trained offline and loaded as pickles by the dashboard.",
                "Streamlit renders interactive slices and exports static charts.",
            ],
        },
        "features": [
            "Automated ETL from campus data exports",
            "Data-quality scorecard per ingestion",
            "Interactive dashboards with drill-downs",
            "Anomaly detection on key metrics",
            "Forecasting with confidence intervals",
            "One-click PDF report export",
        ],
        "risks": [
            _g("Access to real institutional data may be delayed or denied", "Data", "High", "High", "Request access in week 1; prepare a realistic synthetic dataset generator as fallback and disclose it."),
            _g("Messy, inconsistent source records", "Data", "Medium", "High", "Budget a full cleaning week; enforce validation rules and document every imputation."),
            _g("Model accuracy below target on small data", "Model", "Medium", "Medium", "Report honest baselines; prefer interpretable models over chasing accuracy."),
        ],
    },
    "IoT & Embedded": {
        "stack": [
            ("Frontend", "Grafana", "Instant professional dashboards over TimescaleDB for the demo.", "Custom React charts"),
            ("Backend", "Node.js bridge service", "Bridges MQTT topics to a REST API and persists readings.", "Python + paho-mqtt"),
            ("AI / ML", "Alerting rules engine", "Windowed threshold evaluation fires notifications without ML overhead.", "TinyML on-device"),
            ("Database", "TimescaleDB", "Time-series storage with retention policies fits sensor data naturally.", "InfluxDB"),
            ("Deployment", "Docker + MQTT broker (Mosquitto)", "One-command stack startup; TLS tunnel for campus network.", "Bare-metal install"),
            ("Libraries & Frameworks", "PlatformIO, ESP32 SDK", "Reproducible firmware builds and pinned toolchains.", "Arduino IDE"),
        ],
        "architecture": {
            "layers": [
                {"name": "Edge Devices", "components": ["Sensor Nodes", "Firmware (C/C++)", "OTA Updates"]},
                {"name": "Transport", "components": ["MQTT Broker", "TLS Tunnel", "QoS Policies"]},
                {"name": "Services", "components": ["Node.js Bridge", "REST API", "Alerting Rules"]},
                {"name": "Data & Viz", "components": ["TimescaleDB", "Grafana Dashboards"]},
            ],
            "dataFlow": [
                "Nodes sample sensors and publish to MQTT topics with QoS 1.",
                "The bridge subscribes, validates payloads and writes to TimescaleDB.",
                "Alert rules evaluate windows and fire notifications to the dashboard.",
            ],
        },
        "features": [
            "Multi-node sensing with configurable sample rates",
            "Live Grafana dashboards",
            "Threshold alerts over email/Telegram",
            "OTA firmware updates",
            "Battery & signal health monitoring",
            "CSV export of readings",
        ],
        "risks": [
            _g("Hardware failure or delivery delays", "Hardware", "High", "Medium", "Order spares in week 1; build a firmware emulator that publishes synthetic MQTT data."),
            _g("Unreliable campus network for MQTT", "Network", "Medium", "High", "Buffer readings on-device and publish in batches with timestamps."),
            _g("Power budget exceeded on battery nodes", "Hardware", "Medium", "Medium", "Use deep-sleep cycles; measure and report real consumption."),
        ],
    },
    "Cloud & DevOps": {
        "stack": [
            ("Frontend", "Grafana + k9s", "Observability UI and cluster inspection without building custom dashboards.", "Kubernetes Dashboard"),
            ("Backend", "Go / Python microservice", "Small, typed service under test is the deployment subject.", "Node.js"),
            ("AI / ML", "Prometheus + Alertmanager", "Industry-standard metrics and alert routing for SLOs.", "Datadog free tier"),
            ("Database", "PostgreSQL (Helm-managed)", "Stateful workload deployed through the same GitOps path.", "MySQL"),
            ("Deployment", "Terraform + ArgoCD on k3s", "Infrastructure-as-code with GitOps delivery demonstrates modern practice.", "Pulumi + Flux"),
            ("Libraries & Frameworks", "GitHub Actions, Helm", "Free CI minutes and chart-based releases.", "GitLab CI"),
        ],
        "architecture": {
            "layers": [
                {"name": "Source & CI", "components": ["Monorepo", "GitHub Actions", "Artifact Registry"]},
                {"name": "Delivery", "components": ["ArgoCD", "Helm Charts", "Env Promotion"]},
                {"name": "Runtime", "components": ["k3s Cluster", "Ingress", "Autoscaling"]},
                {"name": "Observability", "components": ["Prometheus", "Grafana", "Alertmanager"]},
            ],
            "dataFlow": [
                "Pull requests trigger lint → test → build → publish pipelines.",
                "ArgoCD reconciles cluster state with the Git manifest repository.",
                "Prometheus scrapes targets; Grafana visualises SLOs; Alertmanager routes pages.",
            ],
        },
        "features": [
            "Fully codified infrastructure (Terraform)",
            "CI pipeline with tests, SAST and image builds",
            "GitOps deploys with rollback in one commit",
            "SLO dashboards and error budgets",
            "Blue/green or canary release strategy",
            "Cost & resource utilisation reports",
        ],
        "risks": [
            _g("Cloud cost overruns on free tiers", "Cost", "Medium", "Medium", "Set billing alarms in week 1; tear down environments nightly via schedule."),
            _g("Kubernetes complexity swallowing the timeline", "Complexity", "High", "Medium", "Scope to one service, two environments; document trade-offs honestly."),
            _g("Flaky pipelines from shared runners", "CI", "Low", "Medium", "Cache dependencies and pin runner versions; keep a manual deploy script."),
        ],
    },
    "Cybersecurity": {
        "stack": [
            ("Frontend", "React findings dashboard", "Risk-scored findings with remediation tracking for the report demo.", "Static HTML report"),
            ("Backend", "Python (scapy, pwntools)", "De-facto scripting standard for security tooling and PoCs.", "Go"),
            ("AI / ML", "YARA + heuristic rules", "Detection rules with measurable true/false positive rates.", "ML classifier (stretch)"),
            ("Database", "PostgreSQL", "Stores findings, evidence hashes and remediation status.", "SQLite"),
            ("Deployment", "Dockerised lab (DVWA, Juice Shop)", "Safe, legal targets that demonstrate attacks and defences reproducibly.", "Custom VM lab"),
            ("Libraries & Frameworks", "Nmap, Burp CE, Wazuh", "Industry-standard reconnaissance, web testing and SIEM.", "ZAP + ELK"),
        ],
        "architecture": {
            "layers": [
                {"name": "Testbed", "components": ["Vulnerable Apps", "Segmented Lab Net", "Traffic Mirroring"]},
                {"name": "Tooling", "components": ["Scanner Orchestrator", "Exploit PoCs", "YARA Rules"]},
                {"name": "Analysis", "components": ["Wazuh SIEM", "Evidence Store", "Report Generator"]},
            ],
            "dataFlow": [
                "Controlled attacks run inside the isolated lab network only.",
                "Telemetry is forwarded to the SIEM where detection rules fire.",
                "Findings are correlated, evidenced and exported as a remediation report.",
            ],
        },
        "features": [
            "Reproducible attack playbook library",
            "SIEM detection rules with true/false positive metrics",
            "Automated evidence capture & hashing",
            "Risk-scored findings dashboard",
            "Remediation tracking with retest workflow",
            "Exportable pentest-style report",
        ],
        "risks": [
            _g("Ethics/scope approval delays", "Compliance", "High", "Medium", "Submit the scope form in week 1; restrict all tests to the isolated lab."),
            _g("Lab environment instability", "Infra", "Medium", "Medium", "Snapshot VMs before each experiment; script environment rebuilds."),
            _g("Tool false positives skewing results", "Accuracy", "Medium", "Medium", "Manually verify a sample and report precision/recall honestly."),
        ],
    },
    "Blockchain": {
        "stack": [
            ("Frontend", "React dApp + ethers.js", "Standard client library; typed contract bindings.", "wagmi + viem"),
            ("Backend", "Solidity + Hardhat", "Mature toolchain with deterministic local testing via an in-process chain.", "Foundry"),
            ("AI / ML", "The Graph (hosted)", "Indexing events into queryable entities avoids brittle on-chain reads.", "Direct event polling"),
            ("Database", "IPFS + Pinata", "Off-chain document storage with content-addressed hashes on-chain.", "Arweave"),
            ("Deployment", "Ethereum L2 testnet (Sepolia/Base)", "Real deployment target with zero gas cost for the demo.", "Local Hardhat chain only"),
            ("Libraries & Frameworks", "OpenZeppelin, Slither", "Audited contract primitives and static analysis for the security section.", "solady"),
        ],
        "architecture": {
            "layers": [
                {"name": "Client", "components": ["React dApp", "Wallet Connect", "Event Explorer"]},
                {"name": "Smart Contracts", "components": ["Core Contract", "Access Control", "Events"]},
                {"name": "Indexing & Storage", "components": ["The Graph", "IPFS", "Subgraph"]},
            ],
            "dataFlow": [
                "Users sign transactions from the dApp; contracts emit events.",
                "The subgraph indexes events into queryable entities.",
                "Documents are pinned to IPFS with hashes anchored on-chain.",
            ],
        },
        "features": [
            "On-chain record anchoring with hash verification",
            "Role-based contract access control",
            "Event explorer with filters",
            "Gas-usage analytics per operation",
            "IPFS document pinning",
            "Testnet deployment with verified source",
        ],
        "risks": [
            _g("Testnet faucet unreliability before demo", "Infra", "Medium", "High", "Collect testnet funds early; keep a local-chain demo mode as backup."),
            _g("Smart-contract bugs discovered late", "Security", "High", "Medium", "Write tests before features; run Slither weekly; freeze contracts two weeks out."),
            _g("Blockchain UX confusing evaluators", "Usability", "Medium", "Medium", "Add a 'demo wallet' one-click mode and narrate the flow in the demo video."),
        ],
    },
}


def preset_for(domain: str) -> dict[str, Any]:
    return _PRESETS.get(domain, _PRESETS["Web Development"])


# ---------------------------------------------------------------- evaluation

def offline_evaluation(inp: dict[str, Any]) -> dict[str, Any]:
    preset = preset_for(inp.get("domain", ""))
    title, idea, ps = inp.get("title", ""), inp.get("idea", ""), inp.get("problemStatement", "")
    weeks = int(inp.get("durationWeeks", 12))
    team = int(inp.get("teamSize", 1))
    level = str(inp.get("level", ""))

    feasibility = int(clamp(round(76 + hash01(title + inp.get("domain", "")) * 16 + (4 if team >= 3 else 0) - (6 if weeks < 8 else 0)), 55, 97))
    innovation = int(clamp(round(56 + hash01(idea) * 32), 45, 95))
    academic = int(clamp(round(79 + hash01(ps) * 16), 68, 97))

    diff = 2 if (level.startswith("Post") or level.startswith("Doc")) else 1
    if inp.get("domain") in ("AI / Machine Learning", "IoT & Embedded", "Blockchain"):
        diff += 1
    if team < 2:
        diff += 1
    if weeks >= 14:
        diff -= 1
    difficulty = "High" if diff >= 4 else ("Low" if diff <= 1 else "Moderate")

    if feasibility >= 85 and academic >= 85:
        verdict = "Strong Go"
    elif feasibility >= 72:
        verdict = "Go"
    elif feasibility >= 58:
        verdict = "Go with caution"
    else:
        verdict = "Revise"

    lock_week = max(2, round(weeks * 0.18))
    rec = (
        f"The idea scores {feasibility}/100 on feasibility for a {team}-person team over {weeks} weeks. "
        f"Proceed as planned, but lock the scope by the end of week {lock_week} and keep the evaluation harness "
        "(however simple) from day one — it is what turns a build into an academic contribution. "
    )
    rec += (
        "Differentiation is modest; add one measurable comparison against a baseline to strengthen the report."
        if innovation < 65
        else "The innovation angle is solid; foreground it in the abstract and introduction."
    )

    return {
        "scores": {"feasibility": feasibility, "innovation": innovation, "academicSuitability": academic},
        "difficulty": difficulty,
        "estimatedDuration": f"{max(4, weeks - 1)}–{weeks + 1} weeks",
        "verdict": verdict,
        "recommendation": rec,
        "strengths": [
            f"Clear alignment with the {inp.get('domain')} curriculum and available tooling.",
            "Workload fits the team size and semester calendar comfortably."
            if feasibility >= 82
            else "Core flow is achievable even if stretch features slip.",
            "Strong potential for measurable evaluation (accuracy, latency, or user study)."
            if academic >= 88
            else "Evaluation plan is feasible with campus-scale data.",
        ],
        "concerns": [
            preset["risks"][0]["risk"] if preset["risks"] else "Key external dependencies should be verified early.",
            "Ambition is high for the available weeks — define an MVP cut-line now."
            if difficulty == "High"
            else "Several features depend on each other; sequence them to avoid integration crunch.",
            "Single-member team: automate testing early to protect the schedule."
            if team == 1
            else "Coordinate module ownership in week 1 to avoid duplicated work.",
        ],
    }


# ---------------------------------------------------------------- scope

def offline_scope(inp: dict[str, Any]) -> dict[str, Any]:
    preset = preset_for(inp.get("domain", ""))
    features = preset["features"][:6]
    return {
        "objectives": [
            f"Design and implement {inp.get('title')} addressing: {str(inp.get('problemStatement', '')).strip().rstrip('.')}.",
            f"Validate the approach with a structured evaluation ({features[4] if len(features) > 4 else 'a measurable baseline comparison'}).",
            "Produce complete academic documentation: synopsis, report, diagrams and presentation.",
            "Demonstrate a working prototype to evaluators with reproducible setup instructions.",
        ],
        "deliverables": [
            "Working prototype (demo-ready, with seed data)",
            "Source code repository with README & contribution log",
            "Project report (IEEE/institutional format)",
            "Architecture, UML and flowchart diagrams",
            "Final presentation + 3-minute demo video",
            "Evaluation results with baseline comparison",
        ],
        "features": features,
        "functional": [f"The system shall support: {f.lower()}." for f in features],
        "nonFunctional": [
            "Key user flows must respond within 2 seconds on reference hardware.",
            "The system shall be usable at 360px viewport width and pass basic WCAG contrast checks.",
            "All persisted data shall survive a service restart; backups shall be scriptable.",
            "The prototype shall handle at least 50 concurrent demo sessions without degradation.",
            "Deployment shall be reproducible from the README in under 15 minutes.",
        ],
        "outOfScope": [
            "Production-grade multi-tenancy and billing",
            "Native mobile applications (responsive web only, unless mobile domain)",
            "Long-term operational monitoring after submission",
        ],
    }


# ---------------------------------------------------------------- technology

def offline_technology(inp: dict[str, Any]) -> dict[str, Any]:
    preset = preset_for(inp.get("domain", ""))
    return {
        "technology": [{"layer": l, "pick": p, "rationale": r, "alternative": a} for (l, p, r, a) in preset["stack"]],
        "architecture": preset["architecture"],
    }


# ---------------------------------------------------------------- timeline

def offline_timeline(inp: dict[str, Any]) -> dict[str, Any]:
    preset = preset_for(inp.get("domain", ""))
    weeks_total = int(inp.get("durationWeeks", 12))
    planning_end = max(1, round(weeks_total * 0.18))
    dev_end = max(planning_end + 1, round(weeks_total * 0.62))
    integ_end = max(dev_end + 1, round(weeks_total * 0.82))
    docs_end = weeks_total - 1
    feat = preset["features"]

    planning_milestones = ["Literature survey & references", "Requirement analysis", "System design & data modelling", "Tech stack spike / proof of concept"]
    integ_milestones = ["Module integration", "Testing & bug-fix cycle", "Performance & security pass", "User acceptance with sample users"]
    docs_milestones = ["Draft final report", "Prepare presentation & demo", "Final report revision"]

    timeline: list[dict[str, Any]] = []
    for w in range(1, weeks_total + 1):
        if w <= planning_end:
            phase = "Planning & Design"
            milestone = planning_milestones[min(w - 1, len(planning_milestones) - 1)]
            if w == 1:
                tasks = ["Survey 8–10 related works", "Define success criteria", "Set up repository & CI"]
            elif w == planning_end:
                tasks = ["Draft architecture diagram", "Define database schema / data contracts", "Review plan with mentor"]
            else:
                tasks = ["Elicit functional requirements", "Prioritise feature backlog (MoSCoW)", "Wireframe key screens"]
        elif w <= dev_end:
            phase = "Core Development"
            fi = (w - planning_end - 1) % max(len(feat), 1)
            milestone = f"Build: {feat[fi]}"
            if w == planning_end + 1:
                tasks = ["Scaffold project & dev environment", "Implement core data model", "Write first integration test"]
            else:
                tasks = [f"Implement: {feat[fi]}", "Unit-test the new module", "Weekly demo to the team"]
        elif w <= integ_end:
            phase = "Integration & Testing"
            milestone = integ_milestones[min(w - dev_end - 1, len(integ_milestones) - 1)]
            if w == integ_end:
                tasks = ["Fix accepted UAT issues", "Record demo video", "Freeze feature set"]
            else:
                tasks = ["Integrate remaining modules end-to-end", "Run regression test suite", "Log and triage defects"]
        elif w <= docs_end:
            phase = "Documentation"
            milestone = docs_milestones[min(w - integ_end - 1, len(docs_milestones) - 1)]
            tasks = ["Write report chapter", "Refresh architecture diagrams", "Compile results & screenshots"]
        else:
            phase = "Submission & Demo"
            milestone = "Final submission & viva"
            tasks = ["Submit report & source code", "Deliver final presentation", "Archive repository with README"]
        timeline.append({"week": w, "phase": phase, "milestone": milestone, "tasks": tasks})
    return {"timeline": timeline}


# ---------------------------------------------------------------- risks

def offline_risks(inp: dict[str, Any]) -> dict[str, Any]:
    preset = preset_for(inp.get("domain", ""))
    risks = [dict(r, id=new_id()) for r in preset["risks"]]
    risks.append(
        dict(
            _g(
                "Exam season compresses available dev weeks",
                "Schedule",
                "Medium",
                "High",
                "Front-load development: target feature-freeze one week before exams and protect two weekend sprints.",
            ),
            id=new_id(),
        )
    )
    return {"risks": risks[:6]}
