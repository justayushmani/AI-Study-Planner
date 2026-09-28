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
      timeout: 60000,
    });

    res.json(aiResponse.data);
  } catch (err) {
    console.error('File extraction error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || 'Failed to extract syllabus from file';
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
      { timeout: 60000 }
    );

    res.json(aiResponse.data);
  } catch (err) {
    console.error('Text extraction error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || 'Failed to extract topics from text';
    res.status(500).json({ error: msg });
  }
});

export default router;
