import express from 'express';
import {
  getExperiences,
  getExperienceById,
  createExperience,
  toggleUpvoteExperience,
  getExperienceComments,
  createExperienceComment,
} from '../controllers/experienceController.js';
import { protect, protectOptional } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protectOptional, getExperiences);
router.get('/:id', protectOptional, getExperienceById);
router.post('/', protect, createExperience);
router.post('/:id/upvote', protect, toggleUpvoteExperience);
router.get('/:id/comments', protectOptional, getExperienceComments);
router.post('/:id/comments', protect, createExperienceComment);

export default router;
