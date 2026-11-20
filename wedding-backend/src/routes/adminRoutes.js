import { Router } from 'express';
import { login, getMe, getStatistics } from '../controllers/adminController.js';
import {
  getAllRsvps,
  getRsvpById,
  deleteRsvp,
  exportRsvpsCsv
} from '../controllers/rsvpController.js';
import {
  getAllBlessings,
  deleteBlessing,
  exportBlessingsCsv
} from '../controllers/blessingController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Authentication
router.post('/login', loginLimiter, login);
router.get('/me', authenticateAdmin, getMe);

// Statistics
router.get('/statistics', authenticateAdmin, getStatistics);

// RSVPs management
router.get('/rsvps', authenticateAdmin, getAllRsvps);
router.get('/rsvps/:id', authenticateAdmin, getRsvpById);
router.delete('/rsvps/:id', authenticateAdmin, deleteRsvp);
router.get('/export/rsvps', authenticateAdmin, exportRsvpsCsv);

// Blessings management
router.get('/blessings', authenticateAdmin, getAllBlessings);
router.delete('/blessings/:id', authenticateAdmin, deleteBlessing);
router.get('/export/blessings', authenticateAdmin, exportBlessingsCsv);

export default router;

