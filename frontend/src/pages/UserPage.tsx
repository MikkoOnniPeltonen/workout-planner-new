import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import exercisesService from '../services/exercises.service';
import workoutsService from '../services/workouts.service';

// Types
interface Exercise {
  _id: string;
  name: string;
  belongsTo: { name: string }[];
}

interface Workout {
  _id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
}

function UserPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Form State
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [workoutsRes, exercisesRes] = await Promise.all([
        workoutsService.getAllWorkouts(),
        exercisesService.getAllExercises(),
      ]);
      setWorkouts(workoutsRes.data);
      setAvailableExercises(exercisesRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkoutName.trim() || selectedExercises.length === 0) return;

    setIsCreating(true);
    try {
      if (editingWorkout) {
        await workoutsService.updateWorkout(editingWorkout._id, {
          name: newWorkoutName,
          exercises: selectedExercises
        });
      } else {
        await workoutsService.createWorkout({
          name: newWorkoutName,
          exercises: selectedExercises,
        });
      }
      await fetchData(); // Refresh list
      setShowCreateModal(false);
      setEditingWorkout(null);
      // Reset form
      setNewWorkoutName('');
      setSelectedExercises([]);
    } catch (error) {
      console.error('Error saving workout', error);
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateModal = () => {
    setEditingWorkout(null);
    setNewWorkoutName('');
    setSelectedExercises([]);
    setShowCreateModal(true);
  }

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setNewWorkoutName(workout.name);
    // specific exercises mapping
    setSelectedExercises(workout.exercises.map(ex => ex._id));
    setShowCreateModal(true);
  };

  const toggleExerciseSelection = (id: string) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((exId) => exId !== id) : [...prev, id],
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              My Workouts
            </h1>
            <p className="text-gray-400 mt-2">Manage and track your training sessions</p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-6 rounded-full shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
          >
            + Create New Workout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {workouts.map((workout) => (
              <motion.div
                key={workout._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onDoubleClick={() => handleEditWorkout(workout)}
                className="cursor-pointer"
                title="Double click to edit"
              >
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:border-purple-500/50 transition-colors duration-300 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex justify-between items-start">
                      <span>{workout.name}</span>
                      <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded">
                        {new Date(workout.createdAt).toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Exercises
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {workout.exercises.map((ex) => (
                          <span
                            key={ex._id}
                            className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-700"
                          >
                            {ex.name}
                          </span>
                        ))}
                        {workout.exercises.length === 0 && (
                          <span className="text-gray-600 text-sm italic">No exercises added</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No workouts yet. Start by creating one!</p>
          </div>
        )}
      </div>

      {/* Simple Modal Implementation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">{editingWorkout ? 'Edit Workout' : 'Create Workout'}</h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-workout-form" onSubmit={handleCreateWorkout} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="workout-name" className="text-sm font-medium text-gray-300">
                    Workout Name
                  </label>
                  <input
                    id="workout-name"
                    type="text"
                    value={newWorkoutName}
                    onChange={(e) => setNewWorkoutName(e.target.value)}
                    placeholder="e.g., Leg Day Destruction"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    Select Exercises ({selectedExercises.length})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {availableExercises.map((ex) => (
                      <div
                        key={ex._id}
                        onClick={() => toggleExerciseSelection(ex._id)}
                        className={`cursor-pointer px-4 py-3 rounded-lg text-sm border transition-all duration-200 ${selectedExercises.includes(ex._id)
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                      >
                        {ex.name}
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
              {editingWorkout && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this workout?')) {
                      await workoutsService.deleteWorkout(editingWorkout._id);
                      await fetchData();
                      setShowCreateModal(false);
                      setEditingWorkout(null);
                    }
                  }}
                  className="mr-auto bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-workout-form"
                disabled={isCreating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isCreating ? 'Saving...' : (editingWorkout ? 'Update Workout' : 'Create Workout')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default UserPage;
