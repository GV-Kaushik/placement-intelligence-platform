import express from 'express';
import {
  getExperiences,
  getExperienceById,
  createExperience,
  toggleUpvoteExperience,
} from '../controllers/experienceController.js';
import { protect, protectOptional } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protectOptional, getExperiences);
router.get('/:id', protectOptional, getExperienceById);
router.post('/', protect, createExperience);
router.post('/:id/upvote', protect, toggleUpvoteExperience);

export default router;
