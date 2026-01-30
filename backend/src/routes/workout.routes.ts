import express from 'express';
import { workoutController } from '../controllers/workout.controller.ts';
import { isAuthenticated } from '../middleware/jwt.middleware.ts';

const router = express.Router();

router.get('/', isAuthenticated, workoutController.getAllWorkouts);
router.get('/:id', workoutController.getWorkoutById);
router.post('/', isAuthenticated, workoutController.createWorkout);
router.put('/:id', isAuthenticated, workoutController.updateWorkout);
router.delete('/:id', isAuthenticated, workoutController.deleteWorkout);

export default router;
