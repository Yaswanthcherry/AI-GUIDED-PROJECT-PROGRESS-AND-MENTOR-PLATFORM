/**
 * SIMULATED AGENT LAYER (mock mode only).
 * ------------------------------------------------------------------
 * When the FastAPI backend is connected, every function in this file is
 * replaced by a real agent endpoint:
 *
 *   composeBlueprint()     -> POST /api/projects/:id/blueprint/generate
 *   mentorReply()          -> POST /api/projects/:id/mentor/messages
 *   composeDoc()           -> POST /api/projects/:id/docs  { type }
 *   composeInsights()      -> GET  /api/faculty/insights/:projectId
 *
 * Nothing here is a hard-coded canned answer: every output is composed
 * from the actual project input/data, so the UI behaves like the real
 * agentic pipeline (different input -> different blueprint).
 */
import type {
  Blueprint,
  ChatMessage,
  DocArtifact,
  DocType,
  IdeaEvaluation,
  Milestone,
  Project,
  ProjectInput,
  RiskItem,
  RiskLevel,
  ScopeDefinition,
  Severity,
  Task,
  TechPick,
  WeekPlan,
} from "../types";
import { clamp, daysAgoIso, hash01, hoursAgoIso, uid } from "../utils";

/* ------------------------------------------------------------------ */
/* Domain knowledge base used by the agents                            */
/* ------------------------------------------------------------------ */

interface DomainPreset {
  stack: Omit<TechPick, "layer">[];
  layers: { layers: { name: string; components: string[] }[]; dataFlow: string[] };
  features: string[];
  risks: Omit<RiskItem, "id">[];
}

const g = (risk: string, category: string, severity: Severity, probability: Severity, mitigation: string) => ({
  risk,
  category,
  severity,
  probability,
  mitigation,
});

export const DOMAINS: string[] = [
  "AI / Machine Learning",
  "Web Development",
  "Mobile Development",
  "Data Science & Analytics",
  "IoT & Embedded",
  "Cloud & DevOps",
  "Cybersecurity",
  "Blockchain",
];

export const LEVELS: string[] = [
  "Undergraduate — Second Year",
  "Undergraduate — Final Year",
  "Postgraduate",
  "Doctoral",
];

