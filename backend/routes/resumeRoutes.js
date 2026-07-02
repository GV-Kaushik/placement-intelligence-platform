import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/upload.js';
import {
  uploadAndEvaluateResume,
  getResumes,
  deleteResume
} from '../controllers/resumeController.js';

const router = express.Router();

// All resume routes require authentication
router.use(protect);

// POST /api/resumes/upload - Upload and evaluate PDF resume
router.post('/upload', upload.single('resume'), uploadAndEvaluateResume);

// GET /api/resumes - Get previous resume evaluations
router.get('/', getResumes);

// DELETE /api/resumes/:id - Delete a previous resume evaluation
router.delete('/:id', deleteResume);

export default router;
