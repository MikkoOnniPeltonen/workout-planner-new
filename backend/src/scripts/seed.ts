
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MuscleGroup } from '../models/MuscleGroup.model.ts';
import { Exercise } from '../models/Exercise.model.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workout-planner';

const muscleGroupsData = [
    { name: 'Back' },
    { name: 'Chest' },
    { name: 'Legs' },
    { name: 'Shoulders' },
    { name: 'Arms' }, // Biceps/Triceps
    { name: 'Core' },
    { name: 'Upper Back' } // Traps/Rhomboids
];

const exercisesData = [
    // Back
    { name: 'Deadlift', groups: ['Back', 'Legs'] },
    { name: 'Pull Up', groups: ['Back', 'Arms'] },
    { name: 'Bent Over Row', groups: ['Back'] },
    { name: 'Lat Pulldown', groups: ['Back'] },

    // Chest
    { name: 'Bench Press', groups: ['Chest', 'Arms'] },
    { name: 'Push Up', groups: ['Chest', 'Core', 'Arms'] },
    { name: 'Incline Dumbbell Press', groups: ['Chest'] },

    // Legs
    { name: 'Squat', groups: ['Legs', 'Core'] },
    { name: 'Lunge', groups: ['Legs'] },
    { name: 'Leg Press', groups: ['Legs'] },
    { name: 'Romanian Deadlift', groups: ['Legs', 'Back'] },

    // Shoulders
    { name: 'Overhead Press', groups: ['Shoulders', 'Arms'] },
    { name: 'Lateral Raise', groups: ['Shoulders'] },
    { name: 'Front Raise', groups: ['Shoulders'] },

    // Arms
    { name: 'Bicep Curl', groups: ['Arms'] },
    { name: 'Tricep Dip', groups: ['Arms', 'Chest'] },
    { name: 'Hammer Curl', groups: ['Arms'] },

    // Core
    { name: 'Plank', groups: ['Core'] },
    { name: 'Russian Twist', groups: ['Core'] },
    { name: 'Leg Raise', groups: ['Core'] },
    { name: 'Crunch', groups: ['Core'] }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await MuscleGroup.deleteMany({});
        await Exercise.deleteMany({});
        console.log('Cleared MuscleGroups and Exercises');

        // Create Muscle Groups
        const createdGroups = await MuscleGroup.create(muscleGroupsData);
        console.log(`Created ${createdGroups.length} Muscle Groups`);

        // Create Map for quick lookup
        const groupMap = new Map();
        createdGroups.forEach(g => groupMap.set(g.name, g._id));

        // Create Exercises with References
        const exerciseDocs = exercisesData.map(ex => {
            const belongsToIds = ex.groups.map(gName => {
                const id = groupMap.get(gName);
                if (!id) console.warn(`Warning: Group '${gName}' not found for exercise '${ex.name}'`);
                return id;
            }).filter(id => !!id);

            return {
                name: ex.name.toLowerCase(), // Ensure lowercase as per schema
                description: `Standard ${ex.name} exercise`,
                belongsTo: belongsToIds
            };
        });

        const createdExercises = await Exercise.create(exerciseDocs);
        console.log(`Created ${createdExercises.length} Exercises`);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

seed();
