import express from 'express';
import { exerciseController } from '../controllers/exercise.controller.ts';

const router = express.Router();

router.get('/', exerciseController.getAllExercises);
router.get('/:id', exerciseController.getExerciseById);

export default router;
