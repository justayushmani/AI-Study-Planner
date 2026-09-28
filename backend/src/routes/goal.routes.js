import { Router } from 'express';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { PREDEFINED_GOALS } from '../data/predefinedGoals.js';

const router = Router();

// Get curated predefined goals (public/authenticated)
router.get('/predefined', (req, res) => {
  res.json(PREDEFINED_GOALS);
});

// List all user goals
router.get('/', authenticate, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { topics: true, studyPlans: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(goals);
  } catch (err) {
    console.error('List goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal (either from predefined template or custom onboarding)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      category,
      targetDeadline,
      proficiencyLevel,
      weeklyAvailability,
      preferredStudyTime,
      learningPreference,
      revisionFrequencyDays,
      bufferDays,
      predefinedGoalId,
      customTopics, // If user customized topics during onboarding
      weakTopicTitles // List of topics marked weak by user
    } = req.body;

    if (!title || !targetDeadline) {
      return res.status(400).json({ error: 'Title and target deadline are required' });
    }

      // Create Goal record directly
      const goal = await prisma.goal.create({
        data: {
          userId: req.user.id,
          title,
          category: category || 'General',
          targetDeadline: new Date(targetDeadline),
          proficiencyLevel: proficiencyLevel || 'Beginner',
          weeklyAvailability: weeklyAvailability || {
            Monday: 2.0, Tuesday: 2.0, Wednesday: 2.0,
            Thursday: 2.0, Friday: 2.0, Saturday: 3.0, Sunday: 3.0
          },
          preferredStudyTime: preferredStudyTime || 'Evening',
          learningPreference: learningPreference || 'Balanced',
          revisionFrequencyDays: revisionFrequencyDays ? parseInt(revisionFrequencyDays) : 7,
          bufferDays: bufferDays ? parseInt(bufferDays) : 3,
        }
      });

      // Topics source: customTopics or matching predefinedGoalId
      let topicsToCreate = [];
      if (customTopics && Array.isArray(customTopics) && customTopics.length > 0) {
        topicsToCreate = customTopics;
      } else if (predefinedGoalId) {
        const found = PREDEFINED_GOALS.find(g => g.id === predefinedGoalId);
        if (found) {
          topicsToCreate = found.topics;
        }
      }

      // Map to track created topic IDs by title / original id for dependency creation
      const topicMap = new Map();

      // Insert topics
      for (let i = 0; i < topicsToCreate.length; i++) {
        const t = topicsToCreate[i];
        const isWeak = weakTopicTitles && weakTopicTitles.includes(t.title);
        const confidence = isWeak ? 2 : (t.userConfidenceScore || 3);

        const createdTopic = await prisma.topic.create({
          data: {
            goalId: goal.id,
            unitName: t.unitName || 'General',
            title: t.title,
            description: t.description || '',
            difficultyLevel: t.difficultyLevel || 3,
            baseEstimatedMinutes: t.baseEstimatedMinutes || 60,
            orderIndex: i,
            userConfidenceScore: confidence,
            calculatedPriority: 1.0,
          }
        });
        topicMap.set(t.id || t.title, createdTopic.id);
        topicMap.set(t.title, createdTopic.id);
      }

      // Insert Topic Dependencies
      for (const t of topicsToCreate) {
        const currentDbTopicId = topicMap.get(t.id || t.title);
        if (t.prerequisites && Array.isArray(t.prerequisites)) {
          for (const prereqRef of t.prerequisites) {
            const prereqDbId = topicMap.get(prereqRef);
            if (prereqDbId && currentDbTopicId && prereqDbId !== currentDbTopicId) {
              await prisma.topicDependency.create({
                data: {
                  topicId: currentDbTopicId,
                  prerequisiteTopicId: prereqDbId,
                  isStrict: true
                }
              }).catch(() => {});
            }
          }
        }
      }

      res.status(201).json(goal);
    } catch (err) {
      console.error('Create goal error:', err);
      res.status(500).json({ error: 'Failed to create goal and topics' });
    }
  });

// Get single goal with topics and dependencies
router.get('/:id', authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        topics: {
          include: {
            dependencies: { include: { prerequisiteTopic: true } },
            prerequisites: { include: { topic: true } }
          },
          orderBy: { orderIndex: 'asc' }
        },
        studyPlans: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Delete goal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.goal.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
