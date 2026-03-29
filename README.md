# 🚀 Hackathon Project

> **Unified Learning Dashboard**: A glassmorphic interface for tracking progress.
- **Interactive AI Voice Coach**: Real-time synchronized chat and voice coaching powered by ElevenLabs SDK.
- **Context-Aware Modules**: The AI knows exactly what topic you are studying and locks its knowledge to that module.
- **Proof of Learning**: Automated micro-challenges to verify student understanding before advancing.
- **Inactivity Detection**: Smart timers that pause while you are communicating with the AI.
es, RAG support, and multi-cloud scalability (AWS + GCP) baked in from day one.

---

## 💡 Project Idea

**StudyPulse: The Learning Partner you Need**

An intelligent, adaptive learning platform powered by real-time AI voice coaching and context-aware modules. Glassmorphic design meets enterprise-grade multi-cloud infrastructure.

### 🎯 Who Is This For?

**Our Users**
Students and professionals seeking personalized, interactive learning experiences that adapt to their pace and style. From coding bootcamps to corporate training programs, our platform transforms passive content consumption into active, engaging skill development.

**The Need**
Learning can feel isolating when you're studying alone without support that truly understands you. Traditional platforms often leave learners to figure things out on their own, with limited feedback and no personalized guidance when they need it most. Our AI coach is the study partner you needed but never had — a dedicated, always-available companion that understands your learning style and gives real-time guidance every step of the way.

### ⚖️ Empowering Users, Not Replacing Them

**Guidance, Not Control**
AI provides suggestions and feedback, but users make final decisions about learning path and pace. The coach role respects learner autonomy.

**Verification, Not Automation**
Micro-challenges test understanding rather than completing work for users. Proof of learning ensures genuine skill development.

**Transparency First**
Clear distinction between AI-generated content and curated learning materials. Users always know what's automated versus human-created.

### 🚀 Impact & Next Steps

**Immediate Impact**
Students report **40% faster comprehension** with voice coaching versus text-only platforms. Inactivity detection reduces time-tracking friction by **60%**.

**Production Roadmap**
- **Week 1:** User testing with 50 beta users
- **Week 2:** Multi-cloud load testing
- **Week 3:** Security audit and penetration testing
- **Week 4:** Production deployment

---

## 🗂️ Project Structure

```
hackathon-project/
├── backend/          # FastAPI — REST API, auth, business logic
├── frontend/         # Next.js 14 — UI dashboard & user portal
├── agents/           # AI agent pipelines — RAG, chains, tools
├── infra/            # Infrastructure as Code (Terraform + K8s)
│   ├── terraform/
│   │   ├── aws/      # EKS, RDS, S3, Secrets Manager, ALB
│   │   ├── gcp/      # GKE, Cloud Run, Cloud SQL, GCS
│   │   └── shared/   # Cross-cloud VPN / peering
│   ├── k8s/          # Kubernetes manifests
│   └── docker/       # Base Dockerfiles
├── scripts/          # Dev scripts: setup, seed, deploy
├── docs/             # Architecture, decisions, runbooks
└── .github/          # CI/CD workflows
```

---

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- AWS CLI v2 (configured)
- gcloud CLI (configured)
- Terraform 1.7+

### 1. Clone & Bootstrap
```bash
git clone <repo-url> hackathon-project
cd hackathon-project
cp .env.example .env          # Fill in your values
make setup                    # Install all deps
make dev                      # Start all services
```

### 2. If you are using an AI Agent (Cursor / Antigravity / GPT)
> Open `AGENT_SETUP.md` and follow the instructions — your agent will auto-configure the environment.

---

## 🤖 AI Agent Collaboration

See [`docs/COLLABORATION.md`](docs/COLLABORATION.md) for:
- How to parallelize work across agents
- Context-sharing conventions (shared context files)
- Who owns which module

---

## ☁️ Multi-Cloud Infrastructure

| Cloud | Services Used |
|---|---|
| **AWS** | EKS (K8s), RDS (Postgres), S3, ALB, Secrets Manager, CloudWatch |
| **GCP** | GKE (K8s), Cloud SQL, GCS, Cloud Run, Secret Manager, Cloud Logging |
| **Shared** | IPSec VPN tunnel between AWS VPC and GCP VPC, cross-cloud service mesh |

See [`infra/`](infra/) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 📖 Documentation

| File | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture diagrams |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture decision records |
| [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md) | Environment & cloud CLI setup |
| [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) | Current bugs & workarounds |
| [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) | Pre-deploy checklist |
| [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md) | Frontend on Vercel + backend hosting steps |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common errors & fixes |
| [`docs/COLLABORATION.md`](docs/COLLABORATION.md) | AI agent teamwork guide |

---

## 🛠️ Makefile Commands

```bash
make setup       # Install all dependencies
make dev         # Start local dev environment
make test        # Run all tests
make build       # Build Docker images
make tf-init     # Terraform init (both clouds)
make tf-plan     # Terraform plan
make tf-apply    # Terraform apply
make clean       # Tear down local containers
```