const PRESETS: Record<string, DomainPreset> = {
  "AI / Machine Learning": {
    stack: [
      { pick: "React + TypeScript", rationale: "Component model scales well for chat/visualization UIs; strong typing reduces integration bugs during the ML hand-off.", alternative: "Streamlit (faster prototyping)" },
      { pick: "FastAPI (Python)", rationale: "Native async support for model inference and tight fit with the Python ML ecosystem.", alternative: "Flask" },
      { pick: "sentence-transformers + FAISS (RAG)", rationale: "Local embeddings keep costs zero and data on-campus; FAISS gives sub-second retrieval over the knowledge base.", alternative: "LangChain + hosted LLM API" },
      { pick: "PostgreSQL + pgvector", rationale: "Single engine for app data and vector search — one less service to operate for a student team.", alternative: "MongoDB Atlas Vector Search" },
      { pick: "Docker + Render / campus VM", rationale: "Containerised deploy makes the demo reproducible for evaluators.", alternative: "AWS EC2 free tier" },
      { pick: "Pydantic, React Query, Tailwind CSS", rationale: "Typed contracts between model output and UI; cache management for inference calls.", alternative: "SWR" },
    ],
    layers: {
      layers: [
        { name: "Client", components: ["React Web App", "Chat Widget", "Admin Console"] },
        { name: "API Gateway", components: ["FastAPI REST", "Auth & Rate Limiting", "WebSocket Stream"] },
        { name: "Intelligence Services", components: ["RAG Pipeline", "Embedding Service", "Prompt Manager", "Evaluation Harness"] },
        { name: "Data Layer", components: ["PostgreSQL", "Vector Store (FAISS)", "Knowledge Base"] },
      ],
      dataFlow: [
        "User query is normalised and sent to the API gateway over REST/WebSocket.",
        "The Embedding Service converts the query into a vector and hits the Vector Store.",
        "Top-k chunks are reranked and packed into a prompt by the Prompt Manager.",
        "The generated answer is streamed back to the client and logged for evaluation.",
      ],
    },
    features: [
      "Multi-turn conversational interface with session memory",
      "Retrieval-augmented answers grounded in the knowledge base",
      "Confidence scoring with human-handoff fallback",
      "Admin panel to curate the knowledge base",
      "Analytics on question categories and deflection rate",
      "Exportable Q&A evaluation report (BLEU + human rating)",
      "Rate limiting and basic abuse detection",
      "Dark-mode responsive UI",
    ],
    risks: [
      g("Dataset availability — real support transcripts may be restricted", "Data", "High", "Medium", "Fall back to a public dataset (e.g., Ubuntu Dialogue Corpus) plus 100+ seeded campus FAQs; document the substitution in the report."),
      g("Hallucinated or unverifiable answers", "Model", "High", "Medium", "Constrain generation with retrieval-only grounding, add a confidence threshold and a 'not sure' path."),
      g("Inference latency on low-spec machines", "Performance", "Medium", "Medium", "Batch embeddings, cache frequent queries, quantise the model; set a 2s response budget."),
      g("Team skill gap in vector search tuning", "Team", "Low", "Medium", "Time-box retrieval experiments in week 4–5 and keep a simple keyword fallback."),
    ],
  },
  "Web Development": {
    stack: [
      { pick: "React + TypeScript + Vite", rationale: "Fast dev loop, huge ecosystem, and evaluators can run it locally with one command.", alternative: "Next.js" },
      { pick: "Node.js + Express", rationale: "Same language across the stack shrinks the learning curve for a small team.", alternative: "NestJS" },
      { pick: "Chart.js / Recharts", rationale: "Declarative charts cover dashboard needs without a BI tool.", alternative: "D3 (steeper curve)" },
      { pick: "PostgreSQL + Prisma", rationale: "Relational integrity for core records; Prisma's typed queries prevent most schema bugs.", alternative: "MySQL" },
      { pick: "Vercel + Render (free tiers)", rationale: "Zero-ops hosting keeps the team focused on features; preview URLs help faculty review.", alternative: "Netlify + Railway" },
      { pick: "Tailwind CSS, React Query, Zod", rationale: "Rapid consistent UI, server-state caching, and runtime validation of API payloads.", alternative: "React Hook Form + Yup" },
    ],
    layers: {
      layers: [
        { name: "Client", components: ["React SPA", "Responsive Layouts", "Role-based Views"] },
        { name: "API Layer", components: ["Express REST API", "JWT Auth", "Validation Middleware"] },
        { name: "Services", components: ["Business Rules", "Reporting Engine", "Notification Service"] },
        { name: "Data Layer", components: ["PostgreSQL", "Prisma ORM", "Object Storage"] },
      ],
      dataFlow: [
        "The SPA issues typed REST calls with a JWT bearer token.",
        "Validation middleware rejects malformed payloads before business logic runs.",
        "Services apply domain rules and persist through the Prisma ORM.",
        "Reporting endpoints aggregate reads; the SPA caches them with React Query.",
      ],
    },
    features: [
      "Role-based dashboards with protected routes",
      "CRUD modules with inline validation",
      "Search, filtering and CSV export",
      "Realtime notifications via WebSockets",
      "Audit trail of record changes",
      "Responsive layouts down to 360px",
      "Dark mode",
      "Seed data generator for demos",
    ],
    risks: [
      g("Scope creep from stakeholder feature requests", "Scope", "Medium", "High", "Freeze the feature list after week 3; park new requests in a 'v2' backlog shown in the report."),
      g("API contract drift between frontend and backend", "Integration", "Medium", "Medium", "Define Zod schemas first and share them across both sides of the repo."),
      g("Third-party service limits on free tiers", "Infra", "Low", "Medium", "Cache aggressively and keep a local fallback dataset for demos."),
      g("Uneven contribution across team members", "Team", "Medium", "Medium", "Assign module ownership in week 1 and review PRs in pairs weekly."),
    ],
  },
  "Mobile Development": {
    stack: [
      { pick: "Flutter", rationale: "One codebase for Android + iOS demo builds; hot reload speeds up a short timeline.", alternative: "React Native" },
      { pick: "Firebase (Auth, Firestore, FCM)", rationale: "Managed backend removes server ops for a small team; offline sync is built in.", alternative: "Supabase" },
      { pick: "Riverpod / BLoC", rationale: "Predictable state for offline-first flows.", alternative: "Provider" },
      { pick: "Cloud Firestore", rationale: "Schema-less docs map well to campus use-cases and sync offline.", alternative: "SQLite + custom sync" },
      { pick: "Firebase App Distribution", rationale: "Evaluators install the APK/TestFlight build without store review.", alternative: "Play Internal Testing" },
      { pick: "google_maps_flutter, camera, image_picker", rationale: "Cover location and capture needs with first-party plugins.", alternative: "Platform channels" },
    ],
    layers: {
      layers: [
        { name: "Client", components: ["Flutter App", "Offline Cache", "Push Handlers"] },
        { name: "Backend-as-a-Service", components: ["Firebase Auth", "Cloud Functions", "FCM"] },
        { name: "Data Layer", components: ["Firestore", "Cloud Storage"] },
      ],
      dataFlow: [
        "The app writes to Firestore with optimistic UI; sync resolves when online.",
        "Cloud Functions enforce rules and trigger push notifications via FCM.",
        "Media uploads go to Cloud Storage with signed URLs stored in the document.",
      ],
    },
    features: [
      "Offline-first data entry with background sync",
      "Push notifications for reminders",
      "Camera capture with on-device compression",
      "Map view of geo-tagged records",
      "Profile & settings with biometric lock",
      "Accessible contrast & font scaling",
    ],
    risks: [
      g("Device fragmentation during evaluation", "Platform", "Medium", "Medium", "Test on 3 reference devices and record a demo video as a fallback."),
      g("Store/distribution delays for evaluator installs", "Release", "Medium", "Medium", "Use Firebase App Distribution links; ship a web-preview build."),
      g("Offline-sync edge cases (conflicting edits)", "Data", "High", "Medium", "Apply last-write-wins with a visible conflict banner in v1."),
    ],
  },
  "Data Science & Analytics": {
    stack: [
      { pick: "Python (pandas, scikit-learn)", rationale: "The lingua franca for EDA and modelling; everything runs in notebooks for the report.", alternative: "R" },
      { pick: "Streamlit / Dash", rationale: "Turns analysis scripts into an interactive dashboard reviewers can click.", alternative: "Flask + Plotly" },
      { pick: "Plotly + seaborn", rationale: "Interactive + publication-quality static charts for the report.", alternative: "Matplotlib" },
      { pick: "PostgreSQL or DuckDB", rationale: "DuckDB gives in-process analytics speed on CSV/Parquet without a server.", alternative: "SQLite" },
      { pick: "GitHub Pages / Streamlit Cloud", rationale: "Free hosted demo the faculty can open from the report link.", alternative: "Render" },
      { pick: "Jupyter, Great Expectations, dbt-lite scripts", rationale: "Reproducible pipeline: extract → clean → validate → model → visualise.", alternative: "Airflow (overkill)" },
    ],
    layers: {
      layers: [
        { name: "Presentation", components: ["Streamlit Dashboard", "Exportable Reports"] },
        { name: "Analytics Services", components: ["ETL Pipeline", "Validation Layer", "Model Store"] },
        { name: "Data Layer", components: ["DuckDB / PostgreSQL", "Parquet Lake", "Source CSV APIs"] },
      ],
      dataFlow: [
        "Source records are extracted on a schedule into the parquet lake.",
        "Validation rules quarantine bad rows and surface a data-quality score.",
        "Models are trained offline and loaded as pickles by the dashboard.",
        "Streamlit renders interactive slices and exports static charts.",
      ],
    },
    features: [
      "Automated ETL from campus data exports",
      "Data-quality scorecard per ingestion",
      "Interactive dashboards with drill-downs",
      "Anomaly detection on key metrics",
      "Forecasting with confidence intervals",
      "One-click PDF report export",
    ],
    risks: [
      g("Access to real institutional data may be delayed or denied", "Data", "High", "High", "Request access in week 1; prepare a realistic synthetic dataset generator as fallback and disclose it."),
      g("Messy, inconsistent source records", "Data", "Medium", "High", "Budget a full cleaning week; enforce validation rules and document every imputation."),
      g("Model accuracy below target on small data", "Model", "Medium", "Medium", "Report honest baselines; prefer interpretable models over chasing accuracy."),
    ],
  },
  "IoT & Embedded": {
    stack: [
      { pick: "ESP32 / Raspberry Pi nodes", rationale: "Low-cost, Wi-Fi capable, and well documented for campus deployments.", alternative: "Arduino + ESP8266" },
      { pick: "MQTT (Mosquitto)", rationale: "Lightweight pub/sub designed for constrained devices and lossy networks.", alternative: "HTTP polling" },
      { pick: "Node.js bridge service", rationale: "Bridges MQTT topics to a REST API and persists readings.", alternative: "Python + paho-mqtt" },
      { pick: "TimescaleDB", rationale: "Time-series storage with retention policies fits sensor data naturally.", alternative: "InfluxDB" },
      { pick: "Grafana", rationale: "Instant professional dashboards over TimescaleDB for the demo.", alternative: "Custom React charts" },
      { pick: "PlatformIO, Docker", rationale: "Reproducible firmware builds and one-command stack startup.", alternative: "Arduino IDE" },
    ],
    layers: {
      layers: [
        { name: "Edge Devices", components: ["Sensor Nodes", "Firmware (C/C++)", "OTA Updates"] },
        { name: "Transport", components: ["MQTT Broker", "TLS Tunnel", "QoS Policies"] },
        { name: "Services", components: ["Node.js Bridge", "REST API", "Alerting Rules"] },
        { name: "Data & Viz", components: ["TimescaleDB", "Grafana Dashboards"] },
      ],
      dataFlow: [
        "Nodes sample sensors and publish to MQTT topics with QoS 1.",
        "The bridge subscribes, validates payloads and writes to TimescaleDB.",
        "Alert rules evaluate windows and fire notifications to the dashboard.",
      ],
    },
    features: [
      "Multi-node sensing with configurable sample rates",
      "Live Grafana dashboards",
      "Threshold alerts over email/Telegram",
      "OTA firmware updates",
      "Battery & signal health monitoring",
      "CSV export of readings",
    ],
    risks: [
      g("Hardware failure or delivery delays", "Hardware", "High", "Medium", "Order spares in week 1; build a firmware emulator that publishes synthetic MQTT data."),
      g("Unreliable campus network for MQTT", "Network", "Medium", "High", "Buffer readings on-device and publish in batches with timestamps."),
      g("Power budget exceeded on battery nodes", "Hardware", "Medium", "Medium", "Use deep-sleep cycles; measure and report real consumption."),
    ],
  },
  "Cloud & DevOps": {
    stack: [
      { pick: "Terraform", rationale: "Infrastructure-as-code gives reviewers a diffable, reproducible environment.", alternative: "Pulumi" },
      { pick: "GitHub Actions", rationale: "Free CI minutes and native repo integration for the demo pipeline.", alternative: "GitLab CI" },
      { pick: "Kubernetes (k3s) or ECS", rationale: "k3s runs locally for demos yet mirrors production concepts.", alternative: "Docker Compose" },
      { pick: "Prometheus + Grafana", rationale: "Industry-standard observability stack with rich dashboards.", alternative: "Datadog free tier" },
      { pick: "AWS free tier / campus OpenStack", rationale: "Avoids cost overruns while staying realistic.", alternative: "GCP free tier" },
      { pick: "ArgoCD, Helm", rationale: "GitOps delivery demonstrates modern deployment practice.", alternative: "Flux" },
    ],
    layers: {
      layers: [
        { name: "Source & CI", components: ["Monorepo", "GitHub Actions", "Artifact Registry"] },
        { name: "Delivery", components: ["ArgoCD", "Helm Charts", "Env Promotion"] },
        { name: "Runtime", components: ["k3s Cluster", "Ingress", "Autoscaling"] },
        { name: "Observability", components: ["Prometheus", "Grafana", "Alertmanager"] },
      ],
      dataFlow: [
        "Pull requests trigger lint → test → build → publish pipelines.",
        "ArgoCD reconciles cluster state with the Git manifest repository.",
        "Prometheus scrapes targets; Grafana visualises SLOs; Alertmanager routes pages.",
      ],
    },
    features: [
      "Fully codified infrastructure (Terraform)",
      "CI pipeline with tests, SAST and image builds",
      "GitOps deploys with rollback in one commit",
      "SLO dashboards and error budgets",
      "Blue/green or canary release strategy",
      "Cost & resource utilisation reports",
    ],
    risks: [
      g("Cloud cost overruns on free tiers", "Cost", "Medium", "Medium", "Set billing alarms in week 1; tear down environments nightly via schedule."),
      g("Kubernetes complexity swallowing the timeline", "Complexity", "High", "Medium", "Scope to one service, two environments; document trade-offs honestly."),
      g("Flaky pipelines from shared runners", "CI", "Low", "Medium", "Cache dependencies and pin runner versions; keep a manual deploy script."),
    ],
  },
  Cybersecurity: {
    stack: [
      { pick: "Python (scapy, pwntools)", rationale: "De-facto scripting standard for security tooling and PoCs.", alternative: "Go" },
      { pick: "ELK or Wazuh", rationale: "Real SIEM experience; free tiers handle lab-scale data.", alternative: "Splunk Free" },
      { pick: "Dockerised vulnerable lab (DVWA, Juice Shop)", rationale: "Safe, legal targets that demonstrate attacks and defences reproducibly.", alternative: "Custom VM lab" },
      { pick: "PostgreSQL", rationale: "Stores findings, evidence hashes and remediation status.", alternative: "SQLite" },
      { pick: "Local lab network + GNS3", rationale: "Isolated testbed keeps experiments ethical and repeatable.", alternative: "Cloud sandbox" },
      { pick: "Nmap, Burp CE, YARA", rationale: "Industry-standard reconnaissance, web testing and detection rules.", alternative: "ZAP" },
    ],
    layers: {
      layers: [
        { name: "Testbed", components: ["Vulnerable Apps", "Segmented Lab Net", "Traffic Mirroring"] },
        { name: "Tooling", components: ["Scanner Orchestrator", "Exploit PoCs", "YARA Rules"] },
        { name: "Analysis", components: ["Wazuh SIEM", "Evidence Store", "Report Generator"] },
      ],
      dataFlow: [
        "Controlled attacks run inside the isolated lab network only.",
        "Telemetry is forwarded to the SIEM where detection rules fire.",
        "Findings are correlated, evidenced and exported as a remediation report.",
      ],
    },
    features: [
      "Reproducible attack playbook library",
      "SIEM detection rules with true/false positive metrics",
      "Automated evidence capture & hashing",
      "Risk-scored findings dashboard",
      "Remediation tracking with retest workflow",
      "Exportable pentest-style report",
    ],
    risks: [
      g("Ethics/scope approval delays", "Compliance", "High", "Medium", "Submit the scope form in week 1; restrict all tests to the isolated lab."),
      g("Lab environment instability", "Infra", "Medium", "Medium", "Snapshot VMs before each experiment; script environment rebuilds."),
      g("Tool false positives skewing results", "Accuracy", "Medium", "Medium", "Manually verify a sample and report precision/recall honestly."),
    ],
  },
  Blockchain: {
    stack: [
      { pick: "Solidity + Hardhat", rationale: "Mature toolchain with deterministic local testing via an in-process chain.", alternative: "Foundry" },
      { pick: "Ethereum L2 testnet (Sepolia/Base)", rationale: "Real deployment target with zero gas cost for the demo.", alternative: "Local Hardhat chain only" },
      { pick: "ethers.js + React", rationale: "Standard client library; typed contract bindings.", alternative: "wagmi + viem" },
      { pick: "The Graph (hosted)", rationale: "Indexing events into queryable entities avoids brittle on-chain reads.", alternative: "Direct event polling" },
      { pick: "IPFS + Pinata", rationale: "Off-chain document storage with content-addressed hashes on-chain.", alternative: "Arweave" },
      { pick: "OpenZeppelin, Slither", rationale: "Audited contract primitives and static analysis for the security section.", alternative: "solady" },
    ],
    layers: {
      layers: [
        { name: "Client", components: ["React dApp", "Wallet Connect", "Event Explorer"] },
        { name: "Smart Contracts", components: ["Core Contract", "Access Control", "Events"] },
        { name: "Indexing & Storage", components: ["The Graph", "IPFS", "Subgraph"] },
      ],
      dataFlow: [
        "Users sign transactions from the dApp; contracts emit events.",
        "The subgraph indexes events into queryable entities.",
        "Documents are pinned to IPFS with hashes anchored on-chain.",
      ],
    },
    features: [
      "On-chain record anchoring with hash verification",
      "Role-based contract access control",
      "Event explorer with filters",
      "Gas-usage analytics per operation",
      "IPFS document pinning",
      "Testnet deployment with verified source",
    ],
    risks: [
      g("Testnet faucet unreliability before demo", "Infra", "Medium", "High", "Collect testnet funds early; keep a local-chain demo mode as backup."),
      g("Smart-contract bugs discovered late", "Security", "High", "Medium", "Write tests before features; run Slither weekly; freeze contracts two weeks out."),
      g("Blockchain UX confusing evaluators", "Usability", "Medium", "Medium", "Add a 'demo wallet' one-click mode and narrate the flow in the demo video."),
    ],
  },
};

