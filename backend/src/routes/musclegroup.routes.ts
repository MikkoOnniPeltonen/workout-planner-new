import express from 'express';
import { muscleGroupController } from '../controllers/musclegroup.controller.ts';

const router = express.Router();

router.get('/', muscleGroupController.getAllMuscleGroups);

export default router;
