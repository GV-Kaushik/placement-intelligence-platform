import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateRoadmap,
  getRoadmaps,
  getRoadmapById,
  deleteRoadmap
} from '../controllers/roadmapController.js';

const router = express.Router();

// All roadmap operations require authentication
router.use(protect);

// 1. POST /api/roadmaps -> Generate study plan
router.post('/', generateRoadmap);

// 2. GET /api/roadmaps -> List history of roadmaps
router.get('/', getRoadmaps);

// 3. GET /api/roadmaps/:id -> Retrieve a specific roadmap
router.get('/:id', getRoadmapById);

// 4. DELETE /api/roadmaps/:id -> Delete a specific roadmap
router.delete('/:id', deleteRoadmap);

export default router;
