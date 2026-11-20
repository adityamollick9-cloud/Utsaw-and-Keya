import { Router } from 'express';
import { submitRsvp } from '../controllers/rsvpController.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public submission
router.post('/', submissionLimiter, submitRsvp);

export default router;

