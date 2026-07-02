import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createApplication,
  getApplications,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/applicationController.js';

const router = express.Router();

// Authenticate all operations
router.use(protect);

router.post('/', createApplication);
router.get('/', getApplications);
router.put('/:id', updateApplicationStatus);
router.delete('/:id', deleteApplication);

export default router;
