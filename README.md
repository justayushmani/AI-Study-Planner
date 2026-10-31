# 🧠 AI Study Planner — Adaptive Learning & Intelligent Scheduling System

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ai--study--planner.vercel.app-7C3AED?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-study-planner-3y16.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%20ORM-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Groq LLM](https://img.shields.io/badge/Groq%20Cloud-Llama%203.3%20%7C%20GPT--OSS-F55036?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com/)

**An enterprise-grade, hybrid AI-powered adaptive study planning platform that transforms curriculum documents and goals into mathematically optimized, DAG-constrained personalized schedules.**

[🔗 Explore Live Application](https://ai-study-planner-3y16.vercel.app/) • [📖 Architecture](#-hybrid-architecture) • [⚡ Key Features](#-key-features) • [🚀 Local Setup](#-local-development-setup) • [🌐 Deployment](#-cloud-deployment-guide)

</div>

---

## 🌐 Live Production Links

* **Frontend Web Application**: [https://ai-study-planner-3y16.vercel.app](https://ai-study-planner-3y16.vercel.app)
* **Backend API Gateway**: `https://ai-study-planner-backend-qvmh.onrender.com`
* **Health Check**: `https://ai-study-planner-backend-qvmh.onrender.com/health`

---

## 🧠 Hybrid Architecture: AI + Deterministic Engine

The platform separates probabilistic natural-language intelligence from exact mathematical scheduling:

```mermaid
graph TD
    A[Client: React 19 + Vite + Tailwind CSS] -->|REST API / JWT| B[Backend API: Node.js Express + Prisma]
    B -->|Relational Data Persistence| C[(PostgreSQL Database)]
    B -->|Microservice RPC| D[Planning Service: Python FastAPI]
    D -->|LLM Inference / Extraction / Quizzes| E[Groq Cloud LLM]
    D -->|Topological Sort & Bin-Packing| F[Deterministic Scheduling Engine]
    F -->|DAG Prerequisite Resolution| F
    F -->|Spaced Revision & Buffer Slots| F
    F -->|Missed Day Redistribution| F
```

1. **Probabilistic LLM Layer (Groq Llama 3.3 70B / GPT-OSS 120B)**:
   * Multi-format syllabus extraction (PDF, DOCX, raw text).
   * Context-aware diagnostic quiz question generation.
   * Grounded AI study coach answering questions with active goal awareness.

2. **Deterministic Constraint Engine (Python FastAPI + NetworkX)**:
   * **DAG Prerequisite Graph**: Strict topological sorting to guarantee prerequisite topics precede advanced concepts.
   * **Composite Priority Formula**:
     $$\text{Priority} = 0.35 \cdot \text{Weakness} + 0.20 \cdot \text{Difficulty} + 0.25 \cdot \text{Importance} + 0.20 \cdot \text{Centrality}$$
   * **Daily Bin-Packing**: Allocates tasks into customizable time-budget slots per day (Mon–Sun).
   * **Intelligent Rescheduler**: Redistributes missed study tasks without naive calendar shifts or breaking hard deadlines.
   * **What-If Sandbox**: In-memory hypothetical scenario modeling ("What if I study 1 hr/day?", "What if deadline is moved up 7 days?").

---

## 🎯 Key Features

* **⚡ Predefined & Custom Curricula**: Ready-to-use paths for DSA / Coding Interviews, Web Development, Machine Learning, Data Science, GATE CS, or custom goals.
* **📄 Document Syllabus Extraction**: Upload PDF/DOCX or paste text to parse topics, dependencies, and estimated study hours with interactive verification gates.
* **🗓️ Dynamic Multi-Step Onboarding**: Configure weekly availability per day (Mon–Sun), start date modes, topic confidence ratings (1=Very Weak to 5=Strong), revision intervals, and buffer days.
* **📊 Dark-Mode Analytics Dashboard**: Real-time progress trackers, workload velocity charts (Planned vs Completed hours), upcoming sessions, and streak counters.
* **📝 Diagnostic Quizzes**: Topic-level conceptual quizzes that automatically calibrate student topic confidence and trigger extra revision slots when weak scores are detected.
* **🤖 Grounded AI Study Coach**: Conversational assistant embedded with real-time student study state (active tasks, weak areas, deadline).

---

## 📁 Repository Structure

```text
ai-study-planner/
├── frontend/                     # React 19 + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/           # Navbar, AIAssistantModal, etc.
│   │   ├── context/              # AuthContext & Session Management
│   │   ├── pages/                # Dashboard, ScheduleView, Onboarding, SyllabusUpload, WhatIfSimulator, QuizView
│   │   ├── services/             # Axios API Client with Auto-Prefix Normalization (api.js)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json               # Vercel SPA routing rewrites
│   └── package.json
│
├── backend/                      # Node.js + Express ES Modules + Prisma ORM
│   ├── prisma/
│   │   └── schema.prisma         # Normalized Relational PostgreSQL Schema
│   ├── src/
│   │   ├── config/               # Prisma client singleton
│   │   ├── data/                 # Curated predefined curriculum templates
│   │   ├── middleware/           # JWT Auth guard & Demo fallback
│   │   ├── routes/               # /auth, /goals, /syllabus, /plans, /tasks, /quizzes, /assistant, /stats
│   │   └── server.js             # Dual-mounted Express server & health check
│   └── package.json
│
├── ai-service/                   # Python FastAPI Planning & AI Microservice
│   ├── app/
│   │   ├── ai/                   # Groq LLM integration, prompt templates, schemas
│   │   ├── api/                  # FastAPI routers (/schedule, /extract, /quiz, /assistant)
│   │   ├── scheduler/            # DAG topological sort, priority engine, rescheduler, what-if simulator
│   │   ├── syllabus/             # PDF / DOCX file parsers
│   │   └── main.py               # FastAPI entrypoint
│   ├── tests/                    # Scheduler verification test suite (test_scheduler.py)
│   └── requirements.txt
│
└── docker-compose.yml            # Local PostgreSQL development container
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
* **Node.js**: v18+ (tested on v22.x)
* **Python**: 3.10+ (tested on 3.13.x)
* **PostgreSQL**: Local instance or Docker container

---

### 2. Environment Setup

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key_minimum_32_characters
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ai_study_planner?schema=public"
AI_SERVICE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:5173"
```

#### AI Service (`ai-service/.env`):
```env
AI_PORT=8000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
BACKEND_URL=http://localhost:5000
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL="http://localhost:5000/api"
```

---

### 3. Run Services Locally

```bash
# 1. Start PostgreSQL (if using Docker)
docker compose up -d

# 2. Setup Database Schema
cd backend
npx prisma db push

# 3. Start AI Planning Service (Python FastAPI)
cd ../ai-service
python -m venv .venv
.\.venv\Scripts\activate      # Windows (or: source .venv/bin/activate on Unix)
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload

# 4. Start Backend (Node.js)
cd ../backend
npm install
npm run dev

# 5. Start Frontend (React + Vite)
cd ../frontend
npm install
npm run dev
```

The web application will be live at `http://localhost:5173`.

---

## 🧪 Automated Testing

Run the deterministic scheduling test suite verifying topological sort, DAG cycle handling, priority calculation, and redistribution:
```bash
cd ai-service
pytest tests/test_scheduler.py -v
```

---

## 🌐 Cloud Deployment Guide

| Service | Platform | Environment Variables |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | `VITE_API_URL=https://<your-backend>.onrender.com/api` |
| **Backend** | [Render](https://render.com) (Web Service, Node) | `DATABASE_URL`, `JWT_SECRET`, `AI_SERVICE_URL=https://<your-ai-service>.onrender.com` |
| **AI Service** | [Render](https://render.com) (Web Service, Python) | `GROQ_API_KEY`, `GROQ_MODEL=openai/gpt-oss-120b` |
| **Database** | [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com) | PostgreSQL Serverless Connection URI |

---

## 📄 License

MIT License — free for educational, personal, and commercial development.