const presetFor = (domain: string): DomainPreset => PRESETS[domain] ?? PRESETS["Web Development"];

/* ------------------------------------------------------------------ */
/* Blueprint composition                                               */
/* ------------------------------------------------------------------ */

const round0 = (n: number) => Math.round(n);

function buildTimeline(input: ProjectInput, preset: DomainPreset): WeekPlan[] {
  const W = input.durationWeeks;
  const planningEnd = Math.max(1, Math.round(W * 0.18));
  const devEnd = Math.max(planningEnd + 1, Math.round(W * 0.62));
  const integEnd = Math.max(devEnd + 1, Math.round(W * 0.82));
  const docsEnd = W - 1;

  const planningMilestones = ["Literature survey & references", "Requirement analysis", "System design & data modelling", "Tech stack spike / proof of concept"];
  const integMilestones = ["Module integration", "Testing & bug-fix cycle", "Performance & security pass", "User acceptance with sample users"];
  const docsMilestones = ["Draft final report", "Prepare presentation & demo", "Final report revision"];
  const feat = preset.features;

  const weeks: WeekPlan[] = [];
  for (let w = 1; w <= W; w++) {
    let phase: string;
    let milestone: string;
    let tasks: string[];
    if (w <= planningEnd) {
      phase = "Planning & Design";
      milestone = planningMilestones[Math.min(w - 1, planningMilestones.length - 1)];
      tasks =
        w === 1
          ? ["Survey 8–10 related works", "Define success criteria", "Set up repository & CI"]
          : w === planningEnd
            ? ["Draft architecture diagram", "Define database schema / data contracts", "Review plan with mentor"]
            : ["Elicit functional requirements", "Prioritise feature backlog (MoSCoW)", "Wireframe key screens"];
    } else if (w <= devEnd) {
      phase = "Core Development";
      const fi = (w - planningEnd - 1) % Math.max(feat.length, 1);
      milestone = `Build: ${feat[fi]}`;
      tasks =
        w === planningEnd + 1
          ? ["Scaffold project & dev environment", "Implement core data model", "Write first integration test"]
          : [`Implement: ${feat[fi]}`, "Unit-test the new module", "Weekly demo to the team"];
    } else if (w <= integEnd) {
      phase = "Integration & Testing";
      milestone = integMilestones[Math.min(w - devEnd - 1, integMilestones.length - 1)];
      tasks =
        w === integEnd
          ? ["Fix accepted UAT issues", "Record demo video", "Freeze feature set"]
          : ["Integrate remaining modules end-to-end", "Run regression test suite", "Log and triage defects"];
    } else if (w <= docsEnd) {
      phase = "Documentation";
      milestone = docsMilestones[Math.min(w - integEnd - 1, docsMilestones.length - 1)];
      tasks = ["Write report chapter", "Refresh architecture diagrams", "Compile results & screenshots"];
    } else {
      phase = "Submission & Demo";
      milestone = "Final submission & viva";
      tasks = ["Submit report & source code", "Deliver final presentation", "Archive repository with README"];
    }
    weeks.push({ week: w, phase, milestone, tasks });
  }
  return weeks;
}

