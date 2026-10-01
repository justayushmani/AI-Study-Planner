import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Upload PDF / DOCX / TXT syllabus file for AI extraction
router.post('/extract-file', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a syllabus file (PDF, DOCX, or TXT)' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/extract/file`, formData, {
      headers: formData.getHeaders(),
      timeout: 120000,
    });

    res.json(aiResponse.data);
  } catch (err) {
    const errorDetail = err.response?.data?.detail || err.response?.data?.error;
    const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (!err.response && err.message?.includes('Network Error'));

    console.error('File extraction error:', {
      message: err.message,
      code: err.code,
      aiServiceUrl: AI_SERVICE_URL,
      response: err.response?.data
    });

    const msg = isConnRefused
      ? `AI Syllabus Service is unreachable at (${AI_SERVICE_URL}). Please verify that the ai-service is deployed and AI_SERVICE_URL is set in Render environment variables.`
      : (errorDetail || err.message || 'Failed to extract syllabus from file');

    res.status(500).json({ error: msg });
  }
});

// Extract syllabus from raw text input
router.post('/extract-text', authenticate, async (req, res) => {
  try {
    const { rawText, courseName } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Syllabus text cannot be empty' });
    }

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/extract/text`,
      { raw_text: rawText, course_name: courseName || 'Custom Course' },
      { timeout: 120000 }
    );

    res.json(aiResponse.data);
  } catch (err) {
    const errorDetail = err.response?.data?.detail || err.response?.data?.error;
    const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (!err.response && err.message?.includes('Network Error'));

    console.error('Text extraction error:', {
      message: err.message,
      code: err.code,
      aiServiceUrl: AI_SERVICE_URL,
      response: err.response?.data
    });

    const msg = isConnRefused
      ? `AI Syllabus Service is unreachable at (${AI_SERVICE_URL}). Please verify that the ai-service is deployed and AI_SERVICE_URL is set in Render environment variables.`
      : (errorDetail || err.message || 'Failed to extract topics from text');

    res.status(500).json({ error: msg });
  }
});

export default router;
