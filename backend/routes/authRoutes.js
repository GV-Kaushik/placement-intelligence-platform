import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private/Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

export default router;