export function composeBlueprint(input: ProjectInput): Blueprint {
  const preset = presetFor(input.domain);
  const v = hash01(input.title + input.domain);

  const feasibility = clamp(round0(76 + v * 16 + (input.teamSize >= 3 ? 4 : 0) - (input.durationWeeks < 8 ? 6 : 0)), 55, 97);
  const innovation = clamp(round0(56 + hash01(input.idea) * 32), 45, 95);
  const academicSuitability = clamp(round0(79 + hash01(input.problemStatement) * 16), 68, 97);

  let diffScore = input.level.startsWith("Post") || input.level.startsWith("Doc") ? 2 : 1;
  if (input.domain === "AI / Machine Learning" || input.domain === "IoT & Embedded" || input.domain === "Blockchain") diffScore += 1;
  if (input.teamSize < 2) diffScore += 1;
  if (input.durationWeeks >= 14) diffScore -= 1;
  const difficulty = diffScore >= 4 ? "High" : diffScore <= 1 ? "Low" : "Moderate";

  const verdict =
    feasibility >= 85 && academicSuitability >= 85 ? "Strong Go" : feasibility >= 72 ? "Go" : feasibility >= 58 ? "Go with caution" : "Revise";

  const evaluation: IdeaEvaluation = {
    scores: { feasibility, innovation, academicSuitability },
    difficulty,
    estimatedDuration: `${Math.max(4, input.durationWeeks - 1)}–${input.durationWeeks + 1} weeks`,
    verdict,
    recommendation: `The idea scores ${feasibility}/100 on feasibility for a ${input.teamSize}-person team over ${input.durationWeeks} weeks. Proceed as planned, but lock the scope by the end of week ${Math.max(2, Math.round(input.durationWeeks * 0.18))} and keep the evaluation harness (however simple) from day one — it is what turns a build into an academic contribution. ${
      innovation < 65
        ? "Differentiation is modest; add one measurable comparison against a baseline to strengthen the report."
        : "The innovation angle is solid; foreground it in the abstract and introduction."
    }`,
    strengths: [
      `Clear alignment with the ${input.domain} curriculum and available tooling.`,
      feasibility >= 82 ? "Workload fits the team size and semester calendar comfortably." : "Core flow is achievable even if stretch features slip.",
      academicSuitability >= 88 ? "Strong potential for measurable evaluation (accuracy, latency, or user study)." : "Evaluation plan is feasible with campus-scale data.",
    ],
    concerns: [
      preset.risks[0]?.risk ?? "Key external dependencies should be verified early.",
      difficulty === "High" ? "Ambition is high for the available weeks — define an MVP cut-line now." : "Several features depend on each other; sequence them to avoid integration crunch.",
      input.teamSize === 1 ? "Single-member team: automate testing early to protect the schedule." : "Coordinate module ownership in week 1 to avoid duplicated work.",
    ],
  };

  const scope: ScopeDefinition = {
    objectives: [
      `Design and implement ${input.title} addressing: ${input.problemStatement.trim().replace(/\.$/, "")}.`,
      `Validate the approach with a structured evaluation (${presetFor(input.domain).features[4] ?? "a measurable baseline comparison"}).`,
      "Produce complete academic documentation: synopsis, report, diagrams and presentation.",
      "Demonstrate a working prototype to evaluators with reproducible setup instructions.",
    ],
    deliverables: [
      "Working prototype (demo-ready, with seed data)",
      "Source code repository with README & contribution log",
      "Project report (IEEE/institutional format)",
      "Architecture, UML and flowchart diagrams",
      "Final presentation + 3-minute demo video",
      "Evaluation results with baseline comparison",
    ],
    features: preset.features.slice(0, 6),
    functional: preset.features.slice(0, 6).map((f) => `The system shall support: ${f.toLowerCase()}.`),
    nonFunctional: [
      "Key user flows must respond within 2 seconds on reference hardware.",
      "The system shall be usable at 360px viewport width and pass basic WCAG contrast checks.",
      "All persisted data shall survive a service restart; backups shall be scriptable.",
      "The prototype shall handle at least 50 concurrent demo sessions without degradation.",
      "Deployment shall be reproducible from the README in under 15 minutes.",
    ],
    outOfScope: [
      "Production-grade multi-tenancy and billing",
      "Native mobile applications (responsive web only, unless mobile domain)",
      "Long-term operational monitoring after submission",
    ],
  };

  const layers: TechPick["layer"][] = ["Frontend", "Backend", "AI / ML", "Database", "Deployment", "Libraries & Frameworks"];
  const technology: TechPick[] = preset.stack.map((s, i) => ({ layer: layers[i % layers.length], ...s }));

  const risks: RiskItem[] = [
    ...preset.risks.map((r) => ({ ...r, id: uid() })),
    { id: uid(), ...g("Exam season compresses available dev weeks", "Schedule", "Medium", "High", "Front-load development: target feature-freeze one week before exams and protect two weekend sprints.") },
  ].slice(0, 6);

  return {
    evaluation,
    scope,
    technology,
    architecture: preset.layers,
    timeline: buildTimeline(input, preset),
    risks,
    generatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Project materialisation (blueprint -> trackable plan)               */
/* ------------------------------------------------------------------ */

export interface MaterializeOpts {
  currentWeek: number;
  status?: Project["status"];
  riskLevel?: RiskLevel;
  delayedTaskTitles?: string[];
  completed?: boolean;
  createdDaysAgo?: number;
}

export function materializeProject(input: ProjectInput, student: { id: string; name: string }, opts: MaterializeOpts): Project {
  const blueprint = composeBlueprint(input);

  const milestones: Milestone[] = [];
  for (const w of blueprint.timeline) {
    const last = milestones[milestones.length - 1];
    if (last && blueprint.timeline.find((x) => x.week === last.weeks[0])?.phase === w.phase) {
      last.weeks[1] = w.week;
    } else {
      milestones.push({ id: uid(), title: w.phase, weeks: [w.week, w.week] });
    }
  }
  const milestoneIdForWeek = (week: number): string =>
    (milestones.find((m) => week >= m.weeks[0] && week <= m.weeks[1]) ?? milestones[0]).id;

  const tasks: Task[] = blueprint.timeline.flatMap((w) =>
    w.tasks.map((title) => ({
      id: uid(),
      title,
      week: w.week,
      milestoneId: milestoneIdForWeek(w.week),
      status: "pending" as const,
    })),
  );

  if (!opts.completed) {
    for (const t of tasks) {
      if (t.week < opts.currentWeek) t.status = "done";
    }
    const firstCurrent = tasks.find((t) => t.week === opts.currentWeek);
    if (firstCurrent) firstCurrent.status = "in-progress";
    for (const dt of opts.delayedTaskTitles ?? []) {
      const t = tasks.find((x) => x.title.toLowerCase().includes(dt.toLowerCase()));
      if (t) t.status = "delayed";
    }
  } else {
    for (const t of tasks) t.status = "done";
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const progress = opts.completed ? 100 : Math.round((done / Math.max(tasks.length, 1)) * 100);

  const current = blueprint.timeline.find((w) => w.week === opts.currentWeek) ?? blueprint.timeline[0];
  const nextTask =
    tasks.find((t) => t.status === "in-progress")?.title ??
    tasks.find((t) => t.status === "pending")?.title ??
    tasks.find((t) => t.status === "delayed")?.title ??
    "Prepare final submission";

  const sevRank: Record<Severity, number> = { Low: 1, Medium: 2, High: 3 };
  const maxRisk = Math.max(...blueprint.risks.map((r) => sevRank[r.severity] * sevRank[r.probability]));
  const riskLevel: RiskLevel = opts.riskLevel ?? (maxRisk >= 6 ? "high" : maxRisk >= 4 ? "medium" : "low");

  const createdDays = opts.createdDaysAgo ?? Math.max(1, (opts.currentWeek - 1) * 7);
  return {
    id: uid(),
    title: input.title,
    domain: input.domain,
    level: input.level,
    studentName: student.name,
    studentId: student.id,
    teamSize: input.teamSize,
    durationWeeks: input.durationWeeks,
    currentWeek: opts.completed ? input.durationWeeks : opts.currentWeek,
    progress,
    phase: opts.completed ? "Submitted" : current.phase,
    status: opts.status ?? (opts.completed ? "completed" : "active"),
    riskLevel,
    nextTask,
    createdAt: daysAgoIso(createdDays),
    lastUpdate: hoursAgoIso(5 + Math.round(hash01(input.title) * 40)),
    input,
    blueprint,
    milestones,
    tasks,
    activity: [
      { id: uid(), text: "Risk Analyst refreshed the risk register", ts: hoursAgoIso(6), kind: "ai" },
      { id: uid(), text: `Task completed: ${tasks.filter((t) => t.status === "done").slice(-1)[0]?.title ?? "Project scaffolding"}`, ts: hoursAgoIso(26), kind: "user" },
      { id: uid(), text: "Timeline Planner synced the week plan with progress", ts: hoursAgoIso(50), kind: "ai" },
      { id: uid(), text: "Project blueprint generated by 6 agents", ts: daysAgoIso(Math.max(1, createdDays - 1)), kind: "ai" },
      { id: uid(), text: "Project created", ts: daysAgoIso(createdDays), kind: "system" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Progress analytics helpers (pure, used by UI + charts)              */
/* ------------------------------------------------------------------ */

export function burndownFor(p: Project): { week: number; planned: number; actual: number | null }[] {
  const rows: { week: number; planned: number; actual: number | null }[] = [];
  for (let w = 1; w <= p.durationWeeks; w++) {
    const planned = Math.round((w / p.durationWeeks) * 100);
    const doneBy = p.tasks.filter((t) => t.week <= w && t.status === "done").length;
    const actual = w <= p.currentWeek ? Math.round((doneBy / Math.max(p.tasks.length, 1)) * 100) : null;
    rows.push({ week: w, planned, actual });
  }
  return rows;
}

export function weekLoadFor(p: Project): { week: number; done: number; open: number; delayed: number }[] {
  return Array.from({ length: p.durationWeeks }, (_, i) => {
    const w = i + 1;
    const tasks = p.tasks.filter((t) => t.week === w);
    return {
      week: w,
      done: tasks.filter((t) => t.status === "done").length,
      open: tasks.filter((t) => t.status === "pending" || t.status === "in-progress").length,
      delayed: tasks.filter((t) => t.status === "delayed").length,
    };
  });
}

export function milestoneProgress(p: Project, m: Milestone): number {
  const tasks = p.tasks.filter((t) => t.milestoneId === m.id);
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100);
}

export function recomputeProject(p: Project): Project {
  const done = p.tasks.filter((t) => t.status === "done").length;
  const progress = Math.round((done / Math.max(p.tasks.length, 1)) * 100);
  const nextTask =
    p.tasks.find((t) => t.status === "in-progress")?.title ??
    p.tasks.filter((t) => t.status === "pending").sort((a, b) => a.week - b.week)[0]?.title ??
    p.tasks.find((t) => t.status === "delayed")?.title ??
    "Prepare final submission";
  const allDone = p.tasks.every((t) => t.status === "done");
  return {
    ...p,
    progress,
    nextTask,
    lastUpdate: new Date().toISOString(),
    status: allDone ? "completed" : p.status === "completed" ? "active" : p.status,
    phase: allDone ? "Submitted" : p.phase,
  };
}

/* ------------------------------------------------------------------ */
/* Mentor agent                                                        */
/* ------------------------------------------------------------------ */

export function mentorReply(p: Project, question: string): { content: string; agent: string } {
  const q = question.toLowerCase();
  const current = p.blueprint.timeline.find((w) => w.week === p.currentWeek);
  const weekTasks = p.tasks.filter((t) => t.week === p.currentWeek);
  const doneCount = p.tasks.filter((t) => t.status === "done").length;

  if (/(week|priority|work on|next|focus)/.test(q)) {
    return {
      agent: "Planner Agent",
      content: `You are in **Week ${p.currentWeek} of ${p.durationWeeks}** (${current?.phase ?? p.phase}). Here is the plan I set for this week:\n\n${weekTasks
        .map((t) => `- ${t.status === "done" ? "~~" : ""}**${t.title}**${t.status === "done" ? "~~ _(done)_" : t.status === "in-progress" ? " _(in progress)_" : ""}`)
        .join("\n")}\n\nStart with **${p.nextTask}** — it unblocks the milestone *${current?.milestone ?? ""}*. You are at **${p.progress}%** overall (${doneCount}/${p.tasks.length} tasks), which is ${
        p.progress >= Math.round((p.currentWeek / p.durationWeeks) * 100) - 5 ? "on track" : "slightly behind schedule — I would close two pending tasks before Friday"
      }.`,
    };
  }
  if (/(why|technology|tech|stack|framework|recommend)/.test(q)) {
    const picks = p.blueprint.technology.slice(0, 3);
    return {
      agent: "Tech Scout",
      content: `I optimised your stack for **a ${p.teamSize}-person team, ${p.durationWeeks} weeks, and evaluator reproducibility** — not for what is trendy. The core picks:\n\n${picks
        .map((t) => `- **${t.layer}: ${t.pick}** — ${t.rationale}`)
        .join("\n")}\n\nThe full rationale (with alternatives) is in your **Technology Recommendation** tab. If any pick clashes with a skill on your team, tell me which and I will re-score the trade-off.`,
    };
  }
  if (/(risk|threat|issue|worry|danger)/.test(q)) {
    return {
      agent: "Risk Analyst",
      content: `Your register holds **${p.blueprint.risks.length} risks**. The ones I would act on this week:\n\n${p.blueprint.risks
        .slice(0, 3)
        .map((r) => `- **${r.risk}** (${r.severity} severity, ${r.probability} probability) → ${r.mitigation}`)
        .join("\n")}\n\nOverall exposure is **${p.riskLevel}**. Review the full matrix in the **Risk Assessment** tab — and flag anything new you have noticed; I will re-score the register.`,
    };
  }
  if (/(scope|improve|refine|feature|requirement)/.test(q)) {
    return {
      agent: "Scope Agent",
      content: `Three ways to sharpen the scope of **${p.title}**:\n\n- **Cut to an MVP line.** These are your six committed features: ${p.blueprint.scope.features
        .slice(0, 3)
        .join("; ")}… the rest are stretch. Decide today which two can be dropped if week ${Math.round(p.durationWeeks * 0.6)} slips.\n- **Make evaluation a first-class feature.** "${
        p.blueprint.scope.objectives[1] ?? "Add a baseline comparison"
      }" is what examiners grade.\n- **Guard the boundary.** Explicitly out of scope: ${p.blueprint.scope.outOfScope.slice(0, 2).join("; ").toLowerCase()}.\n\nWant me to rewrite the objectives around a tighter MVP? Say the word and I will draft them.`,
    };
  }
  if (/(document|report|synopsis|ppt|abstract|manual|literature)/.test(q)) {
    return {
      agent: "Doc Drafter",
      content: `I can draft any of the 11 standard documents from your live project data — synopsis, abstract, literature review, objectives, problem statement, architecture, UML, flowchart, full report skeleton, PPT outline, or user manual.\n\nOpen the **Documentation Generator** tab and pick one; each draft pulls your real scope, stack and risks, so it stays consistent with the blueprint. Generate a draft there, then paste any section back to me and I will tighten the academic tone.`,
    };
  }
  if (/(architecture|design|diagram|uml|flow)/.test(q)) {
    const a = p.blueprint.architecture;
    return {
      agent: "Architecture Planner",
      content: `Your system is organised in **${a.layers.length} layers**:\n\n${a.layers.map((l) => `- **${l.name}** — ${l.components.join(", ")}`).join("\n")}\n\nRequest path: ${
        a.dataFlow[0]
      } ${a.dataFlow[1] ?? ""}\n\nThe visual version lives in **Blueprint → Architecture**. If you are drawing the UML for the report, generate the *UML* document — I will produce component and sequence views consistent with this design.`,
    };
  }
  if (/(timeline|schedule|deadline|delay|behind|exam)/.test(q)) {
    const plan = p.blueprint.timeline;
    return {
      agent: "Planner Agent",
      content: `The ${p.durationWeeks}-week plan runs: **${[...new Set(plan.map((w) => w.phase))].join(" → ")}**. You are in *${current?.phase}* (week ${p.currentWeek}).\n\n${
        p.tasks.some((t) => t.status === "delayed")
          ? `⚠ **${p.tasks.filter((t) => t.status === "delayed").length} task(s) are delayed**: ${p.tasks
              .filter((t) => t.status === "delayed")
              .map((t) => t.title)
              .join("; ")}. I recommend re-sequencing them into this week before they push the milestone.`
          : "No delays recorded — keep the Friday demo habit and the plan will hold."
      }\n\nExam season is priced in: the plan freezes features one week early.`,
    };
  }
  if (/(progress|status|how am i|tracking)/.test(q)) {
    return {
      agent: "Mentor",
      content: `**${p.title}** is at **${p.progress}%** — ${doneCount} of ${p.tasks.length} tasks done, currently in *${p.phase}* (week ${p.currentWeek}/${p.durationWeeks}).\n\nNext: **${p.nextTask}**. Risk exposure: **${p.riskLevel}**.\n\n${
        p.progress >= Math.round((p.currentWeek / p.durationWeeks) * 100) - 5
          ? "That is on or ahead of the planned curve. Nice pace."
          : "That is a little under the planned curve for this week — the Progress tab shows exactly which tasks slipped."
      }`,
    };
  }
  if (/(hi|hello|hey|help|start)/.test(q) && q.length < 25) {
    return {
      agent: "Mentor",
      content: `Hello — I am your project mentor, and I have the full context of **${p.title}** (blueprint, scope, stack, ${p.blueprint.risks.length} risks, ${p.tasks.length} tasks).\n\nAsk me things like:\n- "What should I work on this week?"\n- "Why did you recommend ${
        p.blueprint.technology[0]?.pick.split(" ")[0] ?? "this stack"
      }?"\n- "What are the biggest risks right now?"\n- "How do I improve my scope before week ${Math.round(p.durationWeeks * 0.3)}?"`,
    };
  }
  return {
    agent: "Mentor",
    content: `Here is how I read your situation for **${p.title}**:\n\n- **Progress:** ${p.progress}% (${doneCount}/${p.tasks.length} tasks) — ${
      p.progress >= Math.round((p.currentWeek / p.durationWeeks) * 100) - 5 ? "on the planned curve" : "slightly behind the curve"
    }.\n- **Now:** week ${p.currentWeek}, *${p.phase}*. Next task: **${p.nextTask}**.\n- **Watch:** ${p.blueprint.risks[0]?.risk.toLowerCase() ?? "external dependencies"}.\n\nI work best with concrete questions — try "What should I work on this week?", "Why did the AI recommend this technology?", or "Generate documentation for my project."`,
  };
}

/* ------------------------------------------------------------------ */
/* Document composer                                                   */
/* ------------------------------------------------------------------ */

export interface DocMeta {
  type: DocType;
  title: string;
  desc: string;
  icon: string;
}

export const DOC_META: DocMeta[] = [
  { type: "synopsis", title: "Synopsis", desc: "1–2 page proposal overview for approval", icon: "file" },
  { type: "abstract", title: "Abstract", desc: "150–250 word summary of the work", icon: "book" },
  { type: "literature-review", title: "Literature Review", desc: "Related work & research gap", icon: "search" },
  { type: "objectives", title: "Objectives", desc: "Measurable project objectives", icon: "target" },
  { type: "problem-statement", title: "Problem Statement", desc: "Formal problem definition", icon: "alert" },
  { type: "architecture", title: "Architecture Doc", desc: "System architecture narrative", icon: "layers" },
  { type: "uml", title: "UML Diagrams", desc: "Component & sequence views", icon: "grid" },
  { type: "flowchart", title: "Flowchart", desc: "Primary process flow", icon: "chart" },
  { type: "report", title: "Project Report", desc: "Full report skeleton with sections", icon: "book" },
  { type: "ppt", title: "Presentation (PPT)", desc: "12-slide defence outline", icon: "gauge" },
  { type: "user-manual", title: "User Manual", desc: "Setup & usage guide", icon: "users" },
];

export function composeDoc(p: Project, type: DocType): DocArtifact {
  const b = p.blueprint;
  const title = DOC_META.find((d) => d.type === type)?.title ?? type;
  let content = "";
  let diagram: DocArtifact["diagram"];

  switch (type) {
    case "synopsis":
      content = `### 1. Title\n${p.title}\n\n### 2. Introduction\n${p.input.idea}\n\n### 3. Problem Definition\n${p.input.problemStatement}\n\n### 4. Objectives\n${b.scope.objectives
        .map((o, i) => `${i + 1}. ${o}`)
        .join("\n")}\n\n### 5. Methodology\nThe system follows a ${b.architecture.layers.length}-layer architecture (${b.architecture.layers
        .map((l) => l.name)
        .join(" → ")}), implemented with ${b.technology.slice(0, 2).map((t) => t.pick).join(" and ")}. Development proceeds in ${
        p.durationWeeks
      } weeks across planning, core development, integration and documentation phases.\n\n### 6. Expected Outcomes\n${b.scope.deliverables
        .slice(0, 4)
        .map((d) => `- ${d}`)
        .join("\n")}\n\n### 7. Tools & Technologies\n${b.technology.map((t) => `- **${t.layer}:** ${t.pick}`).join("\n")}`;
      break;
    case "abstract":
      content = `### Abstract\n\n${p.input.problemStatement} This project presents **${p.title}**, a ${p.domain.toLowerCase()} system designed and implemented within a ${
        p.durationWeeks
      }-week academic timeline by a ${p.teamSize}-member team.\n\nThe proposed system ${b.scope.features
        .slice(0, 3)
        .join("; ")
        .toLowerCase()}. It is built on ${b.technology[0]?.pick} and ${b.technology[1]?.pick}, organised as a ${
        b.architecture.layers.length
      }-layer architecture, and evaluated through a structured baseline comparison.\n\nPreliminary planning indicates a feasibility score of ${
        b.evaluation.scores.feasibility
      }/100 with ${b.evaluation.difficulty.toLowerCase()} implementation difficulty. Key risks — including ${
        b.risks[0]?.risk.toLowerCase()
      } — are tracked with documented mitigations. The outcome is a working prototype, complete documentation, and a reproducible evaluation, satisfying the requirements of the ${p.level.toLowerCase()} programme.\n\n**Keywords:** ${
        p.domain
      }, ${b.technology.slice(0, 3).map((t) => t.pick.split(" ")[0]).join(", ")}, academic project, prototype evaluation.`;
      break;
    case "literature-review":
      content = `### Literature Review (draft)\n\n**2.1 Related work**\n\n| # | Work / System | Relevance | Gap addressed by this project |\n|---|---|---|---|\n${b.scope.features
        .slice(0, 4)
        .map((f, i) => `| ${i + 1} | [Cite ${i + 1}] — prior ${p.domain.toLowerCase()} systems | Establishes feasibility of ${f.toLowerCase().slice(0, 60)}… | None evaluated in a campus context with this stack |`)
        .join("\n")}\n\n**2.2 Research gap**\nExisting systems address the problem partially, but none combine ${b.scope.features
        .slice(0, 2)
        .join(" with ")
        .toLowerCase()} under the constraints of an academic deployment (cost, reproducibility, ${
        p.durationWeeks
      }-week delivery). This project fills that gap.\n\n**2.3 Positioning**\nThe proposed system reuses proven components (${b.technology
        .map((t) => t.pick.split(" ")[0])
        .slice(0, 3)
        .join(", ")}) and contributes an integrated, evaluated prototype with open documentation.\n\n_Note: replace bracketed citations with 8–10 real references from IEEE Xplore / Google Scholar — I can help structure each entry._`;
      break;
    case "objectives":
      content = `### Project Objectives\n\n**Primary objective**\n${b.scope.objectives[0]}\n\n**Supporting objectives**\n${b.scope.objectives
        .slice(1)
        .map((o, i) => `${i + 2}. ${o}`)
        .join("\n")}\n\n**Success criteria (measurable)**\n${b.scope.nonFunctional.slice(0, 4).map((n, i) => `- SC${i + 1}: ${n}`).join("\n")}\n\n**Stretch objectives (only if ahead of plan by week ${Math.round(
        p.durationWeeks * 0.5,
      )})**\n${b.scope.features.slice(4, 6).map((f) => `- ${f}`).join("\n")}`;
      break;
    case "problem-statement":
      content = `### Problem Statement\n\n**Context.** ${p.input.idea}\n\n**Problem.** ${p.input.problemStatement}\n\n**Why it matters.** Without a systematic solution, the process remains manual, inconsistent and unmeasurable — the exact failure modes observed in the motivating context.\n\n**Constraints.** Academic delivery within ${
        p.durationWeeks
      } weeks, team of ${p.teamSize}, ${p.level.toLowerCase()} scope, and the non-functional requirements:\n${b.scope.nonFunctional
        .slice(0, 3)
        .map((n) => `- ${n}`)
        .join("\n")}\n\n**Deliverable response.** A prototype implementing: ${b.scope.features.slice(0, 3).join("; ").toLowerCase()}.`;
      break;
    case "architecture":
      content = `### System Architecture\n\nThe system is organised as a **${b.architecture.layers.length}-layer architecture**.\n\n${b.architecture.layers
        .map((l, i) => `**Layer ${i + 1} — ${l.name}.** Components: ${l.components.join(", ")}.`)
        .join("\n\n")}\n\n**Request / data flow**\n${b.architecture.dataFlow.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\n**Key architectural decisions**\n- ${
        b.technology[1]?.pick
      } chosen because: ${b.technology[1]?.rationale}\n- ${b.technology[3]?.pick} chosen because: ${
        b.technology[3]?.rationale
      }\n\n_Diagrams: generate the *UML* and *Flowchart* documents for the visual companion to this narrative._`;
      break;
    case "uml":
      diagram = "uml";
      content = `### UML Views\n\n**Component view** — rendered above from the live architecture model.\n\n**Classes / modules (principal)**\n${b.architecture.layers
        .flatMap((l) => l.components.slice(0, 2))
        .slice(0, 6)
        .map((c) => `- «component» **${c}** — owned by ${b.architecture.layers.find((l) => l.components.includes(c))?.name}`)
        .join("\n")}\n\n**Sequence (primary flow)**\n${b.architecture.dataFlow.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\n_Relationships: components communicate downward through well-defined interfaces; no cyclic dependencies between layers._`;
      break;
    case "flowchart":
      diagram = "flowchart";
      content = `### Process Flowchart\n\n**Primary flow rendered above.** Decision points:\n\n- **D1** — input valid? No → return validation errors (Layer: ${
        b.architecture.layers[1]?.name
      }).\n- **D2** — result acceptable? No → fallback path documented in risk mitigations.\n- **D3** — persist successful outcome and notify the user.\n\n**Entry conditions:** authenticated user, required fields present.\n**Exit conditions:** state persisted, response ≤ 2s (NFR-1).`;
      break;
    case "report":
      content = `### Project Report — Skeleton\n\n**1. Introduction** — context, motivation, ${p.input.problemStatement.slice(0, 120)}…\n**2. Literature Review** — see *Literature Review* document (8–10 citations).\n**3. Objectives & Scope** — objectives (this pack), in-scope features:\n${b.scope.features
        .map((f) => `   - ${f}`)
        .join("\n")}\n**4. System Design** — architecture narrative + UML + flowchart (attached documents).\n**5. Implementation** — stack: ${b.technology
        .map((t) => `${t.layer}: ${t.pick}`)
        .join("; ")}.\n**6. Testing & Results** — test matrix mapped to:\n${b.scope.nonFunctional
        .slice(0, 3)
        .map((n) => `   - ${n}`)
        .join("\n")}\n**7. Risks & Limitations** — top risks: ${b.risks
        .slice(0, 2)
        .map((r) => r.risk.toLowerCase())
        .join("; ")}.\n**8. Conclusion & Future Work** — MVP cut-line items as future work.\n**References / Appendix A: Weekly log** — auto-filled from your Progress tab.\n\n_Generate each companion document; this skeleton binds them into the final report._`;
      break;
    case "ppt":
      content = `### Defence Presentation — 12 Slides\n\n1. **Title** — ${p.title} · ${p.studentName} · guide & programme\n2. **Problem** — one sentence: ${p.input.problemStatement.slice(
        0,
        110,
      )}…\n3. **Why now / gap** — the research gap in one diagram\n4. **Objectives** — max 4, measurable\n5. **Solution overview** — the 30-second narrative\n6. **Architecture** — ${
        b.architecture.layers.length
      }-layer diagram (from Architecture doc)\n7. **Key tech decisions** — ${b.technology
        .slice(0, 3)
        .map((t) => t.pick.split(" ")[0])
        .join(" · ")} and *why*\n8. **Live demo** — 3 minutes, happy path only\n9. **Results / evaluation** — the numbers that prove it works\n10. **Risks faced & mitigations** — honesty scores points\n11. **Limitations & future work** — the stretch features\n12. **Thank you / Q&A** — anticipate: feasibility, originality, your personal contribution\n\n_Speaker notes: 45s per slide; rehearse the demo twice with the fallback video ready._`;
      break;
    case "user-manual":
      content = `### User Manual\n\n**1. System requirements**\n- Modern browser (Chrome/Firefox/Edge, last 2 versions)\n- ${
        b.technology[3]?.pick ?? "Database"
      } reachable; see deployment notes\n\n**2. Installation (evaluator quick-start)**\n1. Clone the repository\n2. \`${
        b.technology[4]?.pick.toLowerCase().includes("docker") ? "docker compose up" : "npm install && npm run dev"
      }\`\n3. Load seed data (provided script)\n4. Open the printed URL\n\n**3. First steps**\n${b.scope.features
        .slice(0, 3)
        .map((f, i) => `${i + 1}. ${f} — available from the main navigation`)
        .join("\n")}\n\n**4. Common tasks**\n${b.architecture.dataFlow.slice(0, 3).map((d, i) => `- Task ${i + 1}: ${d}`).join("\n")}\n\n**5. Troubleshooting**\n- Service does not start → verify ports & environment variables in README\n- Slow responses → expected cold start < 5s on first request\n\n**6. Support** — repository issue tracker; response within 48h during the evaluation window.`;
      break;
  }

  return {
    id: uid(),
    type,
    title: `${title} — ${p.title}`,
    content,
    diagram,
    generatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Insight composers (dashboards)                                      */
/* ------------------------------------------------------------------ */

export function aiRecommendations(p: Project): string[] {
  const planned = Math.round((p.currentWeek / p.durationWeeks) * 100);
  const delayed = p.tasks.filter((t) => t.status === "delayed");
  const recs: string[] = [];
  if (p.progress < planned - 8)
    recs.push(`Progress (${p.progress}%) is trailing the week-${p.currentWeek} plan (${planned}%). Drop one stretch feature and re-baseline the next two weeks.`);
  if (delayed.length)
    recs.push(`${delayed.length} delayed task${delayed.length > 1 ? "s" : ""} (${delayed.map((d) => `"${d.title}"`).join(", ")}) — time-box ${delayed.length > 1 ? "them" : "it"} to this week or move to the v2 list.`);
  recs.push(`Top risk "${p.blueprint.risks[0]?.risk.toLowerCase()}" is still open — schedule its mitigation as a task before week ${Math.min(p.durationWeeks, p.currentWeek + 2)}.`);
  if (p.currentWeek >= p.durationWeeks * 0.6)
    recs.push("You are past the midpoint — start the report skeleton now; documentation weeks compress more than development weeks do.");
  else recs.push("Keep Friday demos: a 10-minute weekly walkthrough keeps the guide aligned and surfaces scope drift early.");
  return recs.slice(0, 4);
}

export function composeInsights(p: Project): string[] {
  const planned = Math.round((p.currentWeek / p.durationWeeks) * 100);
  const delayed = p.tasks.filter((t) => t.status === "delayed").length;
  const high = p.blueprint.risks.filter((r) => r.severity === "High");
  const out: string[] = [];
  out.push(
    p.progress >= planned - 5
      ? `On track: ${p.progress}% delivered against a ${planned}% plan at week ${p.currentWeek}/${p.durationWeeks}. Velocity has been steady across the last three weeks.`
      : `Behind plan: ${p.progress}% delivered against ${planned}% expected at week ${p.currentWeek}/${p.durationWeeks}. A re-baseline conversation is recommended within 7 days.`,
  );
  if (delayed) out.push(`${delayed} task${delayed > 1 ? "s" : ""} currently delayed. Pattern suggests under-estimation of integration work — check estimates for the ${p.phase} phase.`);
  if (high.length) out.push(`High-severity risks open: ${high.map((r) => r.risk.toLowerCase()).join("; ")}. Mitigations exist in the register; verify the student has scheduled them.`);
  out.push(
    `Documentation readiness: ${p.progress >= 60 ? "student is past 60% — nudge report drafting now to avoid an end-semester crunch." : "too early to press documentation; ensure the synopsis and objectives are frozen first."}`,
  );
  out.push(
    p.status === "delayed"
      ? "Flagged as delayed at portfolio level — consider a mid-week check-in rather than the usual weekly cadence."
      : "Engagement signal healthy: last update recent, activity log shows current events.",
  );
  return out;
}

/* ------------------------------------------------------------------ */
/* Seed chat                                                           */
/* ------------------------------------------------------------------ */

export function welcomeMessage(p: Project): ChatMessage {
  return {
    id: uid(),
    role: "mentor",
    agent: "Mentor",
    ts: hoursAgoIso(2),
    content: `Welcome back — I have been watching **${p.title}**. You are at **${p.progress}%** in *${p.phase}* (week ${p.currentWeek}/${p.durationWeeks}), and the next task is **${p.nextTask}**. Everything in your blueprint — scope, stack, timeline and ${p.blueprint.risks.length} tracked risks — is attached to this conversation, so ask me anything about it.`,
  };
}
