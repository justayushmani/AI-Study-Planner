import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import goalRoutes from './routes/goal.routes.js';
import syllabusRoutes from './routes/syllabus.routes.js';
import planRoutes from './routes/plan.routes.js';
import taskRoutes from './routes/task.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import assistantRoutes from './routes/assistant.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── CORS Configuration ──────────────────────────────────────────────
// In production, restrict to the deployed frontend URL.
// In development, allow any origin for convenience.
const allowedOrigins = IS_PRODUCTION
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : true; // allow all origins in dev

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-dev-user-id'],
}));

// ── Logging ──────────────────────────────────────────────────────────
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));

// ── Body Parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Trust Proxy (Render / reverse-proxy deployments) ─────────────────
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-study-planner-backend',
    message: 'AI Study Planner Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-study-planner-backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes (Mounted under /api and dual-mounted at root for resilience)
const mountRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/goals`, goalRoutes);
  app.use(`${prefix}/syllabus`, syllabusRoutes);
  app.use(`${prefix}/plans`, planRoutes);
  app.use(`${prefix}/tasks`, taskRoutes);
  app.use(`${prefix}/quizzes`, quizRoutes);
  app.use(`${prefix}/assistant`, assistantRoutes);
  app.use(`${prefix}/stats`, statsRoutes);
};

mountRoutes('/api');
mountRoutes('');

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Linked to AI Service at ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
});

export default app;
