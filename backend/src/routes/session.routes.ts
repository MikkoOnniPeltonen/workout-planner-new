import express from 'express';
import { sessionController } from '../controllers/session.controller.ts';
import { isAuthenticated } from '../middleware/session.middleware.ts';

const router = express.Router();

router.use(isAuthenticated);

// Static paths first, so they are not captured by /:id.
router.get('/', sessionController.listSessions);
router.get('/recent-exercises', sessionController.getRecentExercises);
router.get('/stats', sessionController.getStats);
router.get('/last-performance', sessionController.getLastPerformance);
router.get('/:id', sessionController.getSessionById);
router.post('/', sessionController.createSession);
router.put('/:id', sessionController.updateSession);
router.delete('/:id', sessionController.deleteSession);

export default router;
