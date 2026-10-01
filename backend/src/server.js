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

// Security & Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-dev-user-id, X-Dev-User-Id, *');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
