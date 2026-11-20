import { Router } from 'express';
import { submitBlessing } from '../controllers/blessingController.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public submission
router.post('/', submissionLimiter, submitBlessing);

export default router;

