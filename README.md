# 🧠 StudySmart.ai 🚀

> **A Next-Generation Context-Aware Learning Platform for the Hackathon**

StudySmart.ai is a comprehensive learning dashboard that integrates real-time AI voice coaching, context-aware AI interactions, and highly granular study analytics to optimize focused learning sessions.

---

## 🏆 Hackathon Judging Criteria Overview

### 🌍 Impact Potential 
**The Problem:** Traditional studying is often plagued by distraction, lack of personalized feedback, and zero insight into *how* effectively time is being spent. 
**Our Solution:** StudySmart.ai solves this by providing a distraction-free, glassmorphic environment equipped with a granular interaction analytics dashboard. By tracking *Focus Time*, *Tab Switches*, *Keystrokes*, and *Window Blurs*, we empower students to hold themselves accountable and deeply understand their own learning habits, leading to significantly better educational outcomes.

### 💻 Technical Execution 
**Purposeful AI:** Our AI is not just a standard chatbot wrapper; it is an **Interactive Voice Coach** powered by the ElevenLabs SDK. The LLM is contextually locked the exact module the student is studying, preventing hallucinations.
**Prototype Efficacy:** The prototype features a fully containerized Next.js/FastAPI stack. Our smart inactivity detectors seamlessly pause timers when engaging with the AI, ensuring that our analytics precisely map to genuine learning effort. By utilizing real-time API state and PostgreSQL, our bar chart analytics calculate accurate rolling 7-day averages.

### ⚖️ Ethical Alignment
**Empowerment over Replacement:** StudySmart.ai is designed to act as a 1-on-1 tutor, **not** to simply give students the answers. We implemented *Automated Micro-Challenges* that serve to verify a student's fundamental understanding before they can advance, promoting genuine knowledge retention over cheating.
**Risk Mitigation:** By locking the AI's contextual knowledge strictly to the learning module at hand, we drastically reduce the risk of bias or hallucinated misinformation. We believe the future of AI in education is empowering students to think critically.

### 🎥 Presentation
Please refer to our **Submission Demo Video** for a full walkthrough of our architecture, UI functionality, and the future potential of expanding our analytics pipeline to support institutional integrations.

---

## ✨ Key Features

- **🗣️ Interactive AI Voice Coach**: Synchronized chat and voice coaching (ElevenLabs) for instant, verbal feedback.
- **🎯 Context-Aware Modules**: The AI strictly comprehends the exact topic currently being studied.
- **📈 Granular Interaction Analytics**: Weekly and Monthly charts tracking precise *Focus Time*, *Keystrokes*, *Tab Switches*, and *Window Blurs*.
- **⏳ Smart Inactivity Detection**: Timers explicitly handle idle time and AI-communication pauses.
- **🛡️ Proof of Learning**: Automated micro-challenges that govern module advancement.

---

## 🛠️ Tech Stack

### Frontend & Analytics
- **Next.js 14** (App Router) & React
- **Tailwind CSS & Framer Motion** (Glassmorphic UI design)
- **Recharts** (Interactive Vertical Bar Chart Analytics)

### Backend & AI
- **FastAPI** (Python)
- **ElevenLabs SDK & LLM Chains**
- **PostgreSQL** with SQLAlchemy ORM

### DevOps & Multi-Cloud Infrastructure (Pre-configured)
- **Docker & Docker Compose**
- **Terraform** configs for AWS (EKS, RDS, S3) & GCP (GKE, Cloud SQL)

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Docker** and **Docker Compose** installed
- **Node.js** v20+ & **Python** 3.11+
- **Make** installed for executing scripts

### 2. Getting Started
Start by cloning the repository and setting up your environment configuration:

```bash
git clone https://github.com/dgb28/studysmart.ai.git
cd studysmart.ai

# Setup Environment Configuration
cp .env.example .env
```
*(Please populate `.env` with the necessary Database URIs and ElevenLabs API keys).*

### 3. Running via Docker

The platform is heavily containerized. Spin up the entire stack via:

```bash
docker compose up --build
```

Access the UI at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## 🗂️ Repository Structure

```text
studysmart.ai/
├── backend/          # FastAPI REST API, SQL Models, AI integrations
├── frontend/         # Next.js Dashboard, Recharts Analytics, Hooks
├── agents/           # RAG pipelines, prompt chains, LLM tools
├── infra/            # Terraform configurations (AWS/GCP Service Meshes)
├── scripts/          # DB seeding & deployment shells
└── docs/             # Extensive architecture decisions
```

---

*Built with passion for the Hackathon by the **StudySmart.ai** Team!*
