import { Router } from 'express';
import axios from 'axios';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Generate a study plan for a given goal
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { goalId, startDate, blackoutDates } = req.body;
    if (!goalId) {
      return res.status(400).json({ error: 'goalId is required' });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId: req.user.id },
      include: {
        topics: {
          include: {
            dependencies: true
          }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.topics.length === 0) {
      return res.status(400).json({ error: 'Goal has no topics. Please add or extract topics first.' });
    }

    // Format topics for Python Deterministic Engine
    const topicsPayload = goal.topics.map(t => ({
      id: t.id,
      title: t.title,
      unit_name: t.unitName,
      difficulty_level: t.difficultyLevel,
      base_estimated_minutes: t.baseEstimatedMinutes,
      user_confidence_score: t.userConfidenceScore,
      importance_score: 4,
      prerequisites: t.dependencies.map(d => d.prerequisiteTopicId)
    }));

    const planStart = startDate ? new Date(startDate) : new Date();
    const formattedStart = planStart.toISOString().split('T')[0];
    const formattedDeadline = goal.targetDeadline.toISOString().split('T')[0];

    const schedulerPayload = {
      topics: topicsPayload,
      availability: {
        weekly_hours: goal.weeklyAvailability,
        preferred_study_time: goal.preferredStudyTime,
        custom_start_time: "18:00",
        max_daily_minutes_cap: 360
      },
      constraints: {
        start_date: formattedStart,
        deadline: formattedDeadline,
        buffer_days: goal.bufferDays,
        revision_frequency_days: goal.revisionFrequencyDays,
        session_chunk_minutes: 45,
        include_quizzes: true,
        blackout_dates: Array.isArray(blackoutDates) ? blackoutDates : []
      }
    };

    // Call FastAPI deterministic planner
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/schedule/generate`, schedulerPayload, { timeout: 120000 });
    const planResult = aiResponse.data;

    // Save in database inside transaction
    // Deactivate any existing active plans for this goal
    await prisma.studyPlan.updateMany({
      where: { goalId: goal.id, isActive: true },
      data: { isActive: false }
    });

    // Create new StudyPlan record
    const savedPlan = await prisma.studyPlan.create({
      data: {
        goalId: goal.id,
        planVersion: 1,
        isActive: true,
        schedulingParameters: {
          stats: planResult.stats,
          buffer_dates: planResult.buffer_dates,
          is_feasible: planResult.is_feasible,
          warnings: planResult.warnings,
          suggestions: planResult.suggestions || [],
          startDate: formattedStart
        }
      }
    });

    // Bulk create StudyTasks
    if (planResult.tasks && planResult.tasks.length > 0) {
      await prisma.studyTask.createMany({
        data: planResult.tasks.map(t => ({
          studyPlanId: savedPlan.id,
          topicId: t.topic_id,
          scheduledDate: new Date(t.scheduled_date),
          startTime: t.start_time,
          endTime: t.end_time,
          durationMinutes: t.duration_minutes,
          taskType: t.task_type,
          status: 'Not Started',
          orderInDay: t.order_in_day
        }))
      });
    }

    // Fetch complete plan with tasks
    const completePlan = await prisma.studyPlan.findUnique({
      where: { id: savedPlan.id },
      include: {
        tasks: {
          include: { topic: true },
          orderBy: [{ scheduledDate: 'asc' }, { orderInDay: 'asc' }]
        }
      }
    });

    res.status(201).json({
      plan: completePlan,
      warnings: planResult.warnings,
      suggestions: planResult.suggestions || [],
      isFeasible: planResult.is_feasible,
      stats: planResult.stats
    });
  } catch (err) {
    console.error('Plan generation error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || 'Failed to generate study schedule';
    res.status(500).json({ error: msg });
  }
});

// Get active plan for a goal
router.get('/goal/:goalId', authenticate, async (req, res) => {
  try {
    const plan = await prisma.studyPlan.findFirst({
      where: {
        goalId: req.params.goalId,
        isActive: true,
        goal: { userId: req.user.id }
      },
      include: {
        goal: true,
        tasks: {
          include: { topic: true, progress: true },
          orderBy: [{ scheduledDate: 'asc' }, { orderInDay: 'asc' }]
        },
        scheduleChanges: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'No active study plan found for this goal' });
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
});

// Intelligent Rescheduling after missed days, vacations, or pace adjustments
router.post('/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { 
      today, 
      reason = 'Dynamic Schedule Redistribution',
      blackoutDates = [],
      missedTaskIds = [],
      adjustedDailyHoursIncrease = 0.0
    } = req.body;

    const plan = await prisma.studyPlan.findFirst({
      where: { id: req.params.id, goal: { userId: req.user.id } },
      include: {
        goal: {
          include: {
            topics: { include: { dependencies: true } }
          }
        },
        tasks: { include: { topic: true } }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    const todayStr = (today || new Date().toISOString().split('T')[0]);

    // Format tasks for Python rescheduler
    const existingTasksPayload = plan.tasks.map(t => ({
      id: t.id,
      topic_id: t.topicId,
      topic_title: t.topic.title,
      unit_name: t.topic.unitName,
      scheduled_date: t.scheduledDate.toISOString().split('T')[0],
      start_time: t.startTime || "18:00",
      end_time: t.endTime || "19:00",
      duration_minutes: t.durationMinutes,
      task_type: t.taskType,
      order_in_day: t.orderInDay,
      status: t.status
    }));

    const allTopicsPayload = plan.goal.topics.map(t => ({
      id: t.id,
      title: t.title,
      unit_name: t.unitName,
      difficulty_level: t.difficultyLevel,
      base_estimated_minutes: t.baseEstimatedMinutes,
      user_confidence_score: t.userConfidenceScore,
      importance_score: 4,
      prerequisites: t.dependencies.map(d => d.prerequisiteTopicId)
    }));

    const allMissedIds = [
      ...plan.tasks.filter(t => t.status !== 'Completed' && t.scheduledDate.toISOString().split('T')[0] <= todayStr).map(t => t.id),
      ...(Array.isArray(missedTaskIds) ? missedTaskIds : [])
    ];
    const uniqueMissedIds = Array.from(new Set(allMissedIds));

    const reschedulePayload = {
      today: todayStr,
      deadline: plan.goal.targetDeadline.toISOString().split('T')[0],
      weekly_hours: plan.goal.weeklyAvailability,
      completed_task_ids: plan.tasks.filter(t => t.status === 'Completed').map(t => t.id),
      missed_task_ids: uniqueMissedIds,
      existing_tasks: existingTasksPayload,
      all_topics: allTopicsPayload,
      buffer_days: plan.goal.bufferDays,
      preferred_study_time: plan.goal.preferredStudyTime,
      blackout_dates: Array.isArray(blackoutDates) ? blackoutDates : [],
      adjusted_daily_hours_increase: parseFloat(adjustedDailyHoursIncrease) || 0.0,
      reason
    };

    const aiRes = await axios.post(`${AI_SERVICE_URL}/schedule/reschedule`, reschedulePayload);
    const { result: newResult, diff } = aiRes.data;

    // Apply rescheduled changes in database
    await prisma.$transaction(async (tx) => {
      // 1. Delete all future uncompleted tasks
      await tx.studyTask.deleteMany({
        where: {
          studyPlanId: plan.id,
          status: { in: ['Not Started', 'In Progress', 'Skipped'] }
        }
      });

      // 2. Insert new redistributed future tasks
      const futureTasks = newResult.tasks.filter(t => t.status !== 'Completed');
      if (futureTasks.length > 0) {
        await tx.studyTask.createMany({
          data: futureTasks.map(t => ({
            studyPlanId: plan.id,
            topicId: t.topic_id,
            scheduledDate: new Date(t.scheduled_date),
            startTime: t.start_time,
            endTime: t.end_time,
            durationMinutes: t.duration_minutes,
            taskType: t.task_type,
            status: 'Not Started',
            orderInDay: t.order_in_day
          }))
        });
      }

      // 3. Log audit entry in schedule_changes
      await tx.scheduleChange.create({
        data: {
          studyPlanId: plan.id,
          reason: reason || 'Dynamic schedule redistribution',
          changeSummary: diff
        }
      });

      // 4. Increment plan version and update parameters
      await tx.studyPlan.update({
        where: { id: plan.id },
        data: { 
          planVersion: { increment: 1 },
          schedulingParameters: {
            ...plan.schedulingParameters,
            stats: newResult.stats,
            buffer_dates: newResult.buffer_dates,
            is_feasible: newResult.is_feasible,
            warnings: newResult.warnings,
            suggestions: newResult.suggestions || []
          }
        }
      });
    });

    const updatedPlan = await prisma.studyPlan.findUnique({
      where: { id: plan.id },
      include: {
        tasks: {
          include: { topic: true },
          orderBy: [{ scheduledDate: 'asc' }, { orderInDay: 'asc' }]
        },
        scheduleChanges: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    res.json({
      plan: updatedPlan,
      diff,
      suggestions: newResult.suggestions || []
    });
  } catch (err) {
    console.error('Reschedule error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || 'Failed to reschedule study plan';
    res.status(500).json({ error: msg });
  }
});

// What-If Simulation Sandbox (No DB changes)
router.post('/:id/what-if', authenticate, async (req, res) => {
  try {
    const { hypotheticalDeadline, hypotheticalWeeklyHours, hypotheticalBufferDays } = req.body;
    const plan = await prisma.studyPlan.findFirst({
      where: { id: req.params.id, goal: { userId: req.user.id } },
      include: {
        goal: { include: { topics: { include: { dependencies: true } } } },
        tasks: { include: { topic: true } }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Study plan not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const whatIfPayload = {
      today: todayStr,
      current_deadline: plan.goal.targetDeadline.toISOString().split('T')[0],
      hypothetical_deadline: hypotheticalDeadline ? new Date(hypotheticalDeadline).toISOString().split('T')[0] : null,
      hypothetical_weekly_hours: hypotheticalWeeklyHours || null,
      hypothetical_buffer_days: hypotheticalBufferDays !== undefined ? parseInt(hypotheticalBufferDays) : null,
      existing_tasks: plan.tasks.map(t => ({
        id: t.id,
        topic_id: t.topicId,
        topic_title: t.topic.title,
        unit_name: t.topic.unitName,
        scheduled_date: t.scheduledDate.toISOString().split('T')[0],
        start_time: t.startTime || "18:00",
        end_time: t.endTime || "19:00",
        duration_minutes: t.durationMinutes,
        task_type: t.taskType,
        order_in_day: t.orderInDay,
        status: t.status
      })),
      all_topics: plan.goal.topics.map(t => ({
        id: t.id,
        title: t.title,
        unit_name: t.unitName,
        difficulty_level: t.difficultyLevel,
        base_estimated_minutes: t.baseEstimatedMinutes,
        user_confidence_score: t.userConfidenceScore,
        importance_score: 4,
        prerequisites: t.dependencies.map(d => d.prerequisiteTopicId)
      }))
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/schedule/what-if`, whatIfPayload);
    res.json(aiResponse.data);
  } catch (err) {
    console.error('What-If simulation error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || 'Failed to execute what-if simulation';
    res.status(500).json({ error: msg });
  }
});

export default router;
