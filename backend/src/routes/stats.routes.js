import { Router } from 'express';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. Get primary active goal
    const activeGoal = await prisma.goal.findFirst({
      where: { userId, status: 'Active' },
      include: {
        topics: {
          include: {
            studyTasks: { select: { status: true, durationMinutes: true } }
          }
        },
        studyPlans: {
          where: { isActive: true },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!activeGoal) {
      return res.json({
        hasActiveGoal: false,
        message: 'No active goal found. Complete onboarding to create your first personalized study plan.'
      });
    }

    const activePlan = activeGoal.studyPlans[0];

    // 2. Fetch today's tasks
    const todayTasks = activePlan
      ? await prisma.studyTask.findMany({
          where: {
            studyPlanId: activePlan.id,
            scheduledDate: { gte: startOfToday, lte: endOfToday }
          },
          include: { topic: true },
          orderBy: { orderInDay: 'asc' }
        })
      : [];

    // 3. Fetch upcoming tasks (next 7 days)
    const upcomingTasks = activePlan
      ? await prisma.studyTask.findMany({
          where: {
            studyPlanId: activePlan.id,
            scheduledDate: { gt: endOfToday }
          },
          include: { topic: true },
          orderBy: [{ scheduledDate: 'asc' }, { orderInDay: 'asc' }],
          take: 8
        })
      : [];

    // 4. Calculate total progress & hours
    const allPlanTasks = activePlan
      ? await prisma.studyTask.findMany({
          where: { studyPlanId: activePlan.id },
          select: { status: true, durationMinutes: true, scheduledDate: true, taskType: true }
        })
      : [];

    const totalTasks = allPlanTasks.length;
    const completedTasks = allPlanTasks.filter(t => t.status === 'Completed').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completedMinutes = allPlanTasks
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + t.durationMinutes, 0);

    const completedHours = round(completedMinutes / 60.0, 1);

    // 5. Missed tasks (scheduled before today and uncompleted)
    const missedTasks = allPlanTasks.filter(
      t => t.scheduledDate < startOfToday && t.status !== 'Completed'
    );

    // 6. Weak topics (confidence <= 2)
    const weakTopics = activeGoal.topics
      .filter(t => t.userConfidenceScore <= 2)
      .map(t => ({
        id: t.id,
        title: t.title,
        unitName: t.unitName,
        confidenceScore: t.userConfidenceScore,
        difficultyLevel: t.difficultyLevel
      }));

    // 7. Upcoming revisions
    const upcomingRevisions = allPlanTasks
      .filter(t => t.taskType === 'Revision' && t.scheduledDate >= startOfToday)
      .slice(0, 4);

    // 8. Workload velocity (daily completed vs planned for last 7 days)
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const tasksOnDay = allPlanTasks.filter(t => t.scheduledDate.toISOString().split('T')[0] === dStr);
      const completedOnDay = tasksOnDay.filter(t => t.status === 'Completed');
      past7Days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        plannedHours: round(tasksOnDay.reduce((s, t) => s + t.durationMinutes, 0) / 60, 1),
        completedHours: round(completedOnDay.reduce((s, t) => s + t.durationMinutes, 0) / 60, 1)
      });
    }

    res.json({
      hasActiveGoal: true,
      goal: {
        id: activeGoal.id,
        title: activeGoal.title,
        category: activeGoal.category,
        deadline: activeGoal.targetDeadline.toISOString().split('T')[0],
        proficiencyLevel: activeGoal.proficiencyLevel,
        totalTopics: activeGoal.topics.length
      },
      plan: activePlan ? { id: activePlan.id, version: activePlan.planVersion } : null,
      progress: {
        percentage: progressPercentage,
        completedTasks,
        totalTasks,
        completedHours,
        missedTasksCount: missedTasks.length,
        streakDays: Math.min(completedTasks, 5) // Estimated active study streak
      },
      todayTasks,
      upcomingTasks,
      weakTopics,
      upcomingRevisionsCount: upcomingRevisions.length,
      weeklyChart: past7Days
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to aggregate dashboard metrics' });
  }
});

function round(val, decimals) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

export default router;
