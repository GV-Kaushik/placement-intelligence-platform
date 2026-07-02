import express from 'express';
import {
  registerUser,
  loginUser,
  googleLoginUser,
  getMe,
  updateMe,
  getProfileData,
  updateProfileData,
  getSkillsList,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLoginUser);

// Private/Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/profile', protect, getProfileData);
router.put('/profile', protect, updateProfileData);
router.get('/skills', protect, getSkillsList);

export default router;
