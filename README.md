# AI Study Planner — Adaptive Learning & Intelligent Scheduling System

An enterprise-grade, hybrid AI-powered study planning web application. The platform dynamically creates personalized study schedules based on student goals, syllabus extraction, deadlines, daily availability, weak areas, and topic prerequisite dependencies.

---

## 🧠 Core Architecture: Hybrid AI + Deterministic Engine

The system uses a strict **separation of concerns**:
* **LLM Layer (Groq GPT OSS 120B / Llama 3.3 70B)**: Natural-language curriculum understanding, syllabus document extraction, high-yield diagnostic quiz generation, and contextual AI study coaching.
* **Deterministic Scheduling Engine (Python FastAPI)**: Mathematical constraint satisfaction, Directed Acyclic Graph (DAG) prerequisite enforcement, cycle detection, composite priority weighting, daily time-budget bin-packing, spaced revision allocation, and intelligent missed-day redistribution.

```text
[ React 19 + Vite + Tailwind CSS + Recharts ]
                      │
                      ▼ (HTTP / REST)
     [ Node.js + Express.js + Prisma ORM ]
                      │
                      ├──────────────────────────┐
                      ▼                          ▼
               [ PostgreSQL ]          [ Python FastAPI Service ]
                                                 │
                                                 ├──────────────────────┐
                                                 ▼                      ▼
                                      [ Deterministic Engine ]      [ Groq LLM ]
                                       - DAG Prerequisite Graph      - Syllabus Parsing
                                       - Priority Calculator         - Quiz Generator
                                       - Rescheduler & What-If       - AI Study Coach
```

---

## 🎯 Key Features

1. **Personalized Goal Generation**:
   * Predefined curriculum paths for DSA / Coding Interviews, Web Development, Machine Learning, Data Science, GATE CS, and Semester Exams with prerequisite-modeled topics.
2. **Custom Goal / Syllabus Upload**:
   * Digital extraction from PDF, DOCX, and raw text.
   * **Verification Gate**: Displays extracted units, topics, estimated times, and dependencies for user review and editing before scheduling.
3. **Multi-Step Onboarding**:
   * Day-by-day availability sliders (Mon–Sun), target deadline, initial topic confidence ratings (1=Very Weak to 5=Strong), revision frequency, and buffer days.
4. **Deterministic Priority & DAG Prerequisite Engine**:
   * Topological sorting guarantees foundational topics are scheduled before advanced topics.
   * Priority formula: $\text{Priority} = 0.35 \cdot \text{Weakness} + 0.20 \cdot \text{Difficulty} + 0.25 \cdot \text{Importance} + 0.20 \cdot \text{Centrality}$.
5. **Intelligent Rescheduling**:
   * Detects missed study sessions and dynamically redistributes remaining workload across future available days without simply shifting the calendar or breaking the deadline.
6. **What-If Planning Sandbox**:
   * Pure in-memory simulation engine allowing students to test hypothetical scenarios ("What if I only study 1 hour/day?", "What if I finish 7 days earlier?") with risk and feasibility assessments.
7. **Diagnostic Quizzes & Dynamic Priority Calibration**:
   * Conceptual multiple-choice questions. Weak quiz performance automatically lowers topic confidence, triggering the scheduler to allocate extra revision slots.
8. **Context-Aware AI Study Coach**:
   * Grounded with student context: active goal, upcoming deadlines, completed tasks, and weak areas.
9. **Executive Dark-Mode Dashboard**:
   * Recharts workload velocity (planned vs completed hours), active streak tracker, today's actionable task list, and priority focus cards.

---

## 📁 Repository Structure

```text
ai-study-planner/
├── .gitignore
├── .env.example
├── docker-compose.yml            # Local PostgreSQL container configuration
├── README.md
│
├── frontend/                     # React 19 + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/           # Navbar, AIAssistantModal
│   │   ├── context/              # AuthContext
│   │   ├── pages/                # Dashboard, ScheduleView, Onboarding, SyllabusUpload, WhatIfSimulator, QuizView
│   │   ├── services/             # Axios API client (api.js)
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Node.js + Express ES Modules + Prisma
│   ├── prisma/
│   │   └── schema.prisma         # Normalized relational schema
│   ├── src/
│   │   ├── config/               # Prisma database client
│   │   ├── data/                 # Predefined curriculum templates
│   │   ├── middleware/           # JWT auth guard
│   │   ├── routes/               # /auth, /goals, /syllabus, /plans, /tasks, /quizzes, /assistant, /stats
│   │   └── server.js             # Express entrypoint
│   ├── package.json
│   └── .env.example
│
└── ai-service/                   # Python FastAPI Planning & AI Service
    ├── app/
    │   ├── ai/                   # Groq LLM provider, base interface, prompts, schemas
    │   ├── api/                  # FastAPI routes (/schedule, /extract, /quiz, /assistant)
    │   ├── scheduler/            # Deterministic engine (planner, dependency, priority, rescheduler, what_if)
    │   ├── syllabus/             # PDF and DOCX document parsers
    │   └── main.py               # FastAPI application
    ├── tests/                    # Deterministic test suite (test_scheduler.py)
    ├── requirements.txt
    └── .env.example
```

---

## 🚀 Local Setup Instructions

### 1. Prerequisites
* **Node.js**: v18+ (tested on v22.12.0)
* **Python**: 3.10+ (tested on 3.13.9)
* **PostgreSQL**: Docker or local service

---

### 2. Environment Configuration

Copy `.env.example` in each service directory:

1. **Root / Backend** (`backend/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_minimum_32_characters
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ai_study_planner?schema=public"
   AI_SERVICE_URL="http://localhost:8000"
   FRONTEND_URL="http://localhost:5173"
   ```

2. **AI Service** (`ai-service/.env`):
   ```env
   AI_PORT=8000
   GROQ_API_KEY=your_actual_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   BACKEND_URL=http://localhost:5000
   ```

*(Note: If `GROQ_API_KEY` is omitted, the AI service runs in graceful offline mock mode so you can test all planning workflows immediately).*

---

### 3. Start Database (PostgreSQL)

If using Docker:
```bash
docker compose up -d
```

Run Prisma database setup:
```bash
cd backend
npx prisma db push
```

---

### 4. Start AI & Planning Service (Python FastAPI)

```bash
cd ai-service
.\.venv\Scripts\activate
uvicorn app.main:app --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

---

### 5. Start Backend API (Node.js Express)

```bash
cd backend
npm run dev
```
Backend will be live at: `http://localhost:5000`

---

### 6. Start Frontend (React + Vite)

```bash
cd frontend
npm run dev
```
Web application will open at: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the test suite for the deterministic scheduling engine:
```bash
cd ai-service
.\.venv\Scripts\python.exe -m pytest tests/test_scheduler.py -o pythonpath=. -v
```
All 6 tests verify:
* DAG cycle detection and topological sorting
* Prerequisite centrality and composite priority calculations
* Time-slot bin-packing and buffer day partitioning
* Intelligent missed-day redistribution
* In-memory What-If scenario simulation
