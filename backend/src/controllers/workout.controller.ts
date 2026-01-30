import type { Request, Response } from 'express';
import { workoutService } from '../services/workout.service.ts';

class WorkoutController {
    async createWorkout(req: any, res: Response) {
        try {
            console.log('Create Workout Request Payload:', req.payload);
            console.log('Create Workout Request Body:', req.body);
            const userId = req.payload._id;
            const workout = await workoutService.createWorkout({ ...req.body, belongsTo: userId });
            res.status(201).json(workout);
        } catch (error: any) {
            console.error('Error creating workout FULL:', error);
            res.status(500).json({ message: error.message || 'Error creating workout' });
        }
    }

    async getAllWorkouts(req: any, res: Response) {
        try {
            const userId = req.payload._id;
            const workouts = await workoutService.getAllWorkouts(userId);
            res.status(200).json(workouts);
        } catch (error) {
            console.error('Error fetching workouts:', error);
            res.status(500).json({ message: 'Error fetching workouts' });
        }
    }

    async getWorkoutById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const workout = await workoutService.getWorkoutById(id as string);

            if (!workout) {
                res.status(404).json({ message: 'Workout not found' });
                return;
            }

            res.status(200).json(workout);
        } catch (error) {
            console.error('Error fetching workout:', error);
            res.status(500).json({ message: 'Error fetching workout' });
        }
    }

    async updateWorkout(req: any, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.payload._id; // Get authenticated user ID

            const updatedWorkout = await workoutService.updateWorkout(id as string, userId, req.body);

            if (!updatedWorkout) {
                res.status(404).json({ message: 'Workout not found or unauthorized' });
                return;
            }

            res.status(200).json(updatedWorkout);
        } catch (error) {
            console.error('Error updating workout:', error);
            res.status(500).json({ message: 'Error updating workout' });
        }
    }

    async deleteWorkout(req: any, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.payload._id; // Get authenticated user ID

            const deletedWorkout = await workoutService.deleteWorkout(id as string, userId);

            if (!deletedWorkout) {
                res.status(404).json({ message: 'Workout not found or unauthorized' });
                return;
            }

            res.status(200).json(deletedWorkout);
        } catch (error) {
            console.error('Error deleting workout:', error);
            res.status(500).json({ message: 'Error deleting workout' });
        }
    }
}

export const workoutController = new WorkoutController();
