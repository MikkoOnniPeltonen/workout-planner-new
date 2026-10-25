import express from 'express';
import { workoutController } from '../controllers/workout.controller.ts';
import { isAuthenticated } from '../middleware/session.middleware.ts';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', workoutController.getAllWorkouts);
router.get('/:id', workoutController.getWorkoutById);
router.post('/', workoutController.createWorkout);
router.put('/:id', workoutController.updateWorkout);
router.delete('/:id', workoutController.deleteWorkout);

export default router;
