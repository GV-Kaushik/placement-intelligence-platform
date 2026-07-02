import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateRoadmap,
  getRoadmaps,
  deleteRoadmap
} from '../controllers/roadmapController.js';

const router = express.Router();

// All roadmap operations require authentication
router.use(protect);

// 1. POST /api/roadmaps -> Generate study plan
router.post('/', generateRoadmap);

// 2. GET /api/roadmaps -> List history of roadmaps
router.get('/', getRoadmaps);

// 3. DELETE /api/roadmaps/:id -> Delete a specific roadmap
router.delete('/:id', deleteRoadmap);

export default router;
