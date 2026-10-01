import { Router } from 'express';
import axios from 'axios';
import prisma from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Generate or retrieve a quiz for a topic
router.post('/generate/:topicId', authenticate, async (req, res) => {
  try {
    const topic = await prisma.topic.findFirst({
      where: {
        id: req.params.topicId,
        goal: { userId: req.user.id }
      }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Call Python AI service for high-yield diagnostic quiz
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/quiz/generate`, {
      topic_title: topic.title,
      difficulty: topic.difficultyLevel > 3 ? 'Hard' : 'Medium',
      question_count: 4,
      notes: topic.description || ''
    });

    const quizData = aiResponse.data;

    // Save quiz in database
    const savedQuiz = await prisma.quiz.create({
      data: {
        topicId: topic.id,
        title: `Quiz: ${topic.title}`,
        questions: quizData.questions,
        totalQuestions: quizData.questions.length,
      }
    });

    res.status(201).json(savedQuiz);
  } catch (err) {
    const errorDetail = err.response?.data?.detail || err.response?.data?.error;
    const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (!err.response && err.message?.includes('Network Error'));

    console.error('Quiz generation error:', {
      message: err.message,
      code: err.code,
      aiServiceUrl: AI_SERVICE_URL,
      response: err.response?.data
    });

    const msg = isConnRefused
      ? `AI Quiz Service is unreachable at (${AI_SERVICE_URL}). Please verify that the ai-service is deployed and AI_SERVICE_URL is set in Render environment variables.`
      : (errorDetail || err.message || 'Failed to generate quiz');

    res.status(500).json({ error: msg });
  }
});

// Submit answers for evaluation and dynamic topic confidence calibration
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { quizId, userAnswers } = req.body; // userAnswers: { "0": 1, "1": 3, ... }
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { topic: true }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = quiz.questions;
    let score = 0;
    const diagnosticFeedback = [];

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.correct_index;
      if (isCorrect) score += 1;

      diagnosticFeedback.push({
        questionIndex: idx,
        question: q.question,
        selectedOption: selected !== undefined ? q.options[selected] : 'No answer',
        correctOption: q.options[q.correct_index],
        isCorrect,
        explanation: q.explanation
      });
    });

    const maxScore = questions.length;
    const percentage = Math.round((score / maxScore) * 100);

    // Save attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: req.user.id,
        score,
        maxScore,
        userAnswers,
        feedback: diagnosticFeedback
      }
    });

    // If score is weak (<60%), adjust user confidence score downward so scheduler prioritizes it
    let confidenceUpdated = false;
    if (percentage < 60 && quiz.topic.userConfidenceScore > 1) {
      await prisma.topic.update({
        where: { id: quiz.topic.id },
        data: { userConfidenceScore: 2 }
      });
      confidenceUpdated = true;
    } else if (percentage >= 80 && quiz.topic.userConfidenceScore < 5) {
      await prisma.topic.update({
        where: { id: quiz.topic.id },
        data: { userConfidenceScore: 4 }
      });
      confidenceUpdated = true;
    }

    res.json({
      attempt,
      percentage,
      score,
      maxScore,
      feedback: diagnosticFeedback,
      confidenceCalibrated: confidenceUpdated
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

export default router;
