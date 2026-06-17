import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { startMockInterview, sendMessage, getMockInterview } from '../controllers/mockController.js';

const router = express.Router();

// Secure all mock interview endpoints using our auth middleware.
// This ensures 'req.user' is populated with the authenticated student's data.
router.use(protect);

// 1. POST /api/mock-interviews -> Start a new session
router.post('/', startMockInterview);

// 2. POST /api/mock-interviews/:id/message -> Send a candidate reply (asks next question or gets scorecard)
router.post('/:id/message', sendMessage);

// 3. GET /api/mock-interviews/:id -> Retrieve chat history and feedback (if completed)
router.get('/:id', getMockInterview);

export default router;
