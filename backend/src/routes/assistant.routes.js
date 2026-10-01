import { Router } from 'express';
import axios from 'axios';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, goalId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Pull student's active context from database
    const activeGoal = await prisma.goal.findFirst({
      where: {
        userId: req.user.id,
        ...(goalId ? { id: goalId } : { status: 'Active' })
      },
      include: {
        topics: {
          select: { title: true, userConfidenceScore: true }
        },
        studyPlans: {
          where: { isActive: true },
          include: {
            tasks: {
              where: { scheduledDate: { gte: new Date() } },
              take: 3,
              orderBy: [{ scheduledDate: 'asc' }, { orderInDay: 'asc' }]
            }
          }
        }
      }
    });

    const completedTasksCount = await prisma.studyTask.count({
      where: {
        status: 'Completed',
        studyPlan: { goal: { userId: req.user.id } }
      }
    });

    const missedTasksCount = await prisma.studyTask.count({
      where: {
        status: { in: ['Not Started', 'In Progress'] },
        scheduledDate: { lt: new Date() },
        studyPlan: { goal: { userId: req.user.id } }
      }
    });

    const weakTopics = activeGoal
      ? activeGoal.topics.filter(t => t.userConfidenceScore <= 2).map(t => t.title)
      : [];

    const nextTask = activeGoal?.studyPlans[0]?.tasks[0]?.title || 'No pending tasks';

    const studyContext = {
      goal_title: activeGoal?.title || 'General Self-Study',
      deadline: activeGoal?.targetDeadline?.toISOString().split('T')[0] || 'Flexible',
      completed_count: completedTasksCount,
      missed_count: missedTasksCount,
      weak_topics: weakTopics,
      next_task: nextTask
    };

    const aiRes = await axios.post(`${AI_SERVICE_URL}/assistant/chat`, {
      messages,
      study_context: studyContext
    });

  } catch (err) {
    const errorDetail = err.response?.data?.detail || err.response?.data?.error;
    const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (!err.response && err.message?.includes('Network Error'));

    console.error('Assistant chat error:', {
      message: err.message,
      code: err.code,
      aiServiceUrl: AI_SERVICE_URL,
      response: err.response?.data
    });

    const msg = isConnRefused
      ? `AI Assistant Service is unreachable at (${AI_SERVICE_URL}). Please verify that the ai-service is deployed and AI_SERVICE_URL is set in Render environment variables.`
      : (errorDetail || err.message || 'Failed to communicate with AI study assistant');

    res.status(500).json({ error: msg });
  }
});

export default router;
