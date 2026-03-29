# 🧠 StudySmart.ai 🚀 

**A Next-Generation Context-Aware Learning Platform**  
*Built for the [Claude Hackathon: Social Impact](https://anthropic.com/)*

---

## 🎯 Hackathon Theme & Track Alignment

Our project proudly aligns with multiple tracks of the Claude Hackathon, primarily focusing on creating a genuine, scalable social impact:

1. **Primary: Track 3 – Economic Empowerment & Education**  
   We are solving the barrier of inequitable access to quality 1-on-1 tutoring. StudySmart acts as a highly personalized, adaptive tutoring system. It guarantees that any individual, regardless of their financial or geographical limitations, can receive pinpoint coaching and feedback to grow their skills and, consequently, their economic opportunities.
   
2. **Secondary: Track 2 – Neuroscience & Mental Health**  
   By tracking rapid tab switching, window blurs, and extreme spikes in keystrokes, our platform quietly monitors for signs of **cognitive overload and burnout**, encouraging healthy, distraction-free study habits rather than brute-force cramming.

---

## ❓ The Three Must-Answer Questions

**1. Who are we building this for and why do they need it?**  
We are building StudySmart for **non-traditional learners, underserved students, and neurodivergent individuals** who struggle with the "one-size-fits-all" pace of traditional classrooms. They critically need an adaptive, infinitely patient tutor that corrects their specific misunderstandings in real-time without judgment, and provides deep insights into their own distraction patterns.

**2. What could go wrong and what would you do about it?**  
- *The Risk of Hallucination or Bad Advice:* An AI teaching false information is inherently dangerous to a student's education.  
- *The Safeguard:* We built a strict **Contextually-Locked RAG (Retrieval-Augmented Generation) Pipeline**. The AI is physically restricted from answering queries outside the exact bounds of the currently active learning module, ensuring rigid factual accuracy.

**3. How does this help people rather than make decisions for them?**  
StudySmart never feeds a student the answer. Instead, it employs iterative Socratic questioning through our **Micro-Challenges Engine**. It requires the user to prove their understanding of a concept *before* advancing gracefully. It empowers the student to govern their own learning pacing, rather than dragging them forward or completely taking the reins.

---

## ✨ Extensive Feature Suite

Over the course of the hackathon, our team engineered a massive suite of features to turn this from a toy into a production-grade educational tool:

- **🗣️ Interactive AI Voice Coach**
  Real-time synchronized chat and voice coaching powered seamlessly by the ElevenLabs SDK, ensuring that auditory learners and the visually impaired have unparalleled accessibility.
  
- **🎯 Context-Aware Module Locking**
  Dynamic context tracking that seamlessly locks the LLM's knowledge base exlusively to your current topic, entirely eliminating irrelevant tangents or hallucinations.

- **📈 Granular Interaction Analytics Hub**
  Go beyond basic "Time on Page." Our built-in tracking engine captures precise study footprints:
  - **Focus Time**: Pinpoint monitoring of genuine active studying.
  - **Keystrokes**: Quantifying active engagement and answer formulation.
  - **Tab Switches & Window Blurs**: Detecting background idle time and context-switching to quantify distractions and combat burnout.
  
- **📊 Beautiful Data Visualization**
  A glassmorphic, interactive Analytics Dashboard featuring Weekly and Monthly vertical summary bar charts demonstrating rolling 7-day or 30-day averages of all tracked cognitive metrics.
  
- **⏳ Smart Inactivity & Burnout Detection**
  Timers dynamically pause while you communicate with the AI, ensuring analytic purity. Spikes in context-switching automatically trigger "Take A Break" burnout warnings.

- **🛡️ Proof of Learning API**
  Automated generated micro-challenges and spaced repetition mechanics designed to verify true student comprehension before permitting module advancement.

- **☁️ Multi-Cloud & Enterprise Ready**
  We didn't just build an app; we built an infrastructure. The platform ships with Terraform templates mapped for AWS (EKS, RDS, S3) and GCP (GKE, Cloud SQL) deployments.

---

## 🏆 How We Address the Judging Criteria

- **🌍 Impact Potential (25 pts):** Democratizes access to elite 1-on-1 tutoring models, solving a ubiquitous real-world problem for marginalized student populations.
- **💻 Technical Execution (30 pts):** A highly sophisticated containerized stack featuring a Next.js (App Router) frontend, a FastAPI (Python) backend, and a PostgreSQL database. AI is used purposefully as a voice coach and evaluator—not a toy chatbot.
- **⚖️ Ethical Alignment (25 pts):** Rigorously designed to augment human learning, not bypass it with "homework helpers". The rigid context constraints strictly resolve algorithmic biases and hallucinations. 
- **🎥 Presentation (20 pts):** Check out our **Demo Video Submission** to watch the platform seamlessly orchestrate Voice LLM coaching, analytic tracking, and module advancement in real-time!

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Docker** and **Docker Compose**
- **Node.js** v20+ & **Python** 3.11+

### 2. Getting Started
Clone and easily spin up the environment:

```bash
git clone https://github.com/dgb28/studysmart.ai.git
cd studysmart.ai

cp .env.example .env     # (Insert API keys here)
docker compose up --build
```
Access the Student Dashboard at `http://localhost:3000` and the secure Backend API at `http://localhost:8000`.

---

*Built with passion, caffeine, and purpose for the Claude Hackathon!*
