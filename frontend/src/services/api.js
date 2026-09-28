import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('study_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Fallback demo user ID for zero-barrier preview
  const demoUser = localStorage.getItem('study_user');
  if (demoUser) {
    try {
      const parsed = JSON.parse(demoUser);
      if (parsed.id) {
        config.headers['x-dev-user-id'] = parsed.id;
      }
    } catch (e) {}
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email, password, fullName) => {
    const res = await api.post('/auth/register', { email, password, fullName });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const goalService = {
  getPredefined: async () => {
    const res = await api.get('/goals/predefined');
    return res.data;
  },
  getGoals: async () => {
    const res = await api.get('/goals');
    return res.data;
  },
  getGoal: async (id) => {
    const res = await api.get(`/goals/${id}`);
    return res.data;
  },
  createGoal: async (payload) => {
    const res = await api.post('/goals', payload);
    return res.data;
  },
  deleteGoal: async (id) => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  }
};

export const syllabusService = {
  extractText: async (rawText, courseName) => {
    const res = await api.post('/syllabus/extract-text', { rawText, courseName });
    return res.data;
  },
  extractFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/syllabus/extract-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const planService = {
  generatePlan: async (goalId, startDate) => {
    const res = await api.post('/plans/generate', { goalId, startDate });
    return res.data;
  },
  getPlanByGoal: async (goalId) => {
    const res = await api.get(`/plans/goal/${goalId}`);
    return res.data;
  },
  reschedulePlan: async (planId, today) => {
    const res = await api.post(`/plans/${planId}/reschedule`, { today });
    return res.data;
  },
  simulateWhatIf: async (planId, payload) => {
    const res = await api.post(`/plans/${planId}/what-if`, payload);
    return res.data;
  }
};

export const taskService = {
  updateStatus: async (taskId, status, actualMinutesSpent, notes) => {
    const res = await api.patch(`/tasks/${taskId}/status`, { status, actualMinutesSpent, notes });
    return res.data;
  },
  getTodayTasks: async () => {
    const res = await api.get('/tasks/today');
    return res.data;
  }
};

export const quizService = {
  generateQuiz: async (topicId) => {
    const res = await api.post(`/quizzes/generate/${topicId}`);
    return res.data;
  },
  submitQuiz: async (quizId, userAnswers) => {
    const res = await api.post('/quizzes/submit', { quizId, userAnswers });
    return res.data;
  }
};

export const assistantService = {
  chat: async (messages, goalId) => {
    const res = await api.post('/assistant/chat', { messages, goalId });
    return res.data;
  }
};

export const statsService = {
  getDashboard: async () => {
    const res = await api.get('/stats/dashboard');
    return res.data;
  }
};

export default api;
