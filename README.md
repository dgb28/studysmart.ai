# 🧠 StudySmart.ai 🚀

> **A Next-Generation Context-Aware Learning Platform for the Hackathon**

StudySmart.ai is a comprehensive, glassmorphic learning dashboard that integrates real-time AI voice coaching, context-aware AI interactions, and highly granular study analytics to optimize focused learning sessions.

---

## ✨ Key Features

- **🗣️ Interactive AI Voice Coach**
  Real-time synchronized chat and voice coaching powered by the ElevenLabs SDK. Receive instant verbal feedback and explanations while studying.
  
- **🎯 Context-Aware Modules**
  The AI dynamically understands the exact topic and module you are currently studying. Its knowledge base is locked exclusively to your current context to prevent hallucinations and keep responses relevant.

- **📈 Granular Interaction Analytics Hub**
  Track your actual study footprint rather than just time on a page. Our built-in tracking engine captures:
  - **Focus Time**: Precise minute-level tracking of active studying.
  - **Keystrokes**: Quantifying active engagement and answering.
  - **Tab Switches**: Monitoring context-switching to help reduce distractions.
  - **Window Blurs**: Detecting background idle time.
  Includes beautiful, interactive *Weekly* and *Monthly* vertical bar charts demonstrating a rolling 7-day average of all tracked metrics metrics.
  
- **⏳ Smart Inactivity Detection**
  Timers dynamically pause while you communicate with the AI and resume when you return to active module engagement.

- **🛡️ Proof of Learning**
  Automated micro-challenges verify student understanding before permitting advancement to the next topic.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router) & React
- **Styling**: Tailwind CSS & Framer Motion (Glassmorphic aesthetics)
- **Data Visualization**: Recharts (Interactive Analytics Dashboard)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI Integration**: ElevenLabs SDK & LLM Chains
- **Architecture**: REST API with strict CORS and JWT Authentication

### Infrastructure & DevOps
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes manifests via robust Makefile setups
- **Multi-Cloud Scalability**: Pre-configured Terraform structures for AWS (EKS, RDS, S3) and GCP (GKE, Cloud SQL).

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Docker** and **Docker Compose** installed
- **Node.js** v20+ & **Python** 3.11+
- **Make** installed for executing scripts

### 2. Getting Started
Start by cloning the repository and setting up your environment variables:

```bash
git clone https://github.com/dgb28/studysmart.ai.git
cd studysmart.ai

# Setup Environment Configuration
cp .env.example .env
```
*(Please make sure to populate the `.env` file with the relevant database URLs and ElevenLabs API keys for full functionality)*

### 3. Running via Docker

The entire platform is heavily containerized. Simply spin up the stack via:

```bash
docker compose up --build
```

The application will launch on `http://localhost:3000`, with the backend API accessible at `http://localhost:8000`.

---

## 🗂️ Project Repository Structure

```text
studysmart.ai/
├── backend/          # FastAPI REST API, SQL Models, & AI integration
├── frontend/         # Next.js UI, Recharts analytics, API hooks
├── agents/           # AI agent pipelines — RAG, chains, LLM tools
├── infra/            # Terraform configurations for AWS & GCP K8s
├── scripts/          # Convenience shell scripts for DB seeding/deploying
└── docs/             # Extensive documentation & architecture decisions
```

---

## 📖 Additional Documentation

Find deeper insights regarding the architecture and cloud setup in the following locations:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - System architecture diagrams
- [`docs/COLLABORATION.md`](docs/COLLABORATION.md) - Guidelines for working with AI Agents
- [`infra/`](infra/) - The Multi-Cloud configurations mapping out AWS/GCP Service Meshes

---

*Built specifically for the hackathon by the **StudySmart** Team!*
