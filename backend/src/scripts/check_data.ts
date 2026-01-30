
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MuscleGroup } from '../models/MuscleGroup.model.ts';
import { Exercise } from '../models/Exercise.model.ts';
import { Workout } from '../models/Workout.model.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workout-planner';

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Check Muscle Groups
        const muscleGroups = await MuscleGroup.find({});
        console.log(`\nFound ${muscleGroups.length} Muscle Groups:`);
        muscleGroups.forEach(mg => console.log(` - ${mg.name} (${mg._id})`));

        // 2. Check Exercises
        const exercises = await Exercise.find({}).limit(5).populate('belongsTo');
        console.log(`\nFound ${await Exercise.countDocuments()} Exercises. Sample of 5:`);
        exercises.forEach(ex => {
            console.log(` - ${ex.name}: belongsTo =`, JSON.stringify(ex.belongsTo));
        });

        // 3. Check Workouts
        const workouts = await Workout.find({}).limit(5).populate({
            path: 'exercises',
            populate: { path: 'belongsTo' } // Deep populate
        });
        console.log(`\nFound ${await Workout.countDocuments()} Workouts. Sample:`);
        workouts.forEach(w => {
            console.log(`\nWorkout: ${w.name}`);
            console.log(`Exercises: ${w.exercises.length}`);
            w.exercises.forEach((ex: any) => {
                const groups = ex.belongsTo ? (Array.isArray(ex.belongsTo) ? ex.belongsTo.map((g: any) => g.name).join(', ') : 'Not Array') : 'Null';
                console.log(`   - ${ex.name} (Groups: ${groups})`);
            });
        });

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkData();
