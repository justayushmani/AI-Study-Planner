import { Router } from 'express';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Update task status (Not Started, In Progress, Completed, Skipped)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, actualMinutesSpent, notes } = req.body;
    const validStatuses = ['Not Started', 'In Progress', 'Completed', 'Skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const task = await prisma.studyTask.findFirst({
      where: {
        id: req.params.id,
        studyPlan: { goal: { userId: req.user.id } }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const t = await tx.studyTask.update({
        where: { id: task.id },
        data: { status }
      });

      if (status === 'Completed' || status === 'Skipped') {
        await tx.taskProgress.upsert({
          where: { studyTaskId: task.id },
          create: {
            studyTaskId: task.id,
            actualMinutesSpent: actualMinutesSpent || task.durationMinutes,
            completionStatus: status,
            notes: notes || ''
          },
          update: {
            actualMinutesSpent: actualMinutesSpent !== undefined ? actualMinutesSpent : task.durationMinutes,
            completionStatus: status,
            notes: notes !== undefined ? notes : undefined,
            completedAt: new Date()
          }
        });
      }

      return t;
    });

    res.json(updatedTask);
  } catch (err) {
    console.error('Update task status error:', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Get tasks for today across active goals
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const tasks = await prisma.studyTask.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        studyPlan: {
          isActive: true,
          goal: { userId: req.user.id }
        }
      },
      include: {
        topic: true,
        studyPlan: { include: { goal: true } }
      },
      orderBy: { orderInDay: 'asc' }
    });

    res.json(tasks);
  } catch (err) {
    console.error('Fetch today tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch today tasks' });
  }
});

export default router;
